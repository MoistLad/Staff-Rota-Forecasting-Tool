/**
 * Content script for the Staff Rota Automation extension
 * Injected into the forecasting site to perform automation
 * 
 * This file serves as the entry point for the extension and imports functionality from the modules.
 */

// Use dynamic import instead of static import to work around module loading issues
(async () => {
  try {
    const { initialize } = await import('./modules/core.js');
    // Initialize the extension when the script is loaded
    initialize();
    console.log('Staff Rota Automation extension initialized successfully');
  } catch (error) {
    console.error('Error initializing Staff Rota Automation extension:', error);
  }
})();
