/**
 * Core functionality for the Staff Rota Automation extension
 */

import { waitForPageLoad, updateStatus, updateProgress, sleep, formatTimeToHHMM } from './utils.js';
import { isLoginPage, waitForLogin, isSchedulingPage, navigateToSchedulingPage } from './navigation.js';
import { findEmployeeRow, clickDayCell } from './employee-finder.js';
import { fillShiftForm } from './shift-handler.js';

/**
 * Start the automation process
 * @param {Object} data - The automation data
 * @returns {Promise<Object>} A promise that resolves with the result of the automation
 */
export async function startAutomation(data) {
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
            const formSaved = await fillShiftForm({
              startTime: formatTimeToHHMM(shift.startTime1),
              endTime: formatTimeToHHMM(shift.endTime1),
              breakDuration: shift.breakDuration
            });
            
            if (formSaved) {
              console.log(`Successfully saved single shift for ${employee.name} on ${shift.day}`);
              updateProgress(1);
            } else {
              console.warn(`Could not confirm if shift was saved for ${employee.name} on ${shift.day}`);
              // Continue anyway, but log the warning
              updateProgress(1);
            }
          } else if (shift.shiftType === 'double') {
            const firstFormSaved = await fillShiftForm({
              startTime: formatTimeToHHMM(shift.startTime1),
              endTime: formatTimeToHHMM(shift.endTime1),
              breakDuration: shift.breakDuration
            });
            
            if (firstFormSaved) {
              console.log(`Successfully saved first shift for ${employee.name} on ${shift.day}`);
              updateProgress(1);
              
              // Wait a bit longer to ensure the first form is fully processed
              await sleep(2000);
              
              // Click the day cell again for the second shift
              await clickDayCell(employeeRow, shift.day);
              
              const secondFormSaved = await fillShiftForm({
                startTime: formatTimeToHHMM(shift.startTime2),
                endTime: formatTimeToHHMM(shift.endTime2),
                breakDuration: 0
              });
              
              if (secondFormSaved) {
                console.log(`Successfully saved second shift for ${employee.name} on ${shift.day}`);
                updateProgress(1);
              } else {
                console.warn(`Could not confirm if second shift was saved for ${employee.name} on ${shift.day}`);
                // Continue anyway, but log the warning
                updateProgress(1);
              }
            } else {
              console.warn(`Could not confirm if first shift was saved for ${employee.name} on ${shift.day}`);
              // Continue anyway, but log the warning
              updateProgress(1);
            }
          }
        } catch (shiftError) {
          console.error(`Error processing shift for ${employee.name} on ${shift.day}:`, shiftError);
          
          // Try to recover by waiting a bit and continuing with the next shift
          await sleep(2000);
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
 * Initialize the extension
 * This function sets up event listeners and markers to indicate the extension is installed
 */
export function initialize() {
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
}
