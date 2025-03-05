/**
 * Background script for the Staff Rota Automation extension
 * Handles communication between the web app and the content script
 */

// Listen for messages from the web app or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background script received message:', message);
  
  if (message.action === 'startAutomation') {
    // Start the automation process
    startAutomation(message.data)
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    
    // Return true to indicate that the response will be sent asynchronously
    return true;
  }
  
  if (message.action === 'getStatus') {
    // Get the current status of the automation
    sendResponse({ status: automationStatus });
    return true;
  }
  
  if (message.action === 'ping') {
    // Simple ping to check if the extension is installed
    console.log('Received ping request, responding with success');
    sendResponse({ success: true, message: 'Staff Rota Automation extension is active' });
    return true;
  }
});

// Global variables to track automation status
let automationStatus = 'idle';
let automationProgress = 0;
let automationTotal = 0;

/**
 * Start the automation process
 * @param {Object} data - The data to use for automation
 * @returns {Promise} Promise that resolves when the automation is complete
 */
async function startAutomation(data) {
  try {
    automationStatus = 'starting';
    automationProgress = 0;
    automationTotal = calculateTotalSteps(data);
    
    // Find or create a tab with the forecasting system
    const tab = await findOrCreateForecastingTab();
    
    // Send a message to the content script to start the automation
    await sendMessageToContentScript(tab.id, {
      action: 'startAutomation',
      data
    });
    
    automationStatus = 'running';
    
    // Return success
    return { message: 'Automation started successfully' };
  } catch (error) {
    automationStatus = 'error';
    console.error('Error starting automation:', error);
    throw error;
  }
}

/**
 * Find or create a tab with the forecasting system
 * @returns {Promise<chrome.tabs.Tab>} Promise that resolves with the tab
 */
async function findOrCreateForecastingTab() {
  // Check if there's already a tab with the forecasting system
  const tabs = await chrome.tabs.query({ url: '*://fourthospitality.com/*' });
  
  if (tabs.length > 0) {
    // Use the existing tab
    await chrome.tabs.update(tabs[0].id, { active: true });
    return tabs[0];
  } else {
    // Create a new tab
    const tab = await chrome.tabs.create({
      url: 'https://fourthospitality.com/portal/menus/frameset.asp',
      active: true
    });
    
    // Wait for the tab to load
    await new Promise(resolve => {
      chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
        if (tabId === tab.id && changeInfo.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      });
    });
    
    return tab;
  }
}

/**
 * Send a message to the content script
 * @param {number} tabId - The ID of the tab to send the message to
 * @param {Object} message - The message to send
 * @returns {Promise} Promise that resolves with the response
 */
function sendMessageToContentScript(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, response => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

/**
 * Calculate the total number of steps in the automation process
 * @param {Object} data - The data to use for automation
 * @returns {number} The total number of steps
 */
function calculateTotalSteps(data) {
  let steps = 0;
  
  if (data && data.employees) {
    data.employees.forEach(employee => {
      if (employee.shifts) {
        employee.shifts.forEach(shift => {
          if (shift.shiftType !== 'none') {
            steps += (shift.shiftType === 'double') ? 2 : 1;
          }
        });
      }
    });
  }
  
  return steps;
}

// Listen for updates from the content script
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.action === 'updateProgress') {
    automationProgress = message.progress;
    
    // If the automation is complete, update the status
    if (automationProgress >= automationTotal) {
      automationStatus = 'complete';
    }
  }
  
  if (message.action === 'updateStatus') {
    automationStatus = message.status;
  }
  
  // Broadcast the update to any listening tabs (including the web app)
  chrome.tabs.query({}, tabs => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        action: 'automationUpdate',
        status: automationStatus,
        progress: automationProgress,
        total: automationTotal,
        data: message.data
      }).catch(() => {
        // Ignore errors from tabs that don't have a listener
      });
    });
  });
});
