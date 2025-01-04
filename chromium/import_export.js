document.addEventListener('DOMContentLoaded', async function() {
  const exportButton = document.getElementById('exportButton');
  const importButton = document.getElementById('importButton');
  const importFile = document.getElementById('importFile');
  const websiteSelect = document.getElementById('websiteSelect');

  const result = await chrome.storage.local.get(['websites']);
  const websites = result.websites || {};
  
  Object.keys(websites).forEach(url => {
    const option = document.createElement('option');
    option.value = url;
    option.textContent = url;
    websiteSelect.appendChild(option);
  });

  exportButton.addEventListener('click', async () => {
    const selectedWebsite = websiteSelect.value;
    const result = await chrome.storage.local.get(null);
    let exportData;

    if (selectedWebsite === 'all') {
      exportData = result;
    } else {
      exportData = {
        websites: {
          [selectedWebsite]: result.websites[selectedWebsite]
        }
      };
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", selectedWebsite === 'all' ? 
      "all_settings.json" : `${selectedWebsite}_settings.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  });

  importButton.addEventListener('click', () => {
    const file = importFile.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const settings = JSON.parse(event.target.result);
          if (settings.websites) {
            const result = await chrome.storage.local.get(['websites']);
            const currentWebsites = result.websites || {};
            const newWebsites = { ...currentWebsites, ...settings.websites };
            await chrome.storage.local.set({ websites: newWebsites });
            
            // Get current tab to apply CSS immediately
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            for (const [hostname, siteSettings] of Object.entries(settings.websites)) {
              if (siteSettings.customCSS && siteSettings.enableCustomCSS) {
                await chrome.scripting.executeScript({
                  target: { tabId: tab.id },
                  func: (css) => {
                    const style = document.createElement('style');
                    style.textContent = css;
                    document.head.appendChild(style);
                  },
                  args: [siteSettings.customCSS]
                });
              }
            }
          }
          else {
            await chrome.storage.local.set(settings);
          }
          
          alert('Your customizations are now loaded!');
        } catch (error) {
          alert('Ahoy! your bloody json file is broken! here\'s the error message for you: ' + error.message);
        }
      };
      reader.readAsText(file);
    } else {
      alert('where\'s the file? ᵒ_\'ᵒ ');
    }
  });
});