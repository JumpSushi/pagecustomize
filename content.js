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
        window.removedElements = new Set(settings.removedElements);
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