# Staff Rota Automation Extension - Modules

This directory contains the modular components of the Staff Rota Automation extension. The code has been refactored into separate modules to improve maintainability and organization.

## Module Structure

- **core.js**: Main functionality and message handling for the extension
- **utils.js**: Utility functions used throughout the extension
- **navigation.js**: Page navigation and detection functions
- **employee-finder.js**: Functions for finding employee rows in the scheduling table
- **shift-handler.js**: Functions for filling shift forms

## Module Responsibilities

### core.js

- Initializes the extension
- Sets up event listeners for messages from the web page and background script
- Orchestrates the automation process
- Handles high-level error recovery

### utils.js

- Provides utility functions like `sleep`, `waitForPageLoad`, etc.
- Handles status and progress updates
- Contains DOM helper functions

### navigation.js

- Detects the current page (login, scheduling, etc.)
- Navigates to the scheduling page
- Handles waiting for login

### employee-finder.js

- Finds employee rows in the scheduling table
- Handles clicking on day cells for specific employees

### shift-handler.js

- Fills shift forms with the provided data
- Handles saving forms and verifying successful submission

## Usage

The main entry point for the extension is `forecasting-automation.js`, which imports and initializes the core module. All modules use ES modules syntax (import/export) for better code organization.

## Error Handling

Each module includes robust error handling to recover from common issues:

- DOM exceptions when accessing iframe content
- Elements not found in the expected structure
- Form submission failures

The code includes multiple fallback methods for finding elements and interacting with the page, making it more resilient to changes in the page structure.
