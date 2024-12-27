window.removedElements = new Set();

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
  if (e.key === 'Escape') {
    toggleRemovalMode(false);
    chrome.storage.local.set({ removalMode: false });
    chrome.runtime.sendMessage({
      action: 'removalModeChanged',
      value: false
    });
  }
}

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
  
  if (e.target !== document.body && e.target !== document.documentElement) {
    const selector = getUniqueSelector(e.target);
    window.removedElements.add(selector);
    e.target.remove();
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
          try {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => el.remove());
          } catch (err) {
            console.error('Error removing element:', err);
          }
        });
      }
    }
  });
}
document.addEventListener('DOMContentLoaded', loadSavedRemovedElements);

function getUniqueSelector(element) {
  if (element.id) return `#${element.id}`;
  const path = [];
  while (element.parentElement) {
    const index = Array.from(element.parentElement.children).indexOf(element) + 1;
    path.unshift(`${element.tagName}:nth-child(${index})`);
    element = element.parentElement;
  }
  return path.join(' > ');
}

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