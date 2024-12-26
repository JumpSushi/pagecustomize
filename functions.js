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
    const selector = getSelector(e.target);
    window.removedElements.add(selector);
    e.target.remove();
    
    chrome.storage.local.get(['websites'], function(result) {
      const websites = result.websites || {};
      const settings = websites[window.location.hostname] || {};
      settings.removedElements = Array.from(window.removedElements);
      websites[window.location.hostname] = settings;
      chrome.storage.local.set({ websites });
    });
  }
}

function getSelector(element) {
  if (element.id) return '#' + element.id;
  if (element.className) return '.' + Array.from(element.classList).join('.');
  let path = element.tagName.toLowerCase();
  let parent = element.parentNode;
  while (parent && parent !== document.body) {
    let index = Array.from(parent.children).indexOf(element) + 1;
    path = `${parent.tagName.toLowerCase()} > ${path}:nth-child(${index})`;
    parent = parent.parentNode;
  }
  return path;
}

function resetPage() {
  const elements = document.getElementsByTagName('*');
  for (let element of elements) {
    element.removeAttribute('style');
  }
  location.reload();
}