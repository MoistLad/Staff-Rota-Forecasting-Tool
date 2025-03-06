/**
 * Shift handling functions for the Staff Rota Automation extension
 */

// Create a namespace for shift handler functions
window.StaffRotaAutomation = window.StaffRotaAutomation || {};
window.StaffRotaAutomation.ShiftHandler = {};

/**
 * Fill the shift form with the provided data
 * @param {Object} shiftData - The shift data to fill in the form
 * @param {string} shiftData.startTime - The start time in HH:MM format
 * @param {string} shiftData.endTime - The end time in HH:MM format
 * @param {number} shiftData.breakDuration - The break duration in minutes
 * @returns {Promise<boolean>} A promise that resolves to true if the form was saved successfully
 */
window.StaffRotaAutomation.ShiftHandler.fillShiftForm = async function(shiftData) {
  console.log('Filling shift form with data:', shiftData);
  
  // Wait a moment for the form to be fully loaded and interactive
  await window.StaffRotaAutomation.Utils.sleep(1000);
  
  // Find the form elements
  const startTimeInputs = window.StaffRotaAutomation.Utils.findElementsInAllContexts('input[name="startTime"], input[placeholder*="start"], input[id*="start"], input[class*="start-time"]');
  const endTimeInputs = window.StaffRotaAutomation.Utils.findElementsInAllContexts('input[name="endTime"], input[placeholder*="end"], input[id*="end"], input[class*="end-time"]');
  const breakDurationInputs = window.StaffRotaAutomation.Utils.findElementsInAllContexts('input[name="breakDuration"], input[placeholder*="break"], input[id*="break"], input[class*="break"]');
  
  // Find the start time input
  let startTimeInput = startTimeInputs.length > 0 ? startTimeInputs[0] : null;
  if (startTimeInput) {
    console.log('Found start time input, filling with:', shiftData.startTime);
    startTimeInput.value = shiftData.startTime;
    startTimeInput.dispatchEvent(new Event('input', { bubbles: true }));
    startTimeInput.dispatchEvent(new Event('change', { bubbles: true }));
  } else {
    console.warn('Could not find start time input');
  }
  
  // Find the end time input
  let endTimeInput = endTimeInputs.length > 0 ? endTimeInputs[0] : null;
  if (endTimeInput) {
    console.log('Found end time input, filling with:', shiftData.endTime);
    endTimeInput.value = shiftData.endTime;
    endTimeInput.dispatchEvent(new Event('input', { bubbles: true }));
    endTimeInput.dispatchEvent(new Event('change', { bubbles: true }));
  } else {
    console.warn('Could not find end time input');
  }
  
  // Find and fill the break duration input
  let breakDurationInput = breakDurationInputs.length > 0 ? breakDurationInputs[0] : null;
  if (breakDurationInput && shiftData.breakDuration) {
    console.log('Found break duration input, filling with:', shiftData.breakDuration);
    breakDurationInput.value = shiftData.breakDuration;
    breakDurationInput.dispatchEvent(new Event('input', { bubbles: true }));
    breakDurationInput.dispatchEvent(new Event('change', { bubbles: true }));
  } else if (shiftData.breakDuration) {
    console.warn('Could not find break duration input');
  }
  
  // Find and click the save button with more robust selectors
  const saveButtonSelectors = [
    'button[type="submit"]', 
    'input[type="submit"]', 
    'button.save', 
    'input.save', 
    'button[id*="save"]', 
    'input[id*="save"]',
    'button[class*="save"]', 
    'input[class*="save"]'
  ];
  
  // Try to find the save button using valid CSS selectors
  let saveButton = null;
  for (const selector of saveButtonSelectors) {
    try {
      const buttons = window.StaffRotaAutomation.Utils.findElementsInAllContexts(selector);
      if (buttons.length > 0) {
        saveButton = buttons[0];
        break;
      }
    } catch (error) {
      console.warn(`Error using selector "${selector}":`, error.message);
      // Continue with next selector
    }
  }
  
  // If we still haven't found a save button, try a more generic approach
  if (!saveButton) {
    console.log('No save button found with CSS selectors, trying text content approach...');
    try {
      // Get all buttons and inputs that might be submit buttons
      const allButtons = window.StaffRotaAutomation.Utils.findElementsInAllContexts('button, input[type="button"], input[type="submit"]');
      
      // Convert to array and find one with "save" text
      const buttonsArray = Array.from(allButtons || []);
      console.log(`Found ${buttonsArray.length} potential buttons to check`);
      
      // First try exact match for "Save"
      saveButton = buttonsArray.find(el => 
        (el.textContent && el.textContent.trim().toLowerCase() === 'save') ||
        (el.value && el.value.trim().toLowerCase() === 'save')
      );
      
      // If not found, try buttons containing "save"
      if (!saveButton) {
        saveButton = buttonsArray.find(el => 
          (el.textContent && el.textContent.trim().toLowerCase().includes('save')) ||
          (el.value && el.value.trim().toLowerCase().includes('save'))
        );
      }
      
      // If still not found, try buttons with common save icons or classes
      if (!saveButton) {
        saveButton = buttonsArray.find(el => 
          (el.innerHTML && el.innerHTML.includes('fa-save')) || // Font Awesome
          (el.innerHTML && el.innerHTML.includes('save-icon')) || // Common icon class
          (el.className && (
            el.className.includes('save') || 
            el.className.includes('submit') || 
            el.className.includes('confirm')
          ))
        );
      }
    } catch (error) {
      console.warn('Error in fallback button search:', error.message);
    }
  }
  
  if (saveButton) {
    console.log('Found save button, clicking it');
    saveButton.click();
    
    // Wait for the form to be saved and closed
    const formSaved = await window.StaffRotaAutomation.ShiftHandler.waitForFormSave();
    return formSaved;
  } else {
    console.warn('Could not find save button');
    return false;
  }
}

/**
 * Wait for the form to be saved and closed
 * @returns {Promise<boolean>} A promise that resolves to true if the form appears to have been saved successfully
 */
window.StaffRotaAutomation.ShiftHandler.waitForFormSave = async function() {
  console.log('Waiting for form to be saved...');
  
  // Wait a moment for the save operation to start
  await window.StaffRotaAutomation.Utils.sleep(500);
  
  // Check for common indicators that the form is being processed
  const loadingIndicators = document.querySelectorAll('.loading, .spinner, .processing, [class*="loading"], [class*="spinner"]');
  if (loadingIndicators.length > 0) {
    console.log('Found loading indicators, waiting for them to disappear');
    
    // Wait for loading indicators to disappear (up to 5 seconds)
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      await window.StaffRotaAutomation.Utils.sleep(500);
      attempts++;
      
      const visibleLoadingIndicators = Array.from(loadingIndicators).filter(el => 
        el.style.display !== 'none' && 
        el.style.visibility !== 'hidden'
      );
      
      if (visibleLoadingIndicators.length === 0) {
        console.log('Loading indicators disappeared, form likely saved');
        break;
      }
    }
  }
  
  // Check if any error messages appeared
  const errorMessages = document.querySelectorAll('.error, .alert-danger, [class*="error"], [class*="alert"]');
  const visibleErrorMessages = Array.from(errorMessages).filter(el => 
    el.style.display !== 'none' && 
    el.style.visibility !== 'hidden' &&
    el.textContent && 
    el.textContent.trim() !== ''
  );
  
  if (visibleErrorMessages.length > 0) {
    console.warn('Error messages found after saving form:', visibleErrorMessages[0].textContent);
    return false;
  }
  
  // Wait a bit longer to ensure the form is fully processed
  await window.StaffRotaAutomation.Utils.sleep(1000);
  
  // If we got this far without seeing error messages, assume the form was saved successfully
  return true;
}
