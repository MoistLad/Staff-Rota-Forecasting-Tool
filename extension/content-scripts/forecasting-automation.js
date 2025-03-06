/**
 * Content script for the Staff Rota Automation extension
 * Injected into the forecasting site to perform automation
 * 
 * This file serves as the entry point for the extension and initializes the core functionality.
 */

// Wait for the DOM to be fully loaded and all scripts to be executed
document.addEventListener('DOMContentLoaded', function() {
  // Make sure the StaffRotaAutomation namespace and Core module are available
  if (window.StaffRotaAutomation && window.StaffRotaAutomation.Core) {
    console.log('Initializing Staff Rota Automation extension...');
    try {
      // Initialize the extension
      window.StaffRotaAutomation.Core.initialize();
      console.log('Staff Rota Automation extension initialized successfully');
    } catch (error) {
      console.error('Error initializing Staff Rota Automation extension:', error);
    }
  } else {
    console.error('Staff Rota Automation namespace or Core module not found. Make sure all module files are loaded correctly.');
  }
});

// Also try to initialize immediately in case DOMContentLoaded has already fired
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  if (window.StaffRotaAutomation && window.StaffRotaAutomation.Core) {
    console.log('Document already loaded, initializing Staff Rota Automation extension immediately...');
    try {
      window.StaffRotaAutomation.Core.initialize();
      console.log('Staff Rota Automation extension initialized successfully');
    } catch (error) {
      console.error('Error initializing Staff Rota Automation extension:', error);
    }
  }
}
