# Staff Rota Excel to Forecasting Tool

A web-based tool that allows you to input staff rota data from an Excel sheet into a browser-based forecasting system.

## Features

- Upload and process Excel files containing staff rota data
- Select specific tabs/sheets from the Excel file
- Create and manage templates for default break durations and finish times
- Match employee names between Excel and the forecasting system
- Automated data entry into the forecasting system
- Step-by-step guidance for manual data entry as an alternative
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
- Choose between automated or manual data entry:
  - **Automated**: The tool will automatically enter all shift data into the forecasting system
  - **Manual**: Follow the step-by-step instructions to enter the shift data yourself
- Monitor progress through the progress bar and status updates

## Technical Details

- Built with HTML, CSS, and JavaScript
- Uses SheetJS (xlsx) library for Excel file processing
- Uses Puppeteer for browser automation (automated data entry)
- Stores templates and name mappings in localStorage
- Compatible with modern browsers (Chrome, Firefox, Edge, Safari)

## Installation

To use the automated data entry feature, you need to install the required dependencies:

1. Make sure you have [Node.js](https://nodejs.org/) installed
2. Clone or download this repository
3. Open a terminal/command prompt in the project directory
4. Run `npm install` to install the dependencies

If you only want to use the manual data entry feature, you can skip the installation steps and open the `index.html` file directly in your browser.

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

- Modern web browser with JavaScript enabled
- Access to the forecasting system
- Excel files (.xlsx or .xls) with the appropriate structure

## Version History

- v1.1.0: Added automated data entry feature
- v1.0.0: Initial release

## License

This project is open source and available under the MIT License.
