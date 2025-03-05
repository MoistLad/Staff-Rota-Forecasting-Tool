# Staff Rota Automation Chrome Extension

This Chrome extension automates data entry into the forecasting system for the Staff Rota Forecasting Tool.

## Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in the top-right corner)
3. Click "Load unpacked" and select this directory
4. The Staff Rota Automation extension should now appear in your extensions list

## How to Use

1. Use the Staff Rota Forecasting Tool web application to process your Excel file
2. Click "Start Automated Data Entry" in the web application
3. The extension will open the forecasting system in a new tab (or use an existing tab)
4. The extension will automatically enter the shift data into the forecasting system
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

- If the extension doesn't detect employees, make sure the names match exactly with the forecasting system
- If the extension can't find day cells, make sure you're on the correct week in the forecasting system
- If the extension can't fill in shift details, make sure the forecasting system hasn't changed its interface

## Privacy

This extension only accesses the forecasting system website and does not collect or transmit any personal data. All data processing happens locally in your browser.
