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

// Listen for messages from the web page
window.addEventListener('message', async (event) => {
  // Only accept messages from the same window
  if (event.source !== window) return;
  
  // Only accept messages with the correct format
  if (!event.data || !event.data.type || !event.data.action) return;
  
  // Only accept messages from our application
  if (event.data.type !== 'STAFF_ROTA_AUTOMATION') return;
  
  console.log('Content script received message from web page:', event.data);
  
  // Handle different actions
  if (event.data.action === 'startAutomation') {
    try {
      // Relay the message to the background script
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          action: 'startAutomation',
          data: event.data.data
        }, response => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });
      
      // Send the response back to the web page
      window.postMessage({
        type: 'STAFF_ROTA_AUTOMATION_RESPONSE',
        action: 'startAutomation',
        success: true,
        result: response
      }, '*');
    } catch (error) {
      // Send the error back to the web page
      window.postMessage({
        type: 'STAFF_ROTA_AUTOMATION_RESPONSE',
        action: 'startAutomation',
        success: false,
        error: error.message
      }, '*');
    }
  }
});

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message from background:', message);
  
  // Handle ping message to check if content script is loaded
  if (message.action === 'ping') {
    console.log('Received ping from background script, responding with success');
    sendResponse({ success: true, message: 'Content script is active' });
    return true;
  }
  
  if (message.action === 'startAutomation') {
    // Start the automation process
    startAutomation(message.data)
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    
    // Return true to indicate that the response will be sent asynchronously
    return true;
  }
  
  // Relay automation updates to the web page
  if (message.action === 'automationUpdate') {
    window.postMessage({
      type: 'STAFF_ROTA_AUTOMATION_UPDATE',
      action: 'automationUpdate',
      status: message.status,
      progress: message.progress,
      total: message.total,
      data: message.data
    }, '*');
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
  // Based on fourth.html structure, check for multiple indicators that we're on the scheduling page
  
  // Check 1: Look for the "Scheduling" text in the header module
  const schedulingHeading = document.getElementById('UIXL_headermodule');
  if (schedulingHeading && schedulingHeading.textContent === 'Scheduling') {
    console.log('Found Scheduling heading in header module');
    return true;
  }
  
  // Check 2: Look for the frameset structure that's unique to fourth.html
  const framesetElement = document.querySelector('.main-frameset');
  if (framesetElement) {
    console.log('Found main-frameset class');
    return true;
  }
  
  // Check 3: Look for the specific header structure in fourth.html
  const headerHolder = document.getElementById('headerHolder');
  if (headerHolder) {
    console.log('Found headerHolder element');
    return true;
  }
  
  // Check 4: Look for the main iframe which contains the scheduling content
  const mainIframe = document.getElementById('main');
  if (mainIframe) {
    console.log('Found main iframe');
    return true;
  }
  
  // If none of the above checks passed, we're probably not on the scheduling page
  return false;
}

/**
 * Navigate to the scheduling page
 * @returns {Promise} Promise that resolves when navigation is complete
 */
async function navigateToSchedulingPage() {
  console.log('Attempting to navigate to scheduling page...');
  
  // First check if we're already on the scheduling page
  if (isSchedulingPage()) {
    console.log('Already on scheduling page');
    return;
  }
  
  // Method 1: Use the menu structure from fourth.html
  const schedulingMenuItems = Array.from(document.querySelectorAll('.UIXL_menu_level_1'))
    .find(el => el.textContent.trim() === 'Scheduling');
  
  if (schedulingMenuItems) {
    console.log('Found Scheduling menu item, clicking it');
    schedulingMenuItems.click();
    
    // Wait for the page to load
    await new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 10;
      
      const interval = setInterval(() => {
        attempts++;
        
        if (isSchedulingPage()) {
          clearInterval(interval);
          console.log('Successfully navigated to scheduling page');
          resolve();
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          console.warn(`Made ${maxAttempts} attempts but couldn't confirm we're on scheduling page`);
          // Don't reject, just continue with best effort
          resolve();
        }
      }, 1000);
    });
    
    return;
  }
  
  // Method 2: Try to find the Scheduling module in the header
  const headerModule = document.getElementById('UIXL_headermodule');
  if (headerModule) {
    console.log('Found header module, checking if we can click it');
    headerModule.click();
    
    // Wait to see if clicking the header module navigates us
    await sleep(2000);
    
    if (isSchedulingPage()) {
      console.log('Successfully navigated to scheduling page');
      return;
    }
  }
  
  // Method 3: Look for the burger menu and try to open it to find Scheduling
  const burgerMenu = document.querySelector('.UIXL_burger_icon');
  if (burgerMenu) {
    console.log('Found burger menu, clicking it');
    burgerMenu.click();
    
    // Wait for the menu to open
    await sleep(1000);
    
    // Now look for Scheduling in the opened menu
    const schedulingInMenu = Array.from(document.querySelectorAll('.UIXL_menu_level_1, .UIXL_menu_level_2'))
      .find(el => el.textContent.trim() === 'Scheduling' || el.textContent.trim() === 'Scheduling Homepage');
    
    if (schedulingInMenu) {
      console.log('Found Scheduling in menu, clicking it');
      schedulingInMenu.click();
      
      // Wait to see if this navigates us
      await sleep(2000);
      
      if (isSchedulingPage()) {
        console.log('Successfully navigated to scheduling page');
        return;
      }
    }
  }
  
  // Method 4: Try to use the main iframe directly
  const mainIframe = document.getElementById('main');
  if (mainIframe) {
    try {
      console.log('Trying to navigate using the main iframe');
      // Try to navigate the iframe to the scheduling page
      mainIframe.src = '../modules/labourproductivity/homepage.asp';
      
      // Wait for the iframe to load
      await sleep(3000);
      
      if (isSchedulingPage()) {
        console.log('Successfully navigated to scheduling page');
        return;
      }
    } catch (error) {
      console.warn('Error navigating iframe:', error);
    }
  }
  
  // If we've tried all methods and still can't navigate, throw an error
  console.error('Could not find any way to navigate to the scheduling page');
  throw new Error('Could not find scheduling link or tab. Please navigate to the scheduling page manually.');
}

/**
 * Find the employee row in the table
 * @param {string} employeeName - The name of the employee to find
 * @returns {Element|null} The employee row element or null if not found
 */
function findEmployeeRow(employeeName) {
  console.log(`Looking for employee row with name: ${employeeName}`);
  
  // Method 1: Look for employee rows in the main iframe
  const mainIframe = document.getElementById('main');
  if (mainIframe && mainIframe.contentDocument) {
    const iframeDoc = mainIframe.contentDocument;
    
    // Look for employee rows in tables
    const tables = iframeDoc.querySelectorAll('table');
    for (const table of tables) {
      const rows = table.querySelectorAll('tr');
      
      for (const row of rows) {
        if (row.textContent.includes(employeeName)) {
          console.log(`Found employee row for ${employeeName} in iframe table`);
          return row;
        }
      }
    }
    
    // Look for employee names in any element
    const employeeElements = Array.from(iframeDoc.querySelectorAll('td, div, span'))
      .filter(el => el.textContent.includes(employeeName));
    
    if (employeeElements.length > 0) {
      console.log(`Found ${employeeElements.length} elements containing employee name`);
      
      // Find the closest row element
      for (const element of employeeElements) {
        let parent = element;
        while (parent && parent.tagName !== 'TR') {
          parent = parent.parentElement;
          if (!parent) break;
        }
        
        if (parent && parent.tagName === 'TR') {
          console.log(`Found parent row for employee: ${employeeName}`);
          return parent;
        }
      }
    }
  }
  
  // Method 2: Look for employee rows in the sidebar
  const sidebarEmployeeRows = document.querySelectorAll('.UIXL_menu_employee .UIXL_menu_level_3');
  for (const row of sidebarEmployeeRows) {
    if (row.textContent.includes(employeeName)) {
      console.log(`Found employee in sidebar menu: ${employeeName}`);
      return row;
    }
  }
  
  // Method 3: Generic approach - look for any element containing the employee name
  const allElements = Array.from(document.querySelectorAll('*'));
  const employeeElements = allElements.filter(el => 
    el.textContent && el.textContent.includes(employeeName)
  );
  
  if (employeeElements.length > 0) {
    console.log(`Found ${employeeElements.length} elements containing employee name`);
    
    // Find the element that looks most like a row
    const rowLikeElement = employeeElements.find(el => 
      el.tagName === 'TR' || 
      el.className.includes('row') || 
      el.id.includes('row') ||
      el.getAttribute('role') === 'row'
    );
    
    if (rowLikeElement) {
      console.log(`Found row-like element for employee: ${employeeName}`);
      return rowLikeElement;
    }
    
    // If no row-like element, return the first element that contains the name
    console.log(`Returning first element containing employee name: ${employeeName}`);
    return employeeElements[0];
  }
  
  console.warn(`Could not find employee row for: ${employeeName}`);
  return null;
}

/**
 * Click on the day cell for an employee
 * @param {Element} employeeRow - The employee row element
 * @param {string} day - The day of the week
 * @returns {Promise} Promise that resolves when the click is complete
 */
async function clickDayCell(employeeRow, day) {
  console.log(`Looking for ${day} cell in employee row with ID: ${employeeRow.id}`);
  
  // Method 1: Use the exact selector pattern provided by the user
  // The example was: document.querySelector("#employee-row-583012 > div.lphf_flex.lphf_flex--direction-column.lphf_weekly-schedule-employee-row-day.lphf_drop-zone.lphf_weekly-schedule-employee-row-day-selected > div > div")
  
  // Map day names to their indices (0-based)
  const dayIndices = {
    'Monday': 0,
    'Tuesday': 1,
    'Wednesday': 2,
    'Thursday': 3,
    'Friday': 4,
    'Saturday': 5,
    'Sunday': 6
  };
  
  const dayIndex = dayIndices[day];
  if (dayIndex === undefined) {
    console.error(`Invalid day name: ${day}`);
    throw new Error(`Invalid day name: ${day}`);
  }
  
  // Find all day cells in the employee row
  const dayCells = Array.from(employeeRow.querySelectorAll('.lphf_weekly-schedule-employee-row-day, .lphf_flex--direction-column'));
  
  console.log(`Found ${dayCells.length} day cells in the employee row`);
  
  // If we have enough day cells and the day index is within range
  if (dayCells.length > dayIndex) {
    console.log(`Clicking day cell at index ${dayIndex} for ${day}`);
    dayCells[dayIndex].click();
    
    // Wait for the shift form to appear
    try {
      // Based on the screenshot, look for the shift form elements
      await waitForElement('input, [class*="shift"], [id*="shift"], [class*="form"], [id*="form"]');
      console.log('Shift form appeared after clicking cell');
      return;
    } catch (error) {
      console.warn('Could not detect shift form after clicking cell, trying alternative methods');
    }
  } else {
    console.warn(`Not enough day cells found (${dayCells.length}), trying alternative methods`);
  }
  
  // Method 2: Try to find day cells by class name pattern
  const allDayCells = Array.from(document.querySelectorAll('.lphf_weekly-schedule-employee-row-day'));
  
  // Group day cells by employee row
  const dayCellsByRow = {};
  allDayCells.forEach(cell => {
    // Find the parent employee row
    let parent = cell;
    let employeeRowId = null;
    
    while (parent && !employeeRowId) {
      if (parent.id && parent.id.startsWith('employee-row-')) {
        employeeRowId = parent.id;
      }
      parent = parent.parentElement;
    }
    
    if (employeeRowId) {
      if (!dayCellsByRow[employeeRowId]) {
        dayCellsByRow[employeeRowId] = [];
      }
      dayCellsByRow[employeeRowId].push(cell);
    }
  });
  
  // If we found day cells for this employee row
  if (dayCellsByRow[employeeRow.id] && dayCellsByRow[employeeRow.id].length > dayIndex) {
    console.log(`Found day cells for employee row ${employeeRow.id}, clicking cell at index ${dayIndex}`);
    dayCellsByRow[employeeRow.id][dayIndex].click();
    
    // Wait for the shift form to appear
    try {
      await waitForElement('input, [class*="shift"], [id*="shift"], [class*="form"], [id*="form"]');
      console.log('Shift form appeared after clicking cell');
      return;
    } catch (error) {
      console.warn('Could not detect shift form after clicking cell with class-based method');
    }
  }
  
  // Method 3: Try to find the cell based on its position relative to the employee row
  // This handles cases where the cells might be in a different container than the employee name
  const rowRect = employeeRow.getBoundingClientRect();
  const rowTop = rowRect.top;
  const rowBottom = rowRect.bottom;
  
  // Find all elements that could be cells and are vertically aligned with the employee row
  const allPossibleCells = Array.from(document.querySelectorAll('div, td, span'))
    .filter(el => {
      const rect = el.getBoundingClientRect();
      return rect.top >= rowTop && rect.bottom <= rowBottom && rect.width > 20 && rect.height > 20;
    });
  
  // Group cells by their horizontal position
  const cellsByColumn = {};
  allPossibleCells.forEach(cell => {
    const rect = cell.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    
    // Round to nearest 10px to group cells in the same column
    const columnKey = Math.round(centerX / 10) * 10;
    
    if (!cellsByColumn[columnKey]) {
      cellsByColumn[columnKey] = [];
    }
    cellsByColumn[columnKey].push(cell);
  });
  
  // Sort columns by x position
  const sortedColumns = Object.keys(cellsByColumn).sort((a, b) => a - b);
  
  // Skip the first column (employee name) and get the day column
  // We need to add 1 to dayIndex because the first column is the employee name
  const targetColumnIndex = dayIndex + 1;
  
  // If we have enough columns and the target column index is within range
  if (sortedColumns.length > targetColumnIndex) {
    const columnKey = sortedColumns[targetColumnIndex];
    const cellsInColumn = cellsByColumn[columnKey];
    
    // Find the cell that's vertically aligned with our row
    const targetCell = cellsInColumn.find(cell => {
      const rect = cell.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      return centerY >= rowTop && centerY <= rowBottom;
    });
    
    if (targetCell) {
      console.log(`Found cell for ${day} using position-based method`);
      targetCell.click();
      
      // Wait for the shift form to appear
      try {
        await waitForElement('input, [class*="shift"], [id*="shift"], [class*="form"], [id*="form"]');
        console.log('Shift form appeared after clicking cell');
        return;
      } catch (error) {
        console.warn('Could not detect shift form after clicking cell with position-based method');
      }
    }
  }
  
  // If we still haven't found the cell, try a more aggressive approach
  console.warn(`Could not find cell for ${day} using standard methods, trying fallback approach`);
  
  // Method 4: Look for any clickable element in the general area where the day cell should be
  const allElements = Array.from(document.querySelectorAll('*'));
  
  // Filter elements that are likely to be cells based on their appearance and position
  const potentialCells = allElements.filter(el => {
    const rect = el.getBoundingClientRect();
    const centerY = rect.top + rect.height / 2;
    
    // Check if the element is vertically aligned with our row
    const isInRow = centerY >= rowTop && centerY <= rowBottom;
    
    // Check if the element has a reasonable size for a cell
    const hasReasonableSize = rect.width >= 20 && rect.height >= 20;
    
    // Check if the element is empty or has minimal content (cells often are)
    const hasMinimalContent = el.textContent.trim().length <= 10;
    
    return isInRow && hasReasonableSize && hasMinimalContent;
  });
  
  // Sort potential cells by their horizontal position
  potentialCells.sort((a, b) => {
    const rectA = a.getBoundingClientRect();
    const rectB = b.getBoundingClientRect();
    return rectA.left - rectB.left;
  });
  
  // Skip the first column (employee name) and get the day column
  // We need to add 1 to dayIndex because the first column is the employee name
  const targetIndex = dayIndex + 1;
  
  // If we have enough potential cells and the target index is within range
  if (potentialCells.length > targetIndex) {
    console.log(`Found ${potentialCells.length} potential cells, clicking cell at index ${targetIndex}`);
    potentialCells[targetIndex].click();
    
    // Wait for the shift form to appear
    try {
      await waitForElement('input, [class*="shift"], [id*="shift"], [class*="form"], [id*="form"]');
      console.log('Shift form appeared after clicking potential cell');
      return;
    } catch (error) {
      console.error('Could not detect shift form after trying all methods');
      throw new Error(`Could not interact with cell for ${day}`);
    }
  }
  
  throw new Error(`Cell for ${day} not found in row`);
}

/**
 * Fill in the shift form
 * @param {Object} shiftData - The shift data (startTime, endTime, breakDuration)
 * @returns {Promise} Promise that resolves when the form is filled and saved
 */
async function fillShiftForm(shiftData) {
  console.log('Filling shift form with data:', shiftData);
  
  // Wait a moment for the form to be fully loaded and interactive
  await sleep(500);
  
  // Based on the screenshot, find the start time input
  // Method 1: Try to find inputs by name or placeholder
  let startTimeInput = document.querySelector('input[name="startTime"], input[placeholder*="start"], input[aria-label*="start"]');
  
  // Method 2: If not found, look for any input near text that indicates start time
  if (!startTimeInput) {
    const startTimeLabels = Array.from(document.querySelectorAll('label, div, span'))
      .filter(el => {
        const text = el.textContent && el.textContent.toLowerCase();
        return text && (text.includes('start') || text.includes('from'));
      });
    
    for (const label of startTimeLabels) {
      // Look for an input near this label
      const nearbyInput = findNearbyInput(label);
      if (nearbyInput) {
        startTimeInput = nearbyInput;
        break;
      }
    }
  }
  
  // Method 3: From the screenshot, we can see there are two required fields at the top
  // These are likely the start and end time inputs
  if (!startTimeInput) {
    const requiredFields = Array.from(document.querySelectorAll('input[required], input[aria-required="true"], input.required'));
    if (requiredFields.length >= 2) {
      startTimeInput = requiredFields[0]; // First required field is likely start time
    }
  }
  
  // Method 4: Look for any input in a section labeled "Start date and time"
  if (!startTimeInput) {
    const startSection = Array.from(document.querySelectorAll('div, section, fieldset'))
      .find(el => el.textContent && el.textContent.includes('Start date and time'));
    
    if (startSection) {
      startTimeInput = startSection.querySelector('input');
    }
  }
  
  // If we found a start time input, fill it
  if (startTimeInput) {
    console.log('Found start time input, filling with:', shiftData.startTime);
    startTimeInput.value = shiftData.startTime;
    startTimeInput.dispatchEvent(new Event('input', { bubbles: true }));
    startTimeInput.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Some forms require clicking outside the input to register the change
    document.body.click();
  } else {
    console.warn('Could not find start time input');
  }
  
  // Find the end time input using similar methods
  let endTimeInput = document.querySelector('input[name="endTime"], input[placeholder*="end"], input[aria-label*="end"]');
  
  if (!endTimeInput) {
    const endTimeLabels = Array.from(document.querySelectorAll('label, div, span'))
      .filter(el => {
        const text = el.textContent && el.textContent.toLowerCase();
        return text && (text.includes('end') || text.includes('to'));
      });
    
    for (const label of endTimeLabels) {
      const nearbyInput = findNearbyInput(label);
      if (nearbyInput) {
        endTimeInput = nearbyInput;
        break;
      }
    }
  }
  
  if (!endTimeInput && startTimeInput) {
    // If we found the start time input but not the end time input,
    // the end time input is likely the next input after the start time input
    const allInputs = Array.from(document.querySelectorAll('input'));
    const startTimeIndex = allInputs.indexOf(startTimeInput);
    if (startTimeIndex !== -1 && startTimeIndex < allInputs.length - 1) {
      endTimeInput = allInputs[startTimeIndex + 1];
    }
  }
  
  // Method 3: From the screenshot, we can see there are two required fields at the top
  if (!endTimeInput) {
    const requiredFields = Array.from(document.querySelectorAll('input[required], input[aria-required="true"], input.required'));
    if (requiredFields.length >= 2) {
      endTimeInput = requiredFields[1]; // Second required field is likely end time
    }
  }
  
  // Method 4: Look for any input in a section labeled "End date and time"
  if (!endTimeInput) {
    const endSection = Array.from(document.querySelectorAll('div, section, fieldset'))
      .find(el => el.textContent && el.textContent.includes('End date and time'));
    
    if (endSection) {
      endTimeInput = endSection.querySelector('input');
    }
  }
  
  // If we found an end time input, fill it
  if (endTimeInput) {
    console.log('Found end time input, filling with:', shiftData.endTime);
    endTimeInput.value = shiftData.endTime;
    endTimeInput.dispatchEvent(new Event('input', { bubbles: true }));
    endTimeInput.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Some forms require clicking outside the input to register the change
    document.body.click();
  } else {
    console.warn('Could not find end time input');
  }
  
  // Find and fill the break duration input
  // From the screenshot, we can see a "Breaks" section with a "Break 1 (min)" field
  let breakDurationInput = document.querySelector('input[name="breakDuration"], input[placeholder*="break"], input[aria-label*="break"]');
  
  if (!breakDurationInput) {
    const breakLabels = Array.from(document.querySelectorAll('label, div, span'))
      .filter(el => {
        const text = el.textContent && el.textContent.toLowerCase();
        return text && (text.includes('break') && text.includes('min'));
      });
    
    for (const label of breakLabels) {
      const nearbyInput = findNearbyInput(label);
      if (nearbyInput) {
        breakDurationInput = nearbyInput;
        break;
      }
    }
  }
  
  // Method 3: Look for any input in a section labeled "Breaks"
  if (!breakDurationInput) {
    const breaksSection = Array.from(document.querySelectorAll('div, section, fieldset'))
      .find(el => el.textContent && el.textContent.includes('Breaks'));
    
    if (breaksSection) {
      breakDurationInput = breaksSection.querySelector('input');
    }
  }
  
  // If we found a break duration input and have a break duration, fill it
  if (breakDurationInput && shiftData.breakDuration) {
    console.log('Found break duration input, filling with:', shiftData.breakDuration);
    breakDurationInput.value = shiftData.breakDuration;
    breakDurationInput.dispatchEvent(new Event('input', { bubbles: true }));
    breakDurationInput.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Some forms require clicking outside the input to register the change
    document.body.click();
  } else if (shiftData.breakDuration) {
    console.warn('Could not find break duration input');
  }
  
  // Wait a moment for any form validation to complete
  await sleep(500);
  
  // Find and click the save button
  // From the screenshot, we can see a "Save" button at the bottom of the form
  let saveButton = document.querySelector('button[type="submit"], input[type="submit"], button.save, .save-button, button:contains("Save")');
  
  if (!saveButton) {
    // Look for any button with "Save" text
    saveButton = Array.from(document.querySelectorAll('button, input[type="button"], a.button, .btn, [role="button"]'))
      .find(el => el.textContent && el.textContent.trim() === 'Save');
  }
  
  if (!saveButton) {
    // Look for any element that looks like a button and has "Save" text
    saveButton = Array.from(document.querySelectorAll('div, span, a'))
      .find(el => {
        const text = el.textContent && el.textContent.trim();
        return text === 'Save' && (
          el.onclick || 
          el.role === 'button' || 
          el.className && (el.className.includes('button') || el.className.includes('btn'))
        );
      });
  }
  
  if (saveButton) {
    console.log('Found save button, clicking it');
    saveButton.click();
    
    // Wait for the form to close
    try {
      // Wait for the shift form to disappear
      await new Promise((resolve, reject) => {
        // Check if the form is already gone
        if (!document.querySelector('input, [class*="shift"], [id*="shift"], [class*="form"], [id*="form"]')) {
          resolve();
          return;
        }
        
        // Set a timeout to prevent waiting forever
        const timeout = setTimeout(() => {
          observer.disconnect();
          console.log('Timed out waiting for form to close, but continuing anyway');
          resolve(); // Resolve anyway to continue the process
        }, 5000);
        
        // Watch for DOM changes to detect when the form is removed
        const observer = new MutationObserver(mutations => {
          if (!document.querySelector('input, [class*="shift"], [id*="shift"], [class*="form"], [id*="form"]')) {
            clearTimeout(timeout);
            observer.disconnect();
            resolve();
          }
        });
        
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
      });
      
      console.log('Shift form closed successfully');
    } catch (error) {
      console.warn('Error waiting for shift form to close:', error);
      // Continue anyway
    }
  } else {
    console.error('Could not find save button');
    throw new Error('Could not find save button');
  }
}

/**
 * Find an input element near a label element
 * @param {Element} labelElement - The label element
 * @returns {Element|null} The input element or null if not found
 */
function findNearbyInput(labelElement) {
  // Method 1: Check if the label has a "for" attribute
  if (labelElement.htmlFor) {
    const input = document.getElementById(labelElement.htmlFor);
    if (input && (input.tagName === 'INPUT' || input.tagName === 'SELECT' || input.tagName === 'TEXTAREA')) {
      return input;
    }
  }
  
  // Method 2: Check if the label contains an input
  const input = labelElement.querySelector('input, select, textarea');
  if (input) {
    return input;
  }
  
  // Method 3: Check if the label is followed by an input
  let sibling = labelElement.nextElementSibling;
  while (sibling) {
    if (sibling.tagName === 'INPUT' || sibling.tagName === 'SELECT' || sibling.tagName === 'TEXTAREA') {
      return sibling;
    }
    sibling = sibling.nextElementSibling;
  }
  
  // Method 4: Check if the label's parent contains an input
  const parentInput = labelElement.parentElement.querySelector('input, select, textarea');
  if (parentInput && parentInput !== labelElement) {
    return parentInput;
  }
  
  // Method 5: Look for inputs near the label based on position
  const labelRect = labelElement.getBoundingClientRect();
  const allInputs = Array.from(document.querySelectorAll('input, select, textarea'));
  
  // Sort inputs by distance to the label
  const sortedInputs = allInputs.sort((a, b) => {
    const rectA = a.getBoundingClientRect();
    const rectB = b.getBoundingClientRect();
    
    const distanceA = Math.sqrt(
      Math.pow(rectA.left - labelRect.right, 2) + 
      Math.pow(rectA.top - labelRect.top, 2)
    );
    
    const distanceB = Math.sqrt(
      Math.pow(rectB.left - labelRect.right, 2) + 
      Math.pow(rectB.top - labelRect.top, 2)
    );
    
    return distanceA - distanceB;
  });
  
  // Return the closest input
  return sortedInputs[0] || null;
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
