if (typeof removedElements === 'undefined') {
  var removedElements = new Set();
}
let removalMode = false;

function toggleRemovalMode(enable) {
    removalMode = enable;
    if (removalMode) {
        document.addEventListener('mouseover', highlightElement, true);
        document.addEventListener('mouseout', unhighlightElement, true);
        document.addEventListener('click', removeElement, true);
        document.addEventListener('keydown', handleEscapeKey);
    } else {
        document.removeEventListener('mouseover', highlightElement, true);
        document.removeEventListener('mouseout', unhighlightElement, true);
        document.removeEventListener('click', removeElement, true);
        document.removeEventListener('keydown', handleEscapeKey);
        removeHighlightFromAll();
    }
}

function handleEscapeKey(e) {
  if (e.key === 'Escape') {
    toggleRemovalMode(false);
  }
}

function highlightElement(e) {
  if (!removalMode) return;
  e.target.style.outline = '2px solid red';
}

function unhighlightElement(e) {
  if (!removalMode) return;
  e.target.style.outline = '';
}

function removeHighlightFromAll() {
  const elements = document.querySelectorAll('*');
  elements.forEach(el => el.style.outline = '');
}

function removeElement(event) {
    if (!removalMode) return;
    event.preventDefault();
    event.stopPropagation();
    const element = event.target;
    removedElements.add(getUniqueSelector(element));
    element.remove();
    
    chrome.storage.local.get(['websites'], function(result) {
      const websites = result.websites || {};
      const settings = websites[window.location.hostname] || {};
      settings.removedElements = Array.from(removedElements);
      websites[window.location.hostname] = settings;
      chrome.storage.local.set({ websites });
    });
}

function getUniqueSelector(element) {
    if (element.id) {
        return `#${element.id}`;
    }
    const path = [];
    while (element.parentElement) {
        const index = Array.from(element.parentElement.children).indexOf(element) + 1;
        path.unshift(`${element.tagName}:nth-child(${index})`);
        element = element.parentElement;
    }
    return path.join(' > ');
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'toggleRemoval') {
    toggleRemovalMode(msg.value);
    sendResponse({status: 'success'});
  } else if (msg.action === 'resetPage') {
    const result = resetPage();
    sendResponse(result);
  } else if (msg.action === 'getRemoved') {
    sendResponse({ removedElements: Array.from(removedElements) });
  } else if (msg.action === 'getCurrentStyles') {
    const computedStyle = window.getComputedStyle(document.body);
    sendResponse({ 
      textColor: rgb2hex(computedStyle.color),
      textTransform: computedStyle.textTransform
    });
  }
  return true;
});

function rgb2hex(rgb) {
  if (rgb.startsWith('#')) return rgb;
  const [r, g, b] = rgb.match(/\d+/g);
  return "#" + ((1 << 24) + (+r << 16) + (+g << 8) + +b).toString(16).slice(1);
}

document.addEventListener('DOMContentLoaded', () => {
  const currentUrl = window.location.hostname;
  chrome.storage.local.get(['websites'], function(result) {
    if (result.websites && result.websites[currentUrl]) {
      const settings = result.websites[currentUrl];
      
      const pageElements = document.getElementsByTagName('*');
      for (let el of pageElements) {
        if (settings.fontFamily) el.style.fontFamily = settings.fontFamily;
        if (settings.fontSize && settings.fontSize !== "16") {
          el.style.fontSize = settings.fontSize + 'px';
        }
        if (settings.textColor && settings.textColor !== "#000000") {
          el.style.color = settings.textColor;
        }
        if (settings.textTransform && settings.textTransform !== "none") {
          el.style.textTransform = settings.textTransform;
        }
      }
      
      if (settings.removedElements) {
        removedElements = new Set(settings.removedElements);
        settings.removedElements.forEach(selector => {
          document.querySelectorAll(selector).forEach(el => el.remove());
        });
      }
    }
  });

  chrome.storage.local.get(['removalMode'], function(result) {
    if (result.removalMode) {
      toggleRemovalMode(true);
    }
  });
});