function initializeExtension() {
  const fontFace = new FontFace('OpenDyslexic', 
    `url(${chrome.runtime.getURL('fonts/OpenDyslexic-Regular.otf')})`);
  fontFace.load().then(function(loadedFace) {
    document.fonts.add(loadedFace);
  });

  loadSavedRemovedElements();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExtension, {once: true});
} else {
  initializeExtension();
}

function loadSavedRemovedElements() {
  const hostname = window.location.hostname;
  chrome.storage.local.get(['websites'], function(result) {
    if (result.websites && result.websites[hostname]) {
      const settings = result.websites[hostname];
      if (settings.removedElements && Array.isArray(settings.removedElements)) {
        window.removedElements = new Set(settings.removedElements);
        
        const validSelectors = settings.removedElements.filter(selector => {
          try {
            if (selector.match(/#:[a-z0-9]+$/)) {
              return false; 
            }
            document.querySelector(selector);
            return true;
          } catch (e) {
            console.warn(`Invalid selector skipped: ${selector}`);
            return false;
          }
        });

        validSelectors.forEach(selector => {
          try {
            document.querySelectorAll(selector).forEach(el => {
              if (el.tagName === 'IFRAME') {
                el.src = 'about:blank';
              }
              el.remove();
            });
          } catch (err) {
            console.warn(`Failed to remove element with selector: ${selector}`, err);
          }
        });

        if (window.removedElementObserver) {
          window.removedElementObserver.disconnect();
        }
        
        window.removedElementObserver = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === 1) { // Element node
                validSelectors.forEach(selector => {
                  try {
                    if (node.matches && node.matches(selector)) {
                      node.remove();
                    }
                    node.querySelectorAll && node.querySelectorAll(selector).forEach(el => el.remove());
                  } catch (err) {
                    // skip bloody invalid sectors 
                  }
                });
              }
            });
          });
        });

        window.removedElementObserver.observe(document.documentElement, {
          childList: true,
          subtree: true
        });
      }
    }
  });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'toggleRemoval') {
    toggleRemovalMode(msg.value);
    sendResponse({ status: 'ok' });
  } else if (msg.action === 'resetPage') {
    const result = resetPage();
    sendResponse(result);
  } else if (msg.action === 'getRemoved') {
    sendResponse({ removedElements: Array.from(window.removedElements || []) });
  } else if (msg.action === 'getCurrentStyles') {
    const computedStyle = window.getComputedStyle(document.body);
    sendResponse({ 
      textColor: rgb2hex(computedStyle.color),
      textTransform: computedStyle.textTransform
    });
  } else if (msg.action === 'updateRemovedElements') {
    window.removedElements = new Set(msg.elements);
    sendResponse({ status: 'ok' });
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
  let savedSettings = null;
  let tempSettings = null;

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) {
          applyStyles(node, savedSettings, tempSettings);
          const children = node.getElementsByTagName('*');
          for (let child of children) {
            applyStyles(child, savedSettings, tempSettings);
          }
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  chrome.storage.local.get(['websites', 'tempSettings'], function(result) {
    tempSettings = result.tempSettings;
    loadSavedRemovedElements();

    if (result.websites && result.websites[currentUrl]) {
      savedSettings = result.websites[currentUrl];
      
      if (savedSettings.customCSS && savedSettings.enableCustomCSS) {
        const style = document.createElement('style');
        style.textContent = savedSettings.customCSS;
        document.head.appendChild(style);
      }
      
      const pageElements = document.getElementsByTagName('*');
      for (let el of pageElements) {
        applyStyles(el, savedSettings, tempSettings);
      }
      
      if (savedSettings.removedElements) {
        window.removedElements = new Set(savedSettings.removedElements);
        savedSettings.removedElements.forEach(selector => {
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

function applyStyles(element, savedSettings, tempSettings) {
  if (savedSettings) {
    if (savedSettings.hasOwnProperty('fontSize') && savedSettings.fontSize) {
      const defaultSize = "16";
      if (savedSettings.fontSize !== defaultSize) {
        element.style.fontSize = savedSettings.fontSize + 'px';
      } else {
        element.style.removeProperty('font-size');
      }
    }
    if (savedSettings.hasOwnProperty('fontFamily')) {
      if (!savedSettings.fontFamily || savedSettings.fontFamily === "") {
        element.style.removeProperty('font-family');
      } else {
        element.style.fontFamily = savedSettings.fontFamily;
      }
    }

    if (savedSettings.hasOwnProperty('textTransform')) {
      if (!savedSettings.textTransform || savedSettings.textTransform === "") {
        element.style.removeProperty('text-transform');
      } else {
        element.style.textTransform = savedSettings.textTransform;
      }
    }

    if (savedSettings.hasOwnProperty('textColor')) {
      if (savedSettings.textColor) {
        element.style.color = savedSettings.textColor;
      } else {
        element.style.color = "#000000"; 
      }
    }
  }

  if (tempSettings) {
    if (tempSettings.fontSize && tempSettings.fontSize !== "16") {
      element.style.fontSize = tempSettings.fontSize + 'px';
    }
    if (tempSettings.textColor && tempSettings.textColor !== "#000000") {
      element.style.color = tempSettings.textColor;
    }
    if (tempSettings.textTransform) {
      element.style.textTransform = tempSettings.textTransform;
    }
  }
}

function resetPage() {
  const elements = document.getElementsByTagName('*');
  for (let element of elements) {
    element.removeAttribute('style');
  }
  location.reload();
}

function getUniqueSelector(element) {
  if (element.id && !/\d{3,}/.test(element.id)) {
    return `#${CSS.escape(element.id)}`;
  }
  const classes = Array.from(element.classList)
    .filter(c => !c.includes('style-scope') && !c.includes('yt-'))
    .map(c => `.${CSS.escape(c)}`)
    .join('');
    
  if (classes) {
    return `${element.tagName.toLowerCase()}${classes}`;
  }
  
  let nth = 1;
  let sibling = element;
  while (sibling.previousElementSibling) {
    nth++;
    sibling = sibling.previousElementSibling;
  }
  
  return `${element.tagName.toLowerCase()}:nth-child(${nth})`;
}