/**
 * Main application file for the Staff Rota Excel to Forecasting Tool
 * Initializes all components and sets up the application
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize utility functions
    // (No initialization needed for Utils)
    
    // Initialize template manager
    TemplateManager.init();
    
    // Initialize Excel processor
    ExcelProcessor.init();
    
    // Initialize name matcher
    NameMatcher.init();
    
    // Initialize forecasting interface
    ForecastingInterface.init();
    
    // Clear any error messages
    Utils.clearErrors();
    
    // Display welcome message
    const processingStatus = document.getElementById('processingStatus');
    processingStatus.innerHTML = '<div class="alert alert-info">Welcome to the Staff Rota Excel to Forecasting Tool. Please select an Excel file to begin.</div>';
    
    // Add version info
    addVersionInfo();
    
    // Check for browser compatibility
    checkBrowserCompatibility();
});

/**
 * Add version information to the page
 */
function addVersionInfo() {
    const versionInfo = document.createElement('div');
    versionInfo.className = 'text-center text-muted mt-4 mb-2';
    versionInfo.innerHTML = 'Staff Rota Excel to Forecasting Tool v1.0.0';
    
    document.querySelector('.container').appendChild(versionInfo);
}

/**
 * Check if the browser is compatible with the application
 */
function checkBrowserCompatibility() {
    // Check for required features
    const requiredFeatures = [
        { name: 'FileReader', check: () => typeof FileReader !== 'undefined' },
        { name: 'localStorage', check: () => typeof localStorage !== 'undefined' },
        { name: 'Promises', check: () => typeof Promise !== 'undefined' },
        { name: 'Arrow Functions', check: () => { try { eval('() => {}'); return true; } catch (e) { return false; } } },
        { name: 'Fetch API', check: () => typeof fetch !== 'undefined' }
    ];
    
    const missingFeatures = requiredFeatures.filter(feature => !feature.check());
    
    if (missingFeatures.length > 0) {
        const featureList = missingFeatures.map(f => f.name).join(', ');
        Utils.showError(`Your browser is missing required features: ${featureList}. Please use a modern browser like Chrome, Firefox, or Edge.`);
    }
}

/**
 * Handle unhandled errors
 */
window.addEventListener('error', function(event) {
    console.error('Unhandled error:', event.error);
    Utils.showError(`An unexpected error occurred: ${event.message}`);
});

/**
 * Handle unhandled promise rejections
 */
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    Utils.showError(`An unexpected error occurred: ${event.reason}`);
});
