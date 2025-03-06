/**
 * Utility functions for the Staff Rota Automation extension
 */

/**
 * Format a decimal time value to HH:MM format
 * @param {number} time - The time value in decimal format (e.g., 8.5 for 8:30)
 * @returns {string} The formatted time string in HH:MM format
 */
export function formatTimeToHHMM(time) {
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
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Update the automation status
 * @param {string} status - The status to update
 * @param {Object} data - Additional data to include with the status update
 */
export function updateStatus(status, data = {}) {
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
export function updateProgress(increment) {
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
export function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    
    if (element) {
      resolve(element);
      return;
    }
    
    const observer = new MutationObserver(mutations => {
      const element = document.querySelector(selector);
      
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Timeout waiting for element: ${selector}`));
    }, timeout);
  });
}

/**
 * Wait for the page to be fully loaded
 * @returns {Promise} A promise that resolves when the page is loaded
 */
export function waitForPageLoad() {
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
 * @returns {NodeList} The found elements
 */
export function findElementsInAllContexts(selector) {
  // Try in main document first
  let elements = document.querySelectorAll(selector);
  if (elements && elements.length > 0) {
    return elements;
  }
  
  // Try in all iframes
  const allIframes = document.querySelectorAll('iframe');
  for (const iframe of allIframes) {
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      if (iframeDoc) {
        elements = iframeDoc.querySelectorAll(selector);
        if (elements && elements.length > 0) {
          return elements;
        }
      }
    } catch (e) {
      console.warn(`Error accessing iframe content for ${iframe.id || 'unnamed iframe'}:`, e);
    }
  }
  
  return [];
}
