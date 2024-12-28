# Website Customizer

Website Customizer is an extension for chromium browsers that allows you to customize the appearance of any website. You can change the font family, font size, text color, text capitalization, and add custom CSS. Additionally, you can remove unwanted elements from the page and import/export your settings.

## Features (not that many, but still have some)

- Change font family
- Adjust font size
- Modify text color
- Set text capitalization (uppercase, lowercase, capitalize)
- Remove elements from the page
- Save settings for individual websites
- Reset all changes
- CUSTOM CSS IS HERE WOWOOWOWOWOOWOWOWOWOWOWOWOWOOWOW
- Import/Export site customizations for individual websites or all at once!

## Installationsensation

1. Download Here: https://github.com/JumpSushi/pagecustomize/releases/tag/V1.1.0
2. Open Chrome (or your chromium based browser) and navigate to `chrome://extensions/`.
3. Enable "Developer mode" by toggling the switch in the top right corner.
4. Click on "Load unpacked" and select the directory where you cloned the repository.

## Usage

1. Click on the Website Customizer icon in the Chrome toolbar to open the popup.
2. Use the controls to customize the appearance of the current website:
    - **Font Family**: Select a font from the dropdown.
    - **Font Size**: Adjust the slider to change the font size.
    - **Text Color**: Choose a color using the color picker.
    - **Text Capitalization**: Select a capitalization option from the dropdown.
    - **Custom CSS**: Add your custom CSS in the provided textarea. **Note: the css textbox is not an editor, it does not provide error messages if your indentation, syntax etc are wrong. It is recommeneded you use an editor before copy pasting into the field**
3. To remove elements from the page, click the "Enable Element Removal" button. Click on any element on the page to remove it. Press the `ESC` key to exit removal mode, or press the button in the extension menu.
4. Click "Save for this website" to save your customizations for the current website.
5. Click "Delete saved settings" to remove the saved customizations for the current website.
6. Click "Reset All Changes" to revert all customizations and reload the page.
7. Use the "Import/Export Settings" button to:
    - Export settings for a single website or all websites
    - Import previously exported settings from a JSON file

## Permissions

The extension requires the following permissions:
- `activeTab`: To access the currently active tab.
- `storage`: To save and retrieve customization settings.
- `scripting`: To inject CSS and JavaScript into the page.
- `tabs`: To query and manipulate browser tabs.

## Change Log

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

