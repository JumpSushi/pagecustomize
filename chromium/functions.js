function toggleRemovalMode(enabled) {
  if (enabled) {
    document.addEventListener('mouseover', highlightElement, true);
    document.addEventListener('mouseout', unhighlightElement, true);
    document.addEventListener('click', removeElement, true);
    document.body.style.setProperty('cursor', 'crosshair', 'important');
    document.addEventListener('keydown', handleEscapeKey);
  } else {
    document.removeEventListener('mouseover', highlightElement, true);
    document.removeEventListener('mouseout', unhighlightElement, true);
    document.removeEventListener('click', removeElement, true);
    document.body.style.cursor = 'default';
    document.removeEventListener('keydown', handleEscapeKey);
    removeHighlightFromAll();
  }
  window.removalMode = enabled;
}

function handleEscapeKey(e) {
  if (e.key === 'Escape' && window.removalMode) {
    window.removalMode = false;
    if (window.removalObservers) {
      window.removalObservers.forEach(observer => observer.disconnect());
      window.removalObservers.clear();
    }
    document.removeEventListener('mouseover', highlightElement, true);
    document.removeEventListener('mouseout', unhighlightElement, true);
    document.removeEventListener('click', removeElement, true);
    document.body.style.cursor = 'default';
    removeHighlightFromAll();
    
    // tell the extension
    chrome.storage.local.set({ removalMode: false });
    chrome.runtime.sendMessage({ action: 'removalModeChanged', value: false });
  }
}
document.removeEventListener('keydown', handleEscapeKey);
document.addEventListener('keydown', handleEscapeKey);

function highlightElement(e) {
  if (!window.removalMode) return;
  e.target.style.outline = '2px solid red';
}

function unhighlightElement(e) {
  if (!window.removalMode) return;
  e.target.style.outline = '';
}

function removeHighlightFromAll() {
  const elements = document.querySelectorAll('*');
  elements.forEach(el => el.style.outline = '');
}

function removeElement(e) {
  if (!window.removalMode) return;
  
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  
  if (e.target === document.body || e.target === document.documentElement) return;
  
  const selector = getUniqueSelector(e.target);
  let elementToRemove = e.target;
  
  const isAd = (el) => {
    if (!el) return false;
    const text = (el.className + ' ' + el.id + ' ' + el.tagName).toLowerCase();
    return text.includes('ad') || text.includes('gpt') || 
           text.includes('banner') || text.includes('iframe') || text.includes('paywall');
  };
  if (isAd(elementToRemove)) {
    while (elementToRemove.parentElement && isAd(elementToRemove.parentElement)) {
      elementToRemove = elementToRemove.parentElement;
    }
  }

  const forceRemove = (el) => {
    try {
      // if cross-origin iframe, this could throw
      if (el.tagName === 'IFRAME') {
        el.src = 'about:blank';
        el.srcdoc = '';
      }

      if (el.shadowRoot) {
        el.shadowRoot.innerHTML = '';
      }

      const styles = {
        display: 'none',
        visibility: 'hidden',
        opacity: '0',
        position: 'fixed',
        left: '-9999px'
      };

      Object.entries(styles).forEach(([prop, value]) => {
        el.style.setProperty(prop, value, 'important');
      });

      el.innerHTML = '';
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
      
      if (!window.tempRemovedElements) {
        window.tempRemovedElements = new Set();
      }
      window.tempRemovedElements.add(selector);
      
      return true;
    } catch (err) {
      console.error('Failed to remove:', err);
      return false;
    }
  };

  if (forceRemove(elementToRemove)) {
    if (!window.removedElements) {
      window.removedElements = new Set();
    }
    window.removedElements.add(selector);

    //update storage immediately
    chrome.storage.local.get(['websites'], function(result) {
      const hostname = window.location.hostname;
      const websites = result.websites || {};
      if (!websites[hostname]) websites[hostname] = {};
      websites[hostname].removedElements = Array.from(window.removedElements);
      chrome.storage.local.set({ websites });
    });

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            if (node.matches && node.matches(selector)) {
              forceRemove(node);
            }
            node.querySelectorAll && node.querySelectorAll(selector).forEach(forceRemove);
          }
        });
      });
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });

    if (!window.removalObservers) window.removalObservers = new Map();
    window.removalObservers.set(selector, observer);
  }

  return false;
}

function isValidSelector(selector) {
  try {
    document.querySelector(selector);
    return true;
  } catch (e) {
    return false;
  }
}

function getUniqueSelector(element) {
  //id first, pls
  if (element.id && /^[a-zA-Z]/.test(element.id)) {
    return `#${CSS.escape(element.id)}`;
  }
  
  const path = [];
  while (element.parentElement) {
    let tag = element.tagName.toLowerCase();
    const parent = element.parentElement;
    const siblings = Array.from(parent.children).filter(child => 
      child.tagName === element.tagName
    );
    
    if (siblings.length > 1) {
      const index = siblings.indexOf(element) + 1;
      tag += `:nth-of-type(${index})`;
    }
    
    path.unshift(tag);
    element = parent;
  }
  
  return path.join(' > ');
}

function applyElementRemoval(selector) {
  if (!isValidSelector(selector)) {
    console.warn(`Skipping invalid selector: ${selector}`);
    return;
  }

  try {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      if (el.tagName === 'IFRAME') {
        el.src = 'about:blank';
        el.srcdoc = '';
      }
      
      const styles = {
        display: 'none !important',
        visibility: 'hidden !important',
        opacity: '0 !important',
        position: 'fixed !important',
        left: '-9999px !important'
      };

      Object.entries(styles).forEach(([prop, value]) => {
        el.style.setProperty(prop, value.split('!')[0], 'important');
      });

      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });
  } catch (err) {
    console.warn(`Failed to apply removal for selector: ${selector}`, err);
  }
}

function loadSavedRemovedElements() {
  const hostname = window.location.hostname;
  chrome.storage.local.get(['websites'], function(result) {
    if (result.websites && result.websites[hostname]) {
      const settings = result.websites[hostname];
      if (settings.removedElements && Array.isArray(settings.removedElements)) {
        window.removedElements = new Set(settings.removedElements);
        settings.removedElements.forEach(selector => {
          applyElementRemoval(selector);
        });
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', loadSavedRemovedElements);
window.addEventListener('load', loadSavedRemovedElements);

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'getRemoved') {
    const removedElements = new Set([
      ...(window.removedElements || []),
      ...(window.tempRemovedElements || [])
    ]);
    sendResponse({ removedElements: Array.from(removedElements) });
  }
  return true;
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'toggleRemoval') {
    toggleRemovalMode(msg.value);
    sendResponse({ status: 'ok' });
  } else if (msg.action === 'resetPage') {
    const result = resetPage();
    sendResponse(result);
  } else if (msg.action === 'getRemoved') {
    sendResponse({ removedElements: Array.from(window.removedElements || []) });
  } else if (msg.action === 'updateRemovedElements') {
    window.removedElements = new Set(msg.elements);
    sendResponse({ status: 'ok' });
  }
  return true;
});

function resetPage() {
  const elements = document.getElementsByTagName('*');
  for (let element of elements) {
    element.removeAttribute('style');
  }
  location.reload();
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'getRemoved') {
    sendResponse({ removedElements: Array.from(window.removedElements) });
  }
  return true;
});