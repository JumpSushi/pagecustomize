document.addEventListener('DOMContentLoaded', async function() {
  const controls = document.getElementById('controls');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      throw new Error('This extension cannot be used on Chrome system pages');
    }

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['functions.js', 'content.js']
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    const result = await chrome.storage.local.get(['fontFamily', 'fontSize', 'textColor', 'textTransform', 'removalMode', 'enableCustomCSS', 'customCSS']);
    let currentUrl = new URL(tab.url).hostname;

    const elements = {
      fontFamily: document.getElementById('fontFamily'),
      fontSize: document.getElementById('fontSize'),
      fontSizeValue: document.getElementById('fontSizeValue'),
      textColor: document.getElementById('textColor'),
      textTransform: document.getElementById('textTransform'),
      toggleRemove: document.getElementById('toggleRemove'),
      removeStatus: document.getElementById('removeStatus'),
      removalInstructions: document.getElementById('removalInstructions'),
      reset: document.getElementById('reset'),
      saveSettings: document.getElementById('saveSettings'),
      deleteSettings: document.getElementById('deleteSettings'),
      savedStatus: document.getElementById('savedStatus'),
      customCSS: document.getElementById('customCSS'),
      enableCustomCSS: document.getElementById('enableCustomCSS'),
      customCSSWrapper: document.getElementById('customCSSWrapper')
    };

    if (result.fontFamily) elements.fontFamily.value = result.fontFamily;
    if (result.fontSize) {
      elements.fontSize.value = result.fontSize;
      elements.fontSizeValue.textContent = result.fontSize + 'px';
    }
    if (result.textColor) elements.textColor.value = result.textColor;
    if (result.textTransform) elements.textTransform.value = result.textTransform;
    if (result.enableCustomCSS) {
      elements.enableCustomCSS.checked = true;
      elements.customCSSWrapper.classList.remove('hidden');
    }
    if (result.customCSS) elements.customCSS.value = result.customCSS;

    chrome.tabs.sendMessage(tab.id, { action: 'getCurrentStyles' }, function(response) {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
        showError(chrome.runtime.lastError.message);
        return;
      }
      if (response && response.textColor) {
        elements.textColor.value = response.textColor;
      }
      if (response && response.textTransform) {
        elements.textTransform.value = response.textTransform;
      }
    });

    chrome.storage.local.get(['websites'], function(result) {
      if (result.websites && result.websites[currentUrl]) {
        const settings = result.websites[currentUrl];
        elements.fontFamily.value = settings.fontFamily || "";
        elements.fontSize.value = settings.fontSize || "16";
        elements.fontSizeValue.textContent = (settings.fontSize || "16") + "px";
        elements.textColor.value = settings.textColor || "#000000";
        elements.textTransform.value = settings.textTransform || "none";

        if (settings.fontFamily) injectCSS(tab.id, `* { font-family: ${settings.fontFamily} !important; }`);
        if (settings.fontSize) injectCSS(tab.id, `* { font-size: ${settings.fontSize}px !important; }`);
        if (settings.textColor) injectCSS(tab.id, `* { color: ${settings.textColor} !important; }`);
        if (settings.textTransform) injectCSS(tab.id, `* { text-transform: ${settings.textTransform} !important; }`);
        if (settings.customCSS && elements.enableCustomCSS.checked) injectCSS(tab.id, settings.customCSS);
      }
    });

    elements.fontFamily.addEventListener('change', async (e) => {
      try {
        const fontFamily = e.target.value;
        await chrome.storage.local.set({ fontFamily });
        await injectCSS(tab.id, `* { font-family: ${fontFamily} !important; }`);
        const defaultOption = elements.fontFamily.querySelector('option[value=""]');
        if (defaultOption) {
          defaultOption.remove();
        }
      } catch (error) {
        showError(error.message);
      }
    });

    elements.fontSize.addEventListener('input', async (e) => {
      try {
        const fontSize = e.target.value;
        elements.fontSizeValue.textContent = fontSize + 'px';
        await chrome.storage.local.set({ fontSize });
        await injectCSS(tab.id, `* { font-size: ${fontSize}px !important; }`);
      } catch (error) {
        showError(error.message);
      }
    });

    elements.textColor.addEventListener('input', async (e) => {
      try {
        const textColor = e.target.value;
        await chrome.storage.local.set({ textColor });
        await injectCSS(tab.id, `* { color: ${textColor} !important; }`);
      } catch (error) {
        showError(error.message);
      }
    });

    elements.textTransform.addEventListener('change', async (e) => {
      try {
        const textTransform = e.target.value;
        await chrome.storage.local.set({ textTransform });
        await injectCSS(tab.id, `* { text-transform: ${textTransform} !important; }`);
      } catch (error) {
        showError(error.message);
      }
    });

    elements.customCSS.addEventListener('change', async (e) => {
      try {
        const customCSS = e.target.value;
        await saveWebsiteSettings(currentUrl, { customCSS });
        await injectCSS(tab.id, customCSS);
      } catch (error) {
        showError(error.message);
      }
    });

    elements.customCSS.addEventListener('input', async (e) => {
      try {
        const customCSS = e.target.value;
        await saveWebsiteSettings(currentUrl, { customCSS });
      } catch (error) {
        showError(error.message);
      }
    });

    elements.enableCustomCSS.addEventListener('change', function() {
      elements.customCSSWrapper.classList.toggle('hidden');
      chrome.storage.local.set({ enableCustomCSS: this.checked });
    });

    elements.saveSettings.addEventListener('click', async () => {
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'getRemoved' });
        const customCSS = elements.customCSS.value;
        const enableCustomCSS = elements.enableCustomCSS.checked;

        const settings = {
          fontFamily: elements.fontFamily.value,
          fontSize: elements.fontSize.value !== "16" ? elements.fontSize.value : "",
          textColor: elements.textColor.value !== "#000000" ? elements.textColor.value : "",
          textTransform: elements.textTransform.value,
          removedElements: response.removedElements || [],
          customCSS: enableCustomCSS ? customCSS : "",
          enableCustomCSS: enableCustomCSS
        };

        // Save website specific settings
        const result = await chrome.storage.local.get(['websites']);
        const websites = result.websites || {};
        websites[currentUrl] = settings;
        await chrome.storage.local.set({ websites });

        // Save global settings
        await chrome.storage.local.set({ 
          customCSS,
          enableCustomCSS
        });

        elements.savedStatus.textContent = 'Settings saved for this website';
        elements.savedStatus.style.display = 'block';
        setTimeout(() => {
          elements.savedStatus.style.display = 'none';
        }, 2000);

      } catch (error) {
        showError(error.message);
      }
    });

    elements.deleteSettings.addEventListener('click', async () => {
      try {
        const result = await chrome.storage.local.get(['websites']);
        if (result.websites) {
          delete result.websites[currentUrl];
          await chrome.storage.local.set({ websites: result.websites });
        }

        elements.fontFamily.value = "";
        elements.fontSize.value = "16";
        elements.fontSizeValue.textContent = "16px";
        elements.textColor.value = "#000000";
        elements.textTransform.value = "none";

        elements.savedStatus.textContent = 'Settings deleted for this website';
        elements.savedStatus.style.display = 'block';

        await chrome.tabs.sendMessage(tab.id, { action: 'resetPage' });
        setTimeout(() => {
          chrome.tabs.reload(tab.id);
        }, 500);
      } catch (error) {
        showError(error.message);
      }
    });

    let removalMode = result.removalMode || false;
    if (removalMode) {
      elements.removeStatus.style.display = 'block';
      elements.removalInstructions.style.display = 'block';
      elements.toggleRemove.textContent = 'Disable Element Removal';
      elements.toggleRemove.classList.add('active');
    }

    elements.toggleRemove.addEventListener('click', async () => {
      try {
        removalMode = !removalMode;
        elements.removeStatus.style.display = removalMode ? 'block' : 'none';
        elements.removalInstructions.style.display = removalMode ? 'block' : 'none';
        elements.toggleRemove.textContent = removalMode ? 'Disable Element Removal' : 'Enable Element Removal';
        elements.toggleRemove.classList.toggle('active', removalMode);

        await chrome.storage.local.set({ removalMode });
        await chrome.tabs.sendMessage(tab.id, {
          action: 'toggleRemoval',
          value: removalMode
        });
      } catch (error) {
        showError(error.message);
      }
    });

    document.addEventListener('keydown', async (e) => {
      if (e.key === 'Escape' && removalMode) {
        removalMode = false;
        elements.removeStatus.style.display = 'none';
        elements.removalInstructions.style.display = 'none';
        elements.toggleRemove.textContent = 'Enable Element Removal';
        elements.toggleRemove.classList.remove('active');

        await chrome.storage.local.set({ removalMode: false });
        await chrome.tabs.sendMessage(tab.id, {
          action: 'toggleRemoval',
          value: false
        });
      }
    });

    elements.reset.addEventListener('click', async () => {
      try {
        elements.fontFamily.value = "";
        elements.fontSize.value = "16";
        elements.fontSizeValue.textContent = "16px";
        elements.textColor.value = "#000000";
        elements.textTransform.value = "none";

        await chrome.storage.local.clear();

        const resetPromise = new Promise((resolve, reject) => {
          chrome.tabs.sendMessage(tab.id, {
            action: 'resetPage'
          }, (response) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(response);
            }
          });
        });

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Reset timed out')), 5000);
        });

        await Promise.race([resetPromise, timeoutPromise]);
        await chrome.tabs.reload(tab.id);
      } catch (error) {
        showError(error.message);
      }
    });

    // Load saved state
    chrome.storage.local.get(['enableCustomCSS', 'customCSS'], function(result) {
      if (result.enableCustomCSS) {
        elements.enableCustomCSS.checked = true;
        elements.customCSSWrapper.classList.remove('hidden');
      }
      if (result.customCSS) {
        elements.customCSS.value = result.customCSS;
      }
    });

  } catch (error) {
    showError(error.message);
    controls.classList.add('disabled');
  }
});

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
}

async function injectCSS(tabId, css) {
  await chrome.scripting.insertCSS({
    target: { tabId: tabId },
    css: css
  });
}

async function saveWebsiteSettings(url, settings) {
  const result = await chrome.storage.local.get(['websites']);
  const websites = result.websites || {};
  websites[url] = { ...websites[url], ...settings };
  await chrome.storage.local.set({ websites });
}