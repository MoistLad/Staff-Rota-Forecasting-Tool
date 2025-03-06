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
  
  // Wait longer for the form to be fully loaded and interactive
  console.log('Waiting for form to fully load...');
  await window.StaffRotaAutomation.Utils.sleep(2000);
  
  // Log all forms and inputs found for debugging
  const allForms = window.StaffRotaAutomation.Utils.findElementsInAllContexts('form');
  console.log(`Found ${allForms.length} forms in the document`);
  
  const allInputs = window.StaffRotaAutomation.Utils.findElementsInAllContexts('input');
  console.log(`Found ${allInputs.length} input elements in the document`);
  
  // Try to find the shift form popup in the Fourth Hospitality system
  // Based on the DOM structure, the shift form is likely in a popup at /html/body/div[6]/div[3]
  let shiftFormPopup = null;
  try {
    // Try to find the popup container
    const popupContainers = window.StaffRotaAutomation.Utils.findElementsInAllContexts('div.UIXL_loading_DIV, div.confirmMessageBox, div[role="dialog"], div.popup, div.modal');
    if (popupContainers.length > 0) {
      console.log(`Found ${popupContainers.length} potential popup containers`);
      shiftFormPopup = popupContainers[0];
    } else {
      // Try the specific path mentioned in the error
      const bodyElement = document.querySelector('body');
      if (bodyElement) {
        const divElements = bodyElement.querySelectorAll('div');
        if (divElements.length >= 6) {
          const sixthDiv = divElements[5]; // 0-based index, so 5 is the 6th div
          if (sixthDiv && sixthDiv.children.length >= 3) {
            shiftFormPopup = sixthDiv.children[2]; // 0-based index, so 2 is the 3rd div
            console.log('Found shift form popup using specific DOM path');
          }
        }
      }
    }
  } catch (e) {
    console.warn('Error finding shift form popup:', e);
  }

  // If we found a popup, search within it first
  let searchContext = shiftFormPopup || document;
  console.log(`Searching for form elements in ${shiftFormPopup ? 'popup container' : 'entire document'}`);

  // Find the form elements with expanded selectors
  const startTimeInputs = window.StaffRotaAutomation.Utils.findElementsInAllContexts(
    'input[name="startTime"], input[placeholder*="start"], input[id*="start"], input[class*="start-time"], ' +
    'input[name*="start"], input[id*="startTime"], input[class*="startTime"], ' + 
    'input[type="time"], input[name*="time"][name*="start"], input[id*="time"][id*="start"], ' +
    'input[aria-label*="start"], input[title*="start"], input[data-field*="start"]',
    searchContext
  );
  
  const endTimeInputs = window.StaffRotaAutomation.Utils.findElementsInAllContexts(
    'input[name="endTime"], input[placeholder*="end"], input[id*="end"], input[class*="end-time"], ' +
    'input[name*="end"], input[id*="endTime"], input[class*="endTime"], ' +
    'input[type="time"]:not([name*="start"]):not([id*="start"]), input[name*="time"][name*="end"], input[id*="time"][id*="end"], ' +
    'input[aria-label*="end"], input[title*="end"], input[data-field*="end"]',
    searchContext
  );
  
  const breakDurationInputs = window.StaffRotaAutomation.Utils.findElementsInAllContexts(
    'input[name="breakDuration"], input[placeholder*="break"], input[id*="break"], input[class*="break"], ' +
    'input[name*="break"], input[id*="breakDuration"], input[class*="breakDuration"], ' +
    'input[type="number"][name*="break"], input[type="number"][id*="break"], ' +
    'input[aria-label*="break"], input[title*="break"], input[data-field*="break"]',
    searchContext
  );
  
  console.log(`Found ${startTimeInputs.length} potential start time inputs`);
  console.log(`Found ${endTimeInputs.length} potential end time inputs`);
  console.log(`Found ${breakDurationInputs.length} potential break duration inputs`);
  
  // Try to find inputs by examining all inputs and looking for time-related ones
  let startTimeInput = null;
  let endTimeInput = null;
  let breakDurationInput = null;
  
  // First try the specific selectors
  if (startTimeInputs.length > 0) {
    startTimeInput = startTimeInputs[0];
    console.log('Found start time input using selectors');
  }
  
  if (endTimeInputs.length > 0) {
    endTimeInput = endTimeInputs[0];
    console.log('Found end time input using selectors');
  }
  
  if (breakDurationInputs.length > 0 && shiftData.breakDuration) {
    breakDurationInput = breakDurationInputs[0];
    console.log('Found break duration input using selectors');
  }
  
  // If we couldn't find the inputs with selectors, try a more generic approach
  if (!startTimeInput || !endTimeInput) {
    console.log('Using fallback method to find time inputs...');
    
    // Convert NodeList to Array for easier manipulation
    const allInputsArray = Array.from(allInputs);
    
    // Look for time inputs by type, pattern, or other attributes
    const timeInputs = allInputsArray.filter(input => 
      input.type === 'time' || 
      input.type === 'text' && (
        input.pattern?.includes('time') ||
        input.placeholder?.toLowerCase().includes('time') ||
        input.id?.toLowerCase().includes('time') ||
        input.name?.toLowerCase().includes('time') ||
        input.className?.toLowerCase().includes('time')
      )
    );
    
    console.log(`Found ${timeInputs.length} potential time inputs using fallback method`);
    
    // If we found exactly two time inputs, assume they are start and end
    if (timeInputs.length === 2 && !startTimeInput && !endTimeInput) {
      startTimeInput = timeInputs[0];
      endTimeInput = timeInputs[1];
      console.log('Using the first two time inputs as start and end time');
    }
    // If we found more than two, try to determine which is which
    else if (timeInputs.length > 2) {
      // Try to identify start time input if not already found
      if (!startTimeInput) {
        startTimeInput = timeInputs.find(input => 
          input.id?.toLowerCase().includes('start') ||
          input.name?.toLowerCase().includes('start') ||
          input.placeholder?.toLowerCase().includes('start') ||
          input.labels?.some(label => label.textContent.toLowerCase().includes('start'))
        );
        
        if (startTimeInput) {
          console.log('Found start time input by attributes in fallback search');
        } else {
          // If still not found, just use the first time input
          startTimeInput = timeInputs[0];
          console.log('Using first time input as start time');
        }
      }
      
      // Try to identify end time input if not already found
      if (!endTimeInput) {
        endTimeInput = timeInputs.find(input => 
          input.id?.toLowerCase().includes('end') ||
          input.name?.toLowerCase().includes('end') ||
          input.placeholder?.toLowerCase().includes('end') ||
          input.labels?.some(label => label.textContent.toLowerCase().includes('end'))
        );
        
        if (endTimeInput) {
          console.log('Found end time input by attributes in fallback search');
        } else {
          // If still not found, use the second time input, or the first one that's not the start time
          endTimeInput = timeInputs.find(input => input !== startTimeInput);
          console.log('Using next available time input as end time');
        }
      }
    }
    
    // Look for number inputs for break duration if not already found
    if (!breakDurationInput && shiftData.breakDuration) {
      const numberInputs = allInputsArray.filter(input => 
        input.type === 'number' || 
        input.type === 'text' && (
          input.pattern?.includes('number') ||
          input.id?.toLowerCase().includes('number') ||
          input.name?.toLowerCase().includes('number') ||
          input.className?.toLowerCase().includes('number')
        )
      );
      
      console.log(`Found ${numberInputs.length} potential number inputs for break duration`);
      
      breakDurationInput = numberInputs.find(input => 
        input.id?.toLowerCase().includes('break') ||
        input.name?.toLowerCase().includes('break') ||
        input.placeholder?.toLowerCase().includes('break') ||
        input.labels?.some(label => label.textContent.toLowerCase().includes('break'))
      );
      
      if (breakDurationInput) {
        console.log('Found break duration input in fallback search');
      } else if (numberInputs.length > 0) {
        // If no specific break input found, use the first number input
        breakDurationInput = numberInputs[0];
        console.log('Using first number input as break duration');
      }
    }
  }
  
  // Fill the start time input
  if (startTimeInput) {
    console.log('Filling start time input with:', shiftData.startTime);
    startTimeInput.value = shiftData.startTime;
    startTimeInput.dispatchEvent(new Event('input', { bubbles: true }));
    startTimeInput.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Also try to focus and blur the input to trigger any validation
    try {
      startTimeInput.focus();
      startTimeInput.blur();
    } catch (e) {
      console.warn('Error focusing/blurring start time input:', e);
    }
  } else {
    console.warn('Could not find start time input after all attempts');
  }
  
  // Fill the end time input
  if (endTimeInput) {
    console.log('Filling end time input with:', shiftData.endTime);
    endTimeInput.value = shiftData.endTime;
    endTimeInput.dispatchEvent(new Event('input', { bubbles: true }));
    endTimeInput.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Also try to focus and blur the input to trigger any validation
    try {
      endTimeInput.focus();
      endTimeInput.blur();
    } catch (e) {
      console.warn('Error focusing/blurring end time input:', e);
    }
  } else {
    console.warn('Could not find end time input after all attempts');
  }
  
  // Fill the break duration input
  if (breakDurationInput && shiftData.breakDuration) {
    console.log('Filling break duration input with:', shiftData.breakDuration);
    breakDurationInput.value = shiftData.breakDuration;
    breakDurationInput.dispatchEvent(new Event('input', { bubbles: true }));
    breakDurationInput.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Also try to focus and blur the input to trigger any validation
    try {
      breakDurationInput.focus();
      breakDurationInput.blur();
    } catch (e) {
      console.warn('Error focusing/blurring break duration input:', e);
    }
  } else if (shiftData.breakDuration) {
    console.warn('Could not find break duration input after all attempts');
  }
  
  // Wait a moment after filling the form to ensure all events are processed
  await window.StaffRotaAutomation.Utils.sleep(1000);
  
  // Find and click the save button with more robust selectors
  const saveButtonSelectors = [
    'button[type="submit"]', 
    'input[type="submit"]', 
    'button.save', 
    'input.save', 
    'button[id*="save"]', 
    'input[id*="save"]',
    'button[class*="save"]', 
    'input[class*="save"]',
    'button[name*="save"]',
    'input[name*="save"]',
    'button[value*="save"]',
    'input[value*="save"]',
    'button[title*="save"]',
    'input[title*="save"]',
    'button[aria-label*="save"]',
    'input[aria-label*="save"]',
    // Also try common submit button selectors
    'button[type="button"][class*="submit"]',
    'input[type="button"][class*="submit"]',
    'button[class*="btn-primary"]',
    'input[class*="btn-primary"]',
    'button.primary',
    'input.primary'
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
      const allButtons = window.StaffRotaAutomation.Utils.findElementsInAllContexts('button, input[type="button"], input[type="submit"], a[role="button"], div[role="button"], span[role="button"]');
      
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
      
      // If not found, try buttons with "ok", "submit", "confirm", "done" text
      if (!saveButton) {
        const commonButtonTexts = ['ok', 'submit', 'confirm', 'done', 'apply', 'update'];
        
        for (const text of commonButtonTexts) {
          saveButton = buttonsArray.find(el => 
            (el.textContent && el.textContent.trim().toLowerCase() === text) ||
            (el.value && el.value.trim().toLowerCase() === text)
          );
          
          if (saveButton) {
            console.log(`Found button with text "${text}"`);
            break;
          }
        }
        
        if (!saveButton) {
          for (const text of commonButtonTexts) {
            saveButton = buttonsArray.find(el => 
              (el.textContent && el.textContent.trim().toLowerCase().includes(text)) ||
              (el.value && el.value.trim().toLowerCase().includes(text))
            );
            
            if (saveButton) {
              console.log(`Found button containing text "${text}"`);
              break;
            }
          }
        }
      }
      
      // If still not found, try buttons with common save icons or classes
      if (!saveButton) {
        saveButton = buttonsArray.find(el => 
          (el.innerHTML && (
            el.innerHTML.includes('fa-save') || // Font Awesome
            el.innerHTML.includes('fa-check') || // Font Awesome check
            el.innerHTML.includes('fa-ok') || // Font Awesome ok
            el.innerHTML.includes('save-icon') || // Common icon class
            el.innerHTML.includes('check-icon') || // Common icon class
            el.innerHTML.includes('ok-icon') // Common icon class
          )) || 
          (el.className && (
            el.className.includes('save') || 
            el.className.includes('submit') || 
            el.className.includes('confirm') ||
            el.className.includes('primary') ||
            el.className.includes('ok') ||
            el.className.includes('done')
          ))
        );
      }
      
      // If still not found, look for any button that appears to be a primary action
      if (!saveButton) {
        saveButton = buttonsArray.find(el => 
          el.className && (
            el.className.includes('btn-primary') ||
            el.className.includes('primary-button') ||
            el.className.includes('main-action')
          )
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
