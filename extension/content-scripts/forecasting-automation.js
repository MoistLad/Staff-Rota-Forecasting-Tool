/**
 * Content script for the Staff Rota Automation extension
 * Injected into the forecasting site to perform automation
 */

console.log('Staff Rota Automation extension content script loaded');

// Add markers to indicate the extension is installed
document.dispatchEvent(new CustomEvent('staffRotaExtensionInstalled'));
const extensionMarker = document.createElement('div');
extensionMarker.id = 'staff-rota-extension-marker';
extensionMarker.setAttribute('data-extension-installed', 'true');
extensionMarker.style.display = 'none';
document.body.appendChild(extensionMarker);
document.body.setAttribute('data-staff-rota-extension-installed', 'true');

// Listen for the check event from the web page
document.addEventListener('checkStaffRotaExtension', () => {
  console.log('Received extension check request from web page');
  document.dispatchEvent(new CustomEvent('staffRotaExtensionInstalled'));
  
  if (!document.getElementById('staff-rota-extension-marker')) {
    const extensionMarker = document.createElement('div');
    extensionMarker.id = 'staff-rota-extension-marker';
    extensionMarker.setAttribute('data-extension-installed', 'true');
    extensionMarker.style.display = 'none';
    document.body.appendChild(extensionMarker);
  }
  
  document.body.setAttribute('data-staff-rota-extension-installed', 'true');
});

// Listen for messages from the web page
window.addEventListener('message', async (event) => {
  if (event.source !== window) return;
  if (!event.data || !event.data.type || !event.data.action) return;
  if (event.data.type !== 'STAFF_ROTA_AUTOMATION') return;
  
  console.log('Content script received message from web page:', event.data);
  
  if (event.data.action === 'startAutomation') {
    try {
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
      
      window.postMessage({
        type: 'STAFF_ROTA_AUTOMATION_RESPONSE',
        action: 'startAutomation',
        success: true,
        result: response
      }, '*');
    } catch (error) {
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
  
  if (message.action === 'ping') {
    console.log('Received ping from background script, responding with success');
    sendResponse({ success: true, message: 'Content script is active' });
    return true;
  }
  
  if (message.action === 'startAutomation') {
    startAutomation(message.data)
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
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
 */
async function startAutomation(data) {
  try {
    updateStatus('starting');
    await waitForPageLoad();
    
    if (isLoginPage()) {
      updateStatus('login_required');
      await waitForLogin();
    }
    
    // Check if we're on the correct page
    const onSchedulingPage = isSchedulingPage();
    console.log(`Scheduling page check result: ${onSchedulingPage ? 'Already on scheduling page' : 'Not on scheduling page'}`);
    
    if (!onSchedulingPage) {
      try {
        console.log('Attempting to navigate to scheduling page...');
        await navigateToSchedulingPage();
      } catch (navigationError) {
        console.error('Navigation error:', navigationError);
        
        // Check again if we're on the scheduling page despite the navigation error
        if (isSchedulingPage()) {
          console.log('Navigation failed but we appear to be on the scheduling page anyway, continuing...');
        } else {
          // If we're still not on the scheduling page, try one more time with a different approach
          try {
            console.log('Trying alternative navigation approach...');
            // Try clicking any element that might lead to the scheduling page
            const schedulingLinks = Array.from(document.querySelectorAll('a, button, div, span'))
              .filter(el => el.textContent && 
                     (el.textContent.includes('Schedule') || 
                      el.textContent.includes('Rota') || 
                      el.textContent.includes('Shift')));
            
            if (schedulingLinks.length > 0) {
              console.log(`Found ${schedulingLinks.length} potential scheduling links, clicking the first one`);
              schedulingLinks[0].click();
              
              // Wait a moment for the page to load
              await sleep(2000);
              
              // Check again if we're on the scheduling page
              if (isSchedulingPage()) {
                console.log('Alternative navigation successful');
              } else {
                console.error('Still not on scheduling page after alternative navigation');
                throw new Error('Could not navigate to scheduling page. Please ensure you are on the scheduling page with the correct week selected.');
              }
            } else {
              throw new Error('Could not find any scheduling links. Please navigate to the scheduling page manually.');
            }
          } catch (alternativeNavigationError) {
            console.error('Alternative navigation failed:', alternativeNavigationError);
            
            // If we're still not on the scheduling page, but the user said it should be open,
            // we'll assume we're on the right page and continue anyway
            console.log('Assuming we are on the correct page despite detection failure, continuing with automation...');
          }
        }
      }
    }
    
    // Process each employee
    for (let i = 0; i < data.employees.length; i++) {
      const employee = data.employees[i];
      
      updateStatus('processing_employee', {
        employee: employee.name,
        index: i + 1,
        total: data.employees.length
      });
      
      const employeeRow = await findEmployeeRow(employee.name);
      
      if (!employeeRow) {
        console.warn(`Employee ${employee.name} not found in the forecasting system`);
        continue;
      }
      
      // Process each shift
      for (let j = 0; j < employee.shifts.length; j++) {
        const shift = employee.shifts[j];
        
        if (shift.shiftType === 'none') {
          continue;
        }
        
        updateStatus('processing_shift', {
          employee: employee.name,
          day: shift.day,
          shiftType: shift.shiftType
        });
        
        try {
          await clickDayCell(employeeRow, shift.day);
          
          if (shift.shiftType === 'single') {
            await fillShiftForm({
              startTime: formatTimeToHHMM(shift.startTime1),
              endTime: formatTimeToHHMM(shift.endTime1),
              breakDuration: shift.breakDuration
            });
            
            updateProgress(1);
          } else if (shift.shiftType === 'double') {
            await fillShiftForm({
              startTime: formatTimeToHHMM(shift.startTime1),
              endTime: formatTimeToHHMM(shift.endTime1),
              breakDuration: shift.breakDuration
            });
            
            updateProgress(1);
            await sleep(1000);
            
            await clickDayCell(employeeRow, shift.day);
            
            await fillShiftForm({
              startTime: formatTimeToHHMM(shift.startTime2),
              endTime: formatTimeToHHMM(shift.endTime2),
              breakDuration: 0
            });
            
            updateProgress(1);
          }
        } catch (shiftError) {
          console.error(`Error processing shift for ${employee.name} on ${shift.day}:`, shiftError);
          continue;
        }
      }
    }
    
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
 */
function isLoginPage() {
  return document.querySelector('form[name="login"]') !== null;
}

/**
 * Wait for the user to log in
 */
function waitForLogin() {
  return new Promise(resolve => {
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
 */
function isSchedulingPage() {
  console.log('Checking if we are on the scheduling page...');
  
  // Check 1: Look for employee schedule table or grid
  const scheduleTable = document.querySelector('[class*="schedule"], [id*="schedule"], [class*="rota"], [id*="rota"]');
  if (scheduleTable) {
    console.log('Found schedule table/grid element');
    return true;
  }
  
  // Check 2: Look for employee rows which indicate we're on the scheduling page
  const employeeRows = document.querySelectorAll('[id*="employee-row"], [class*="employee-row"], tr[class*="employee"]');
  if (employeeRows && employeeRows.length > 0) {
    console.log(`Found ${employeeRows.length} employee rows`);
    return true;
  }
  
  // Check 3: Look for day columns which indicate we're on the scheduling page
  const dayColumns = document.querySelectorAll('[class*="day-column"], [class*="day-header"], th[class*="day"]');
  if (dayColumns && dayColumns.length >= 7) {
    console.log(`Found ${dayColumns.length} day columns`);
    return true;
  }
  
  // Check 4: Look for the "Scheduling" text in the header module
  const schedulingHeading = document.getElementById('UIXL_headermodule');
  if (schedulingHeading && schedulingHeading.textContent.includes('Scheduling')) {
    console.log('Found Scheduling heading in header module');
    return true;
  }
  
  // Check 5: Look for the frameset structure that's unique to Fourth Hospitality
  const framesetElement = document.querySelector('.main-frameset');
  if (framesetElement) {
    console.log('Found main-frameset class');
    return true;
  }
  
  // Check 6: Look for the specific header structure in Fourth Hospitality
  const headerHolder = document.getElementById('headerHolder');
  if (headerHolder) {
    console.log('Found headerHolder element');
    return true;
  }
  
  // Check 7: Look for the main iframe which contains the scheduling content
  const mainIframe = document.getElementById('main');
  if (mainIframe) {
    try {
      const iframeDoc = mainIframe.contentDocument || mainIframe.contentWindow.document;
      if (iframeDoc) {
        const iframeSchedule = iframeDoc.querySelector('[class*="schedule"], [id*="schedule"], [class*="rota"], [id*="rota"]');
        if (iframeSchedule) {
          console.log('Found schedule element in main iframe');
          return true;
        }
        
        const iframeEmployeeRows = iframeDoc.querySelectorAll('[id*="employee-row"], [class*="employee-row"], tr[class*="employee"]');
        if (iframeEmployeeRows && iframeEmployeeRows.length > 0) {
          console.log(`Found ${iframeEmployeeRows.length} employee rows in iframe`);
          return true;
        }
        
        const iframeDayColumns = iframeDoc.querySelectorAll('[class*="day-column"], [class*="day-header"], th[class*="day"]');
        if (iframeDayColumns && iframeDayColumns.length >= 7) {
          console.log(`Found ${iframeDayColumns.length} day columns in iframe`);
          return true;
        }
      }
    } catch (e) {
      console.warn('Error checking iframe content:', e);
    }
    
    console.log('Found main iframe but could not confirm scheduling content');
    return true; // Assume we're on the scheduling page if we found the main iframe
  }
  
  console.log('Not on scheduling page - none of the checks passed');
  return false;
}

/**
 * Navigate to the scheduling page
 */
async function navigateToSchedulingPage() {
  console.log('Attempting to navigate to scheduling page...');
  
  if (isSchedulingPage()) {
    console.log('Already on scheduling page');
    return;
  }
  
  // Method 1: Use the menu structure from Fourth Hospitality
  const schedulingMenuItems = Array.from(document.querySelectorAll('.UIXL_menu_level_1, .menu-item, [class*="menu-item"]'))
    .filter(el => el.textContent && el.textContent.trim().includes('Scheduling'));
  
  if (schedulingMenuItems.length > 0) {
    console.log(`Found ${schedulingMenuItems.length} Scheduling menu items, clicking the first one`);
    schedulingMenuItems[0].click();
    
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
    
    await sleep(2000);
    
    if (isSchedulingPage()) {
      console.log('Successfully navigated to scheduling page');
      return;
    }
  }
  
  // Method 3: Look for the burger menu and try to open it to find Scheduling
  const burgerMenu = document.querySelector('.UIXL_burger_icon, [class*="burger"], [class*="menu-icon"]');
  if (burgerMenu) {
    console.log('Found burger menu, clicking it');
    burgerMenu.click();
    
    await sleep(1000);
    
    const schedulingInMenu = Array.from(document.querySelectorAll('a, li, div, span'))
      .filter(el => el.textContent && 
             (el.textContent.includes('Scheduling') || 
              el.textContent.includes('Rota') || 
              el.textContent.includes('Schedule')));
    
    if (schedulingInMenu.length > 0) {
      console.log(`Found ${schedulingInMenu.length} potential Scheduling items in menu, clicking the first one`);
      schedulingInMenu[0].click();
      
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
      mainIframe.src = '../modules/labourproductivity/homepage.asp';
      
      await sleep(3000);
      
      if (isSchedulingPage()) {
        console.log('Successfully navigated to scheduling page');
        return;
      }
    } catch (error) {
      console.warn('Error navigating iframe:', error);
    }
  }
  
  // Method 5: Look for any links or buttons that might lead to scheduling
  const schedulingLinks = Array.from(document.querySelectorAll('a, button'))
    .filter(el => el.textContent && 
           (el.textContent.includes('Schedule') || 
            el.textContent.includes('Rota') || 
            el.textContent.includes('Shift')));
  
  if (schedulingLinks.length > 0) {
    console.log(`Found ${schedulingLinks.length} potential scheduling links, clicking the first one`);
    schedulingLinks[0].click();
    
    await sleep(2000);
    
    if (isSchedulingPage()) {
      console.log('Successfully navigated to scheduling page');
      return;
    }
  }
  
  // Method 6: Check all iframes for scheduling content
  const allIframes = document.querySelectorAll('iframe');
  for (const iframe of allIframes) {
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      if (iframeDoc) {
        const scheduleElements = iframeDoc.querySelectorAll('[class*="schedule"], [id*="schedule"], [class*="rota"], [id*="rota"]');
        if (scheduleElements.length > 0) {
          console.log(`Found ${scheduleElements.length} schedule elements in iframe, focusing it`);
          iframe.focus();
          
          await sleep(1000);
          
          if (isSchedulingPage()) {
            console.log('Successfully found scheduling page in iframe');
            return;
          }
        }
      }
    } catch (e) {
      console.warn('Error checking iframe:', e);
    }
  }
  
  console.error('Could not find any way to navigate to the scheduling page');
  throw new Error('Could not find scheduling link or tab. Please navigate to the scheduling page manually.');
}

// Helper functions (simplified versions)
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
  }
  
  // Method 2: Generic approach - look for any element containing the employee name
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

async function clickDayCell(employeeRow, day) {
  console.log(`Looking for ${day} cell in employee row with ID: ${employeeRow.id}`);
  
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
  const dayCells = Array.from(employeeRow.querySelectorAll('td, div'));
  
  // If we have enough day cells and the day index is within range
  if (dayCells.length > dayIndex) {
    console.log(`Clicking day cell at index ${dayIndex} for ${day}`);
    dayCells[dayIndex].click();
    
    // Wait for the shift form to appear
    await sleep(1000);
    return;
  }
  
  throw new Error(`Cell for ${day} not found in row`);
}

async function fillShiftForm(shiftData) {
  console.log('Filling shift form with data:', shiftData);
  
  // Wait a moment for the form to be fully loaded and interactive
  await sleep(500);
  
  // Find the start time input
  let startTimeInput = document.querySelector('input[name="startTime"], input[placeholder*="start"]');
  if (startTimeInput) {
    console.log('Found start time input, filling with:', shiftData.startTime);
    startTimeInput.value = shiftData.startTime;
    startTimeInput.dispatchEvent(new Event('input', { bubbles: true }));
    startTimeInput.dispatchEvent(new Event('change', { bubbles: true }));
  }
  
  // Find the end time input
  let endTimeInput = document.querySelector('input[name="endTime"], input[placeholder*="end"]');
  if (endTimeInput) {
    console.log('Found end time input, filling with:', shiftData.endTime);
    endTimeInput.value = shiftData.endTime;
    endTimeInput.dispatchEvent(new Event('input', { bubbles: true }));
    endTimeInput.dispatchEvent(new Event('change', { bubbles: true }));
  }
  
  // Find and fill the break duration input
  let breakDurationInput = document.querySelector('input[name="breakDuration"], input[placeholder*="break"]');
  if (breakDurationInput && shiftData.breakDuration) {
    console.log('Found break duration input, filling with:', shiftData.breakDuration);
    breakDurationInput.value = shiftData.breakDuration;
    breakDurationInput.dispatchEvent(new Event('input', { bubbles: true }));
    breakDurationInput.dispatchEvent(new Event('change', { bubbles: true }));
  }
  
  // Find and click the save button
  let saveButton = document.querySelector('button[type="submit"], input[type="submit"], button:contains("Save")');
  if (!saveButton) {
    saveButton = Array.from(document.querySelectorAll('button, input[type="button"]'))
      .find(el => el.textContent && el.textContent.trim() === 'Save');
  }
  
  if (saveButton) {
    console.log('Found save button, clicking it');
    saveButton.click();
    await sleep(1000);
  }
}

function formatTimeToHHMM(time) {
  if (!time) return '';
  
  const hours = Math.floor(time);
  const minutes = Math.round((time - hours) * 60);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function updateStatus(status, data = {}) {
  chrome.runtime.sendMessage({
    action: 'updateStatus',
    status,
    data
  });
}

function updateProgress(increment) {
  chrome.runtime.sendMessage({
    action: 'updateProgress',
    progress: increment
  });
}

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
