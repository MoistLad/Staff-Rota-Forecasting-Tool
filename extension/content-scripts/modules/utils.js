/**
 * Utility functions for the Staff Rota Automation extension
 */

// Create a namespace for the extension to avoid polluting the global namespace
window.StaffRotaAutomation = window.StaffRotaAutomation || {};
window.StaffRotaAutomation.Utils = {};

/**
 * Format a decimal time value to HH:MM format
 * @param {number} time - The time value in decimal format (e.g., 8.5 for 8:30)
 * @returns {string} The formatted time string in HH:MM format
 */
window.StaffRotaAutomation.Utils.formatTimeToHHMM = function(time) {
  if (!time) return '';
  
  const hours = Math.floor(time);
  const minutes = Math.round((time - hours) * 60);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Sleep for the specified number of milliseconds
 * @param {number} ms - The number of milliseconds to sleep
 * @returns {Promise} A promise that resolves after the specified time
 */
window.StaffRotaAutomation.Utils.sleep = function(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Update the automation status
 * @param {string} status - The status to update
 * @param {Object} data - Additional data to include with the status update
 */
window.StaffRotaAutomation.Utils.updateStatus = function(status, data = {}) {
  chrome.runtime.sendMessage({
    action: 'updateStatus',
    status,
    data
  });
}

/**
 * Update the automation progress
 * @param {number} increment - The amount to increment the progress by
 */
window.StaffRotaAutomation.Utils.updateProgress = function(increment) {
  chrome.runtime.sendMessage({
    action: 'updateProgress',
    progress: increment
  });
}

/**
 * Wait for an element to appear in the DOM
 * @param {string} selector - The CSS selector to wait for
 * @param {number} timeout - The maximum time to wait in milliseconds
 * @returns {Promise<Element>} A promise that resolves with the element when found
 */
window.StaffRotaAutomation.Utils.waitForElement = function(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    try {
      // Validate the selector
      if (!selector || typeof selector !== 'string') {
        reject(new Error(`Invalid selector provided to waitForElement: ${selector}`));
        return;
      }
      
      // Try to find the element immediately
      try {
        const element = document.querySelector(selector);
        if (element) {
          resolve(element);
          return;
        }
      } catch (selectorError) {
        reject(new Error(`Invalid selector "${selector}": ${selectorError.message}`));
        return;
      }
      
      // Set up mutation observer to watch for the element
      let observer;
      try {
        observer = new MutationObserver(mutations => {
          try {
            const element = document.querySelector(selector);
            if (element) {
              if (observer) observer.disconnect();
              resolve(element);
            }
          } catch (observerSelectorError) {
            if (observer) observer.disconnect();
            reject(new Error(`Invalid selector "${selector}" in mutation observer: ${observerSelectorError.message}`));
          }
        });
        
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
      } catch (observerError) {
        reject(new Error(`Error setting up mutation observer: ${observerError.message}`));
        return;
      }
      
      // Set timeout to avoid waiting forever
      setTimeout(() => {
        if (observer) observer.disconnect();
        reject(new Error(`Timeout waiting for element: ${selector}`));
      }, timeout);
    } catch (error) {
      // Catch any unexpected errors
      reject(new Error(`Unexpected error in waitForElement: ${error.message}`));
    }
  });
}

/**
 * Wait for the page to be fully loaded
 * @returns {Promise} A promise that resolves when the page is loaded
 */
window.StaffRotaAutomation.Utils.waitForPageLoad = function() {
  return new Promise(resolve => {
    if (document.readyState === 'complete') {
      resolve();
    } else {
      window.addEventListener('load', resolve);
    }
  });
}

/**
 * Helper function to find elements in all possible contexts (main document and iframes)
 * @param {string} selector - The CSS selector to find elements
 * @param {Element|Document} [searchContext=document] - The context to search within
 * @returns {NodeList} The found elements
 */
window.StaffRotaAutomation.Utils.findElementsInAllContexts = function(selector, searchContext = document) {
  try {
    // Validate the selector first
    if (!selector || typeof selector !== 'string') {
      console.warn('Invalid selector provided to findElementsInAllContexts:', selector);
      return [];
    }
    
    // If a specific search context is provided, search only within that context
    if (searchContext && searchContext !== document) {
      try {
        let elements = searchContext.querySelectorAll(selector);
        if (elements && elements.length > 0) {
          return elements;
        }
      } catch (contextSelectorError) {
        console.warn(`Invalid selector "${selector}" in provided search context:`, contextSelectorError.message);
        // Fall back to searching in document and iframes
      }
    }
    
    // Try in main document first
    try {
      let elements = document.querySelectorAll(selector);
      if (elements && elements.length > 0) {
        return elements;
      }
    } catch (selectorError) {
      console.warn(`Invalid selector "${selector}" in main document:`, selectorError.message);
      // Continue to try in iframes
    }
    
    // Try in all iframes
    const allIframes = document.querySelectorAll('iframe');
    for (const iframe of allIframes) {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        if (iframeDoc) {
          try {
            const elements = iframeDoc.querySelectorAll(selector);
            if (elements && elements.length > 0) {
              return elements;
            }
          } catch (iframeSelectorError) {
            console.warn(`Invalid selector "${selector}" in iframe ${iframe.id || 'unnamed'}:`, iframeSelectorError.message);
            // Continue to next iframe
          }
        }
      } catch (iframeAccessError) {
        console.warn(`Error accessing iframe content for ${iframe.id || 'unnamed iframe'}:`, iframeAccessError.message);
        // Continue to next iframe
      }
    }
    
    // If we get here, no elements were found
    return [];
  } catch (error) {
    // Catch any unexpected errors
    console.error('Unexpected error in findElementsInAllContexts:', error);
    return [];
  }
}
