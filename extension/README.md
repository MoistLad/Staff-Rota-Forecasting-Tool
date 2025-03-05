# Staff Rota Automation Chrome Extension

This Chrome extension automates data entry into the forecasting system for staff rotas.

## Installation Instructions

1. **Download the extension files**
   - Make sure you have all the extension files in a folder on your computer.

2. **Load the extension in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" by toggling the switch in the top-right corner
   - Click "Load unpacked" and select the folder containing the extension files
   - The extension should now appear in your list of installed extensions

3. **Verify installation**
   - You should see the Staff Rota Automation icon in your Chrome toolbar
   - If you don't see it, click the puzzle piece icon and pin the extension

## Usage

1. Open the Staff Rota Forecasting Tool website
2. Upload and process your Excel file
3. Click "Start Automated Data Entry" to begin the automation process
4. The extension will handle the data entry into the forecasting system
5. You can monitor the progress in both the web application and the extension popup

## Features

- Automatically finds employee rows in the forecasting system
- Clicks on the appropriate day cells
- Fills in shift details (start time, end time, break duration)
- Handles both single and double shifts
- Provides real-time progress updates
- Works in the background while you continue using your browser

## Requirements

- Chrome browser
- Access to the forecasting system
- Staff Rota Forecasting Tool web application

## Troubleshooting

### Extension Not Detected

If you're seeing the error "Chrome extension not detected" even though the extension is installed, try these steps:

1. **Ensure the extension is enabled**
   - Go to `chrome://extensions/`
   - Make sure the Staff Rota Automation extension is toggled on

2. **Reload the extension**
   - On the extensions page, click the refresh icon on the Staff Rota Automation extension

3. **Reload the web page**
   - Refresh the Staff Rota Forecasting Tool web page
   - Make sure you're accessing the page via https://moistlad.github.io/Staff-Rota-Forecasting-Tool/

4. **Check permissions**
   - Click on "Details" for the Staff Rota Automation extension
   - Scroll down to "Site access" and ensure it has permission to access the website
   - Make sure it has permission for "moistlad.github.io" and "fourthospitality.com"

5. **Clear browser cache**
   - Go to Chrome settings > Privacy and security > Clear browsing data
   - Select "Cached images and files" and click "Clear data"

6. **Restart Chrome**
   - Close and reopen Chrome completely

7. **Check console for errors**
   - Right-click on the web page and select "Inspect"
   - Go to the "Console" tab
   - Look for any error messages related to the extension
   - If you see "Content script received message", the extension is working

8. **Reinstall the extension**
   - Remove the extension from Chrome
   - Load it again using the "Load unpacked" button
   - Make sure you're using the latest version of the extension

9. **Content Security Policy (CSP) issues**
   - If you see errors in the console about "Content Security Policy", this is normal
   - The extension uses DOM-based detection methods that are compatible with CSP restrictions
   - These errors don't affect the functionality of the extension

10. **Communication issues**
    - The extension now uses window.postMessage for communication instead of direct Chrome API access
    - This is more compatible with web page security restrictions
    - If you see errors about "Cannot read properties of undefined (reading 'sendMessage')", this fix addresses that issue
    
11. **Improved error handling**
    - The extension now has more robust error handling throughout
    - It properly handles cases where the content script isn't loaded yet
    - It retries communication if the initial attempt fails
    - Error messages are more descriptive and helpful
    
12. **Tab handling**
    - The extension will now use existing tabs with the forecasting system instead of always opening a new one
    - It checks for tabs with various URL patterns to find the right tab
    - This prevents duplicate tabs from being created
    - The extension now prioritizes the currently active tab if it's relevant
    - It will use the tab you're currently viewing if possible

13. **Common issues**
    - If the extension doesn't detect employees, make sure the names match exactly with the forecasting system
    - If the extension can't find day cells, make sure you're on the correct week in the forecasting system
    - If the extension can't fill in shift details, make sure the forecasting system hasn't changed its interface

## Privacy

This extension only accesses the forecasting system website and does not collect or transmit any personal data. All data processing happens locally in your browser.

## Support

If you continue to experience issues, please contact the developer for assistance.
