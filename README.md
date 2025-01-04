# Website Customizer

don't you just hate it when websites don't give you any way to customize your site? yee olde website customizer is a tool to help you customize your websites! it's as simple as plug and play! no code required, unless you'd like to use some custom css.

## Features (not that many, but still have some)

- Change font family
- Adjust font size
- Modify text color
- Set text capitalization (uppercase, lowercase, capitalize)
- Remove elements from the page
- Save settings for individual websites
- Reset all changes
- custom css
- Import/Export site customizations

## Installationsensation

1. Download Here: https://github.com/JumpSushi/pagecustomize/releases/tag/V1.1.1
2. Open Chrome (or your chromium based browser) and navigate to `chrome://extensions/`.
3. Enable "Developer mode" by toggling the switch in the top right corner.
4. Click on "Load unpacked" and select the directory where you cloned the repository.

## Usage

pretty self explanatory, just make sure to save your settings otherwise it won't persist!

## Permissions

The extension requires the following permissions:
- `activeTab`: To access the currently active tab.
- `storage`: To save and retrieve customization settings.
- `scripting`: To inject CSS and JavaScript into the page.
- `tabs`: To query and manipulate browser tabs.

## Change Log

### Version 1.1.1 (I have a great naming system, thank you)

- Open Dyslexic font added
- better observer for dynamic elements 
- remove element now persists after reload
- fixed some websites that like to set priority and ruin my element removal
- html iframe support 


### Version 1.1.0
- Added custom CSS feature with enable/disable toggle
- Added import/export functionality for settings
- Fixed color bug where saving made all text black even without user changes
- Added a small note for the remove element feature
- Improved settings persistence across page reloads
- Added support for exporting single website or all website settings
- Added JSON validation for imported settings
- small quality of life feature: website default for the text font and text transform

Github Copilot was used for debugging (including some small snippets of code), and some portions of this readme.
