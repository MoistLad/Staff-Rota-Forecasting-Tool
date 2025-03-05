# Staff Rota Excel to Forecasting Tool

A web-based tool that allows you to input staff rota data from an Excel sheet into a browser-based forecasting system.

## Features

- Upload and process Excel files containing staff rota data
- Select specific tabs/sheets from the Excel file
- Create and manage templates for default break durations and finish times
- Match employee names between Excel and the forecasting system
- Automated data entry into the forecasting system via Chrome extension
- Error handling and progress tracking

## How to Use

### 1. Prepare Your Excel File

The Excel file should be structured as follows:
- Each week should be on a separate tab (e.g., "3rd-9th")
- Employee names should be in column D
- Each day has 5 columns (e.g., Monday is columns E to I)
- Times should be entered as integers in 24-hour format
- For single shifts, use either the first two columns or the last two columns of a day
- For double shifts, use all four time columns of a day

### 2. Set Up Templates

Before processing your Excel file, you can create templates with default settings:
- Set default break durations for single shifts
- Set default finish times for each day of the week
- Save templates for future use

### 3. Upload and Process Excel File

- Select your Excel file using the file upload button
- Choose the appropriate tab/sheet that matches the week in the forecasting system
- Click "Process Excel Data" to extract the shift information

### 4. Review and Map Names

- Review the extracted employee names
- Map Excel names to forecasting system names if needed
- Save name mappings for future use

### 5. Review Shifts

- Review the extracted shift data for each employee
- Verify start times, end times, and break durations

### 6. Enter Data into Forecasting System

- Make sure you're logged into the forecasting system and have selected the correct week
- Click "Start Automated Data Entry" to begin the process
- The Chrome extension will automatically enter all shift data into the forecasting system
- Monitor progress through the progress bar and status updates

## Technical Details

- Built with HTML, CSS, and JavaScript
- Uses SheetJS (xlsx) library for Excel file processing
- Uses Chrome extension for browser automation
- Stores templates and name mappings in localStorage
- Compatible with Chrome browser

## Installation

### Web Application

1. Clone or download this repository
2. Open the `index.html` file directly in your browser

### Chrome Extension

1. Navigate to the `extension` directory in the project
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top-right corner)
4. Click "Load unpacked" and select the `extension` directory
5. The Staff Rota Automation extension should now appear in your extensions list

The extension will handle the automated data entry process, communicating with the web application to receive data and provide status updates.

## How the Automation Works

1. When you click "Start Automated Data Entry" in the web application, it sends the extracted data to the Chrome extension
2. The extension opens the forecasting system in a new tab (or uses an existing tab)
3. The extension automatically:
   - Finds employee rows in the forecasting system
   - Clicks on the appropriate day cells
   - Fills in shift details (start time, end time, break duration)
   - Saves each shift
4. Progress updates are sent back to the web application
5. You can monitor the process in both the web application and the extension popup

## Hosting

This tool is designed to be hosted on GitHub Pages or any static web hosting service. No server-side processing is required.

### Deploying to GitHub Pages

Two deployment scripts are included to help you deploy the tool to GitHub Pages:

- For macOS/Linux: Use `deploy-to-gh-pages.sh` (make it executable with `chmod +x deploy-to-gh-pages.sh` first)
- For Windows: Use `deploy-to-gh-pages.bat`

To deploy:

1. Create a GitHub repository for this project
2. Run the appropriate deployment script
3. Follow the instructions in the script output

Once deployed, the tool will be available at `https://<your-username>.github.io/<your-repo-name>/`

## Requirements

- Chrome browser
- Access to the forecasting system
- Excel files (.xlsx or .xls) with the appropriate structure

## Version History

- v2.0.0: Implemented Chrome extension for automated data entry
- v1.0.0: Initial release

## License

This project is open source and available under the MIT License.
