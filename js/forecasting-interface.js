/**
 * Forecasting Interface for the Staff Rota Excel to Forecasting Tool
 * Handles interaction with the forecasting system
 */

const ForecastingInterface = {
    /**
     * Initialize the forecasting interface
     */
    init: function() {
        this.setupEventListeners();
    },
    
    /**
     * Set up event listeners for forecasting-related actions
     */
    setupEventListeners: function() {
        // Start automated data entry button
        document.getElementById('startAutomatedDataEntry').addEventListener('click', () => {
            this.startAutomatedDataEntry();
        });
    },
    
    /**
     * Start the automated data entry process
     */
    startAutomatedDataEntry: function() {
        const processedData = ExcelProcessor.getProcessedData();
        
        if (!processedData || !processedData.employees || processedData.employees.length === 0) {
            Utils.showError('No data to enter. Please process an Excel file first.');
            return;
        }
        
        // Show progress bar
        document.getElementById('entryProgress').style.display = 'block';
        
        // Start the automated data entry process
        BrowserAutomation.startAutomatedDataEntry(processedData);
    }
};
