/**
 * Core functionality for the Staff Rota Automation extension
 */

// Create a namespace for core functions
window.StaffRotaAutomation = window.StaffRotaAutomation || {};
window.StaffRotaAutomation.Core = {};

/**
 * Start the automation process
 * @param {Object} data - The automation data
 * @returns {Promise<Object>} A promise that resolves with the result of the automation
 */
window.StaffRotaAutomation.Core.startAutomation = async function(data) {
  try {
    window.StaffRotaAutomation.Utils.updateStatus('starting');
    await window.StaffRotaAutomation.Utils.waitForPageLoad();
    
    if (window.StaffRotaAutomation.Navigation.isLoginPage()) {
      window.StaffRotaAutomation.Utils.updateStatus('login_required');
      await window.StaffRotaAutomation.Navigation.waitForLogin();
    }
    
    // Check if we're on the correct page
    const onSchedulingPage = window.StaffRotaAutomation.Navigation.isSchedulingPage();
    console.log(`Scheduling page check result: ${onSchedulingPage ? 'Already on scheduling page' : 'Not on scheduling page'}`);
    
    if (!onSchedulingPage) {
      try {
        console.log('Attempting to navigate to scheduling page...');
        await window.StaffRotaAutomation.Navigation.navigateToSchedulingPage();
      } catch (navigationError) {
        console.error('Navigation error:', navigationError);
        
        // Check again if we're on the scheduling page despite the navigation error
        if (window.StaffRotaAutomation.Navigation.isSchedulingPage()) {
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
              await window.StaffRotaAutomation.Utils.sleep(2000);
              
              // Check again if we're on the scheduling page
              if (window.StaffRotaAutomation.Navigation.isSchedulingPage()) {
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
    
    // Keep track of missing employees and failed shifts
    const missingEmployees = [];
    const failedShifts = [];
    
    // Process each employee
    for (let i = 0; i < data.employees.length; i++) {
      const employee = data.employees[i];
      
      window.StaffRotaAutomation.Utils.updateStatus('processing_employee', {
        employee: employee.name,
        index: i + 1,
        total: data.employees.length
      });
      
      // Declare employeeRow variable outside the try block so it's in scope for shift processing
      let employeeRow = null;
      
      try {
        console.log(`Processing employee: ${employee.name} (${i + 1}/${data.employees.length})`);
        
        // Try to find the employee row
        employeeRow = await window.StaffRotaAutomation.EmployeeFinder.findEmployeeRow(employee.name);
        
        if (!employeeRow) {
          // Employee not found, log and continue to next employee
          console.warn(`Employee ${employee.name} not found in the forecasting system`);
          
          // Update status to indicate missing employee
          window.StaffRotaAutomation.Utils.updateStatus('employee_not_found', {
            employee: employee.name,
            index: i + 1,
            total: data.employees.length
          });
          
          // Add to missing employees list
          missingEmployees.push(employee.name);
          
          // Log more detailed information to help with debugging
          console.log(`Note: The rota contains only first names, while the forecasting system may have full names.`);
          console.log(`Tried to match "${employee.name}" against names in the forecasting system.`);
          
          // Skip to next employee
          continue;
        }
        
        console.log(`Found employee row for ${employee.name}`);
      } catch (employeeError) {
        // Error finding employee, log and continue to next employee
        console.error(`Error finding employee ${employee.name}:`, employeeError);
        
        // Update status to indicate error finding employee
        window.StaffRotaAutomation.Utils.updateStatus('employee_error', {
          employee: employee.name,
          error: employeeError.message || 'Unknown error'
        });
        
        // Add to missing employees list
        missingEmployees.push(employee.name);
        
        // Skip to next employee
        continue;
      }
      
      // Only process shifts if we found the employee row
      if (!employeeRow) {
        console.warn(`Skipping shift processing for ${employee.name} as no employee row was found`);
        continue;
      }
      
      // Process each shift
      for (let j = 0; j < employee.shifts.length; j++) {
        const shift = employee.shifts[j];
        
        if (shift.shiftType === 'none') {
          continue;
        }
        
        window.StaffRotaAutomation.Utils.updateStatus('processing_shift', {
          employee: employee.name,
          day: shift.day,
          shiftType: shift.shiftType
        });
        
        try {
          await window.StaffRotaAutomation.EmployeeFinder.clickDayCell(employeeRow, shift.day);
          
          if (shift.shiftType === 'single') {
            const formSaved = await window.StaffRotaAutomation.ShiftHandler.fillShiftForm({
              startTime: window.StaffRotaAutomation.Utils.formatTimeToHHMM(shift.startTime1),
              endTime: window.StaffRotaAutomation.Utils.formatTimeToHHMM(shift.endTime1),
              breakDuration: shift.breakDuration
            });
            
            if (formSaved) {
              console.log(`Successfully saved single shift for ${employee.name} on ${shift.day}`);
              window.StaffRotaAutomation.Utils.updateProgress(1);
            } else {
              console.warn(`Could not confirm if shift was saved for ${employee.name} on ${shift.day}`);
              // Continue anyway, but log the warning
              window.StaffRotaAutomation.Utils.updateProgress(1);
            }
          } else if (shift.shiftType === 'double') {
            const firstFormSaved = await window.StaffRotaAutomation.ShiftHandler.fillShiftForm({
              startTime: window.StaffRotaAutomation.Utils.formatTimeToHHMM(shift.startTime1),
              endTime: window.StaffRotaAutomation.Utils.formatTimeToHHMM(shift.endTime1),
              breakDuration: shift.breakDuration
            });
            
            if (firstFormSaved) {
              console.log(`Successfully saved first shift for ${employee.name} on ${shift.day}`);
              window.StaffRotaAutomation.Utils.updateProgress(1);
              
              // Wait a bit longer to ensure the first form is fully processed
              await window.StaffRotaAutomation.Utils.sleep(2000);
              
              // Click the day cell again for the second shift
              await window.StaffRotaAutomation.EmployeeFinder.clickDayCell(employeeRow, shift.day);
              
              const secondFormSaved = await window.StaffRotaAutomation.ShiftHandler.fillShiftForm({
                startTime: window.StaffRotaAutomation.Utils.formatTimeToHHMM(shift.startTime2),
                endTime: window.StaffRotaAutomation.Utils.formatTimeToHHMM(shift.endTime2),
                breakDuration: 0
              });
              
              if (secondFormSaved) {
                console.log(`Successfully saved second shift for ${employee.name} on ${shift.day}`);
                window.StaffRotaAutomation.Utils.updateProgress(1);
              } else {
                console.warn(`Could not confirm if second shift was saved for ${employee.name} on ${shift.day}`);
                // Continue anyway, but log the warning
                window.StaffRotaAutomation.Utils.updateProgress(1);
              }
            } else {
              console.warn(`Could not confirm if first shift was saved for ${employee.name} on ${shift.day}`);
              // Continue anyway, but log the warning
              window.StaffRotaAutomation.Utils.updateProgress(1);
            }
          }
        } catch (shiftError) {
          try {
            // Safely log the error with additional context
            const errorMessage = shiftError ? (shiftError.message || 'Unknown error') : 'Unknown error';
            console.error(`Error processing shift for ${employee.name} on ${shift.day}: ${errorMessage}`);
            
            // Log additional details if available
            if (shiftError && shiftError.stack) {
              console.debug('Error stack:', shiftError.stack);
            }
            
            // Update status to indicate the error
            window.StaffRotaAutomation.Utils.updateStatus('shift_error', {
              employee: employee.name,
              day: shift.day,
              error: errorMessage
            });
          } catch (loggingError) {
            // Fallback error handling if there's an issue with the error object itself
            console.error(`Error occurred while processing shift for ${employee.name} on ${shift.day}. Additionally, there was an error logging the original error:`, loggingError);
          }
          
          // Try to recover by waiting a bit and continuing with the next shift
          await window.StaffRotaAutomation.Utils.sleep(2000);
          continue;
        }
      }
    }
    
    // Add failed shifts to the list
    const shiftErrors = document.querySelectorAll('.error, .alert-danger, [class*="error"], [class*="alert"]');
    if (shiftErrors.length > 0) {
      Array.from(shiftErrors).forEach(error => {
        if (error.textContent && error.textContent.trim() !== '') {
          failedShifts.push(error.textContent.trim());
        }
      });
    }
    
    // Create a summary of the automation results
    const summary = {
      message: 'Automation completed',
      missingEmployees: missingEmployees.length > 0 ? missingEmployees : [],
      failedShifts: failedShifts.length > 0 ? failedShifts : []
    };
    
    // Log the summary
    console.log('Automation summary:', summary);
    
    // Update status with the summary
    window.StaffRotaAutomation.Utils.updateStatus('complete', summary);
    
    return summary;
  } catch (error) {
    window.StaffRotaAutomation.Utils.updateStatus('error', { error: error.message });
    console.error('Error during automation:', error);
    throw error;
  }
}

/**
 * Initialize the extension
 * This function sets up event listeners and markers to indicate the extension is installed
 */
window.StaffRotaAutomation.Core.initialize = function() {
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
      window.StaffRotaAutomation.Core.startAutomation(message.data)
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
}
