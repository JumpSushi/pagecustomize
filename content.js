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
        element.style.removeProperty('color');
      }
    }
  }

  if (tempSettings) {
    // Only apply temp font size if explicitly set and different from default
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