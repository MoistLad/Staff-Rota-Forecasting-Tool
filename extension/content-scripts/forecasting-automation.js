/**
 * Content script for the Staff Rota Automation extension
 * Injected into the forecasting site to perform automation
 */

console.log('Staff Rota Automation extension content script loaded');

// Method 1: Inject a custom event to notify the page that the extension is installed
document.dispatchEvent(new CustomEvent('staffRotaExtensionInstalled'));

// Method 2: Add a hidden element to the DOM that the page can check for
const extensionMarker = document.createElement('div');
extensionMarker.id = 'staff-rota-extension-marker';
extensionMarker.setAttribute('data-extension-installed', 'true');
extensionMarker.style.display = 'none';
document.body.appendChild(extensionMarker);

// Add a data attribute to the document body as another detection method
document.body.setAttribute('data-staff-rota-extension-installed', 'true');

// Listen for the check event from the web page
document.addEventListener('checkStaffRotaExtension', () => {
  console.log('Received extension check request from web page');
  document.dispatchEvent(new CustomEvent('staffRotaExtensionInstalled'));
  
  // Re-add the marker element in case it was removed
  if (!document.getElementById('staff-rota-extension-marker')) {
    const extensionMarker = document.createElement('div');
    extensionMarker.id = 'staff-rota-extension-marker';
    extensionMarker.setAttribute('data-extension-installed', 'true');
    extensionMarker.style.display = 'none';
    document.body.appendChild(extensionMarker);
  }
  
  // Re-add the data attribute to the body
  document.body.setAttribute('data-staff-rota-extension-installed', 'true');
});

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);
  
  if (message.action === 'startAutomation') {
    // Start the automation process
    startAutomation(message.data)
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    
    // Return true to indicate that the response will be sent asynchronously
    return true;
  }
});

/**
 * Start the automation process
 * @param {Object} data - The data to use for automation
 * @returns {Promise} Promise that resolves when the automation is complete
 */
async function startAutomation(data) {
  try {
    // Send status update
    updateStatus('starting');
    
    // Wait for the page to be fully loaded
    await waitForPageLoad();
    
    // Check if we need to log in
    if (isLoginPage()) {
      // We can't automate the login process for security reasons
      // Notify the user that they need to log in manually
      updateStatus('login_required');
      
      // Wait for the user to log in
      await waitForLogin();
    }
    
    // Check if we're on the correct page
    if (!isSchedulingPage()) {
      // Navigate to the scheduling page
      await navigateToSchedulingPage();
    }
    
    // Process each employee
    for (let i = 0; i < data.employees.length; i++) {
      const employee = data.employees[i];
      
      // Update status
      updateStatus('processing_employee', {
        employee: employee.name,
        index: i + 1,
        total: data.employees.length
      });
      
      // Find the employee row
      const employeeRow = await findEmployeeRow(employee.name);
      
      if (!employeeRow) {
        console.warn(`Employee ${employee.name} not found in the forecasting system`);
        continue;
      }
      
      // Process each shift
      for (let j = 0; j < employee.shifts.length; j++) {
        const shift = employee.shifts[j];
        
        // Skip days with no shifts
        if (shift.shiftType === 'none') {
          continue;
        }
        
        // Update status
        updateStatus('processing_shift', {
          employee: employee.name,
          day: shift.day,
          shiftType: shift.shiftType
        });
        
        // Click on the day cell
        await clickDayCell(employeeRow, shift.day);
        
        // Fill in the shift form
        if (shift.shiftType === 'single') {
          await fillShiftForm({
            startTime: formatTimeToHHMM(shift.startTime1),
            endTime: formatTimeToHHMM(shift.endTime1),
            breakDuration: shift.breakDuration
          });
          
          // Update progress
          updateProgress(1);
        } else if (shift.shiftType === 'double') {
          // First shift
          await fillShiftForm({
            startTime: formatTimeToHHMM(shift.startTime1),
            endTime: formatTimeToHHMM(shift.endTime1),
            breakDuration: shift.breakDuration
          });
          
          // Update progress
          updateProgress(1);
          
          // Wait a moment before clicking again
          await sleep(1000);
          
          // Click on the day cell again for second shift
          await clickDayCell(employeeRow, shift.day);
          
          // Second shift
          await fillShiftForm({
            startTime: formatTimeToHHMM(shift.startTime2),
            endTime: formatTimeToHHMM(shift.endTime2),
            breakDuration: 0
          });
          
          // Update progress
          updateProgress(1);
        }
      }
    }
    
    // Complete the process
    updateStatus('complete');
    
    return { message: 'Automation completed successfully' };
  } catch (error) {
    updateStatus('error', { error: error.message });
    console.error('Error during automation:', error);
    throw error;
  }
}

/**
 * Wait for the page to be fully loaded
 * @returns {Promise} Promise that resolves when the page is loaded
 */
function waitForPageLoad() {
  return new Promise(resolve => {
    if (document.readyState === 'complete') {
      resolve();
    } else {
      window.addEventListener('load', resolve);
    }
  });
}

/**
 * Check if we're on the login page
 * @returns {boolean} True if we're on the login page
 */
function isLoginPage() {
  // This is a placeholder implementation
  // In a real implementation, you would check for login form elements
  return document.querySelector('form[name="login"]') !== null;
}

/**
 * Wait for the user to log in
 * @returns {Promise} Promise that resolves when the user has logged in
 */
function waitForLogin() {
  return new Promise(resolve => {
    // Check every second if we're still on the login page
    const interval = setInterval(() => {
      if (!isLoginPage()) {
        clearInterval(interval);
        resolve();
      }
    }, 1000);
  });
}

/**
 * Check if we're on the scheduling page
 * @returns {boolean} True if we're on the scheduling page
 */
function isSchedulingPage() {
  // This is a placeholder implementation
  // In a real implementation, you would check for scheduling page elements
  return document.querySelector('.scheduling') !== null;
}

/**
 * Navigate to the scheduling page
 * @returns {Promise} Promise that resolves when navigation is complete
 */
async function navigateToSchedulingPage() {
  // This is a placeholder implementation
  // In a real implementation, you would click on the scheduling link
  const schedulingLink = document.querySelector('a[href*="scheduling"]');
  
  if (schedulingLink) {
    schedulingLink.click();
    
    // Wait for the page to load
    await new Promise(resolve => {
      const interval = setInterval(() => {
        if (isSchedulingPage()) {
          clearInterval(interval);
          resolve();
        }
      }, 1000);
    });
  } else {
    throw new Error('Could not find scheduling link');
  }
}

/**
 * Find the employee row in the table
 * @param {string} employeeName - The name of the employee to find
 * @returns {Element|null} The employee row element or null if not found
 */
function findEmployeeRow(employeeName) {
  // This is a placeholder implementation
  // In a real implementation, you would find the row with the employee name
  const rows = document.querySelectorAll('tr');
  
  for (const row of rows) {
    if (row.textContent.toLowerCase().includes(employeeName.toLowerCase())) {
      return row;
    }
  }
  
  return null;
}

/**
 * Click on the day cell for an employee
 * @param {Element} employeeRow - The employee row element
 * @param {string} day - The day of the week
 * @returns {Promise} Promise that resolves when the click is complete
 */
async function clickDayCell(employeeRow, day) {
  // This is a placeholder implementation
  // In a real implementation, you would find and click the day cell
  const cells = employeeRow.querySelectorAll('td');
  
  // Map day names to column indices
  const dayMap = {
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6,
    'Sunday': 7
  };
  
  const dayIndex = dayMap[day];
  
  if (dayIndex && dayIndex < cells.length) {
    cells[dayIndex].click();
    
    // Wait for the shift form to appear
    await waitForElement('.shift-form');
  } else {
    throw new Error(`Cell for ${day} not found in row`);
  }
}

/**
 * Fill in the shift form
 * @param {Object} shiftData - The shift data (startTime, endTime, breakDuration)
 * @returns {Promise} Promise that resolves when the form is filled and saved
 */
async function fillShiftForm(shiftData) {
  // This is a placeholder implementation
  // In a real implementation, you would fill in the form fields and click save
  
  // Fill in start time
  const startTimeInput = document.querySelector('input[name="startTime"]');
  if (startTimeInput) {
    startTimeInput.value = shiftData.startTime;
    startTimeInput.dispatchEvent(new Event('input', { bubbles: true }));
  }
  
  // Fill in end time
  const endTimeInput = document.querySelector('input[name="endTime"]');
  if (endTimeInput) {
    endTimeInput.value = shiftData.endTime;
    endTimeInput.dispatchEvent(new Event('input', { bubbles: true }));
  }
  
  // Fill in break duration
  const breakDurationInput = document.querySelector('input[name="breakDuration"]');
  if (breakDurationInput) {
    breakDurationInput.value = shiftData.breakDuration;
    breakDurationInput.dispatchEvent(new Event('input', { bubbles: true }));
  }
  
  // Click save button
  const saveButton = document.querySelector('.save-button');
  if (saveButton) {
    saveButton.click();
    
    // Wait for the form to close
    await waitForElementToDisappear('.shift-form');
  } else {
    throw new Error('Could not find save button');
  }
}

/**
 * Wait for an element to appear in the DOM
 * @param {string} selector - The CSS selector for the element
 * @param {number} timeout - The timeout in milliseconds
 * @returns {Promise<Element>} Promise that resolves with the element
 */
function waitForElement(selector, timeout = 5000) {
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
 * Wait for an element to disappear from the DOM
 * @param {string} selector - The CSS selector for the element
 * @param {number} timeout - The timeout in milliseconds
 * @returns {Promise} Promise that resolves when the element disappears
 */
function waitForElementToDisappear(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    
    if (!element) {
      resolve();
      return;
    }
    
    const observer = new MutationObserver(mutations => {
      const element = document.querySelector(selector);
      
      if (!element) {
        observer.disconnect();
        resolve();
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Timeout waiting for element to disappear: ${selector}`));
    }, timeout);
  });
}

/**
 * Format time to HH:MM format
 * @param {number} time - The time as a decimal number
 * @returns {string} The time in HH:MM format
 */
function formatTimeToHHMM(time) {
  if (!time) return '';
  
  const hours = Math.floor(time);
  const minutes = Math.round((time - hours) * 60);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Sleep for a specified number of milliseconds
 * @param {number} ms - The number of milliseconds to sleep
 * @returns {Promise} Promise that resolves after the specified time
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Update the automation status
 * @param {string} status - The new status
 * @param {Object} data - Additional data for the status update
 */
function updateStatus(status, data = {}) {
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
function updateProgress(increment) {
  chrome.runtime.sendMessage({
    action: 'updateProgress',
    progress: increment
  });
}
