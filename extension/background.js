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
  // Get all tabs
  const allTabs = await chrome.tabs.query({});
  
  // First, check if the user has specified a tab to use
  const activeTab = allTabs.find(tab => tab.active);
  if (activeTab) {
    console.log('Current active tab:', activeTab.url);
  }
  
  // Check for tabs with the forecasting system URL
  const forecastingTabs = allTabs.filter(tab => {
    const url = tab.url || '';
    return url.includes('fourthospitality.com') || 
           url.includes('fourthhospitality.com') ||
           url.includes('frameset.asp');
  });
  
  // Check for tabs with the GitHub Pages URL
  const githubPagesTabs = allTabs.filter(tab => {
    const url = tab.url || '';
    return url.includes('moistlad.github.io/Staff-Rota-Forecasting-Tool') ||
           url.includes('Staff-Rota-Forecasting-Tool');
  });
  
  // Use the active tab if it's a forecasting tab or GitHub Pages tab
  if (activeTab && (
      activeTab.url.includes('fourthospitality.com') || 
      activeTab.url.includes('fourthhospitality.com') ||
      activeTab.url.includes('frameset.asp') ||
      activeTab.url.includes('moistlad.github.io/Staff-Rota-Forecasting-Tool') ||
      activeTab.url.includes('Staff-Rota-Forecasting-Tool')
    )) {
    console.log('Using current active tab:', activeTab.url);
    return activeTab;
  }
  
  // Use any existing forecasting tab
  if (forecastingTabs.length > 0) {
    console.log('Using existing forecasting tab:', forecastingTabs[0].url);
    await chrome.tabs.update(forecastingTabs[0].id, { active: true });
    
    // Wait for the tab to be fully loaded
    await new Promise(resolve => {
      setTimeout(resolve, 500);
    });
    
    return forecastingTabs[0];
  }
  
  // If no forecasting tab exists, check if we should use the GitHub Pages tab
  if (githubPagesTabs.length > 0) {
    console.log('No forecasting tab found. Using GitHub Pages tab:', githubPagesTabs[0].url);
    
    // Create a new tab for the forecasting system
    console.log('Creating new forecasting tab');
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
  
  // If no relevant tabs exist, create a new one
  console.log('No relevant tabs found. Creating new forecasting tab');
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

/**
 * Send a message to the content script
 * @param {number} tabId - The ID of the tab to send the message to
 * @param {Object} message - The message to send
 * @returns {Promise} Promise that resolves with the response
 */
function sendMessageToContentScript(tabId, message) {
  return new Promise((resolve, reject) => {
    // Wait for the content script to be fully loaded
    setTimeout(() => {
      console.log(`Sending message to tab ${tabId}:`, message);
      
      // First check if the content script is ready by sending a ping
      chrome.tabs.sendMessage(tabId, { action: 'ping' }, pingResponse => {
        if (chrome.runtime.lastError) {
          console.warn('Content script not ready yet, retrying in 1 second...');
          
          // If the content script is not ready, wait a bit longer and try again
          setTimeout(() => {
            chrome.tabs.sendMessage(tabId, message, response => {
              if (chrome.runtime.lastError) {
                console.error('Failed to send message to content script:', chrome.runtime.lastError);
                
                // Try to inject the content script as a fallback
                chrome.tabs.get(tabId, tab => {
                  console.log('Attempting to inject content script as fallback...');
                  
                  // Try to inject the content script
                  chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: ['content-scripts/forecasting-automation.js']
                  }).then(() => {
                    console.log('Content script injected successfully, retrying message...');
                    
                    // Wait a moment for the script to initialize
                    setTimeout(() => {
                      chrome.tabs.sendMessage(tabId, message, response => {
                        if (chrome.runtime.lastError) {
                          console.error('Still failed to send message after injection:', chrome.runtime.lastError);
                          reject(new Error(chrome.runtime.lastError.message));
                        } else {
                          console.log('Message sent successfully after injection');
                          resolve(response);
                        }
                      });
                    }, 500);
                  }).catch(error => {
                    console.error('Failed to inject content script:', error);
                    reject(new Error('Failed to inject content script: ' + error.message));
                  });
                });
              } else {
                console.log('Received response from content script:', response);
                resolve(response);
              }
            });
          }, 1000);
        } else {
          // Content script is ready, send the actual message
          console.log('Content script is ready, sending actual message');
          chrome.tabs.sendMessage(tabId, message, response => {
            if (chrome.runtime.lastError) {
              console.error('Failed to send message to content script:', chrome.runtime.lastError);
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              console.log('Received response from content script:', response);
              resolve(response);
            }
          });
        }
      });
    }, 500); // Initial delay to ensure content script is loaded
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
