/**
 * Employee finder functions for the Staff Rota Automation extension
 */

// Create a namespace for employee finder functions
window.StaffRotaAutomation = window.StaffRotaAutomation || {};
window.StaffRotaAutomation.EmployeeFinder = {};

/**
 * Helper function to normalize a name for comparison
 * @param {string} name - The name to normalize
 * @returns {string} The normalized name
 */
window.StaffRotaAutomation.EmployeeFinder.normalizeName = function(name) {
  if (!name) return '';
  
  // Convert to lowercase
  let normalized = name.toLowerCase();
  
  // Remove common titles
  normalized = normalized.replace(/^(mr|mrs|miss|ms|dr|prof)\.?\s+/i, '');
  
  // Remove punctuation and extra spaces
  normalized = normalized.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  return normalized;
}

/**
 * Check if two names are similar
 * @param {string} name1 - First name to compare
 * @param {string} name2 - Second name to compare
 * @returns {boolean} True if the names are similar
 */
window.StaffRotaAutomation.EmployeeFinder.areSimilarNames = function(name1, name2) {
  if (!name1 || !name2) return false;
  
  // Normalize both names
  const normalized1 = window.StaffRotaAutomation.EmployeeFinder.normalizeName(name1);
  const normalized2 = window.StaffRotaAutomation.EmployeeFinder.normalizeName(name2);
  
  // Exact match after normalization
  if (normalized1 === normalized2) return true;
  
  // Check if one name is contained within the other
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) return true;
  
  // Check for name parts (first name, last name)
  const parts1 = normalized1.split(' ');
  const parts2 = normalized2.split(' ');
  
  // If both names have multiple parts
  if (parts1.length > 1 && parts2.length > 1) {
    // Check if first names match
    if (parts1[0] === parts2[0]) return true;
    
    // Check if last names match
    if (parts1[parts1.length - 1] === parts2[parts2.length - 1]) return true;
    
    // Check for first initial + last name match
    if (parts1[0].charAt(0) === parts2[0].charAt(0) && 
        parts1[parts1.length - 1] === parts2[parts2.length - 1]) return true;
  }
  
  // Check for initials
  if (parts1.length === 1 && parts2.length > 1) {
    // Check if the single part matches the first letter of each part in the other name
    const initials = parts2.map(part => part.charAt(0)).join('');
    if (parts1[0] === initials) return true;
  }
  
  if (parts2.length === 1 && parts1.length > 1) {
    // Check if the single part matches the first letter of each part in the other name
    const initials = parts1.map(part => part.charAt(0)).join('');
    if (parts2[0] === initials) return true;
  }
  
  return false;
}

/**
 * Find the employee row in the scheduling table
 * @param {string} employeeName - The name of the employee to find
 * @returns {Element|null} The employee row element, or null if not found
 */
window.StaffRotaAutomation.EmployeeFinder.findEmployeeRow = function(employeeName) {
  console.log(`Looking for employee row with name: ${employeeName}`);
  
  if (!employeeName) {
    console.warn('Empty employee name provided');
    return null;
  }
  
  // Helper function to search for employee in a document
  const searchForEmployee = (doc) => {
    try {
      // Method 1: Look for exact match in tables
      const tables = doc.querySelectorAll('table');
      for (const table of tables) {
        // Look for rows that might contain employee data
        const rows = table.querySelectorAll('tr');
        
        for (const row of rows) {
          if (row.textContent && row.textContent.includes(employeeName)) {
            console.log(`Found exact match for employee ${employeeName} in table`);
            return row;
          }
        }
      }
      
      // Method 2: Look for specific employee row selectors with exact match
      const specificRows = doc.querySelectorAll('tr[class*="employee"], tr[id*="employee"], div[class*="employee-row"], div[id*="employee-row"]');
      for (const row of specificRows) {
        if (row.textContent && row.textContent.includes(employeeName)) {
          console.log(`Found exact match for employee ${employeeName} with specific selector`);
          return row;
        }
      }
      
      // Method 3: Try fuzzy matching if exact match failed
      console.log(`Exact match not found for ${employeeName}, trying fuzzy matching...`);
      
      // Get all potential employee rows
      const allRows = Array.from(doc.querySelectorAll('tr, div[class*="row"], div[role="row"]'));
      
      // Find rows that might contain employee names
      const potentialRows = allRows.filter(row => {
        // Skip rows with too little text
        if (!row.textContent || row.textContent.trim().length < 2) return false;
        
        // Skip rows that are likely headers
        if (row.tagName === 'TR' && row.querySelector('th')) return false;
        
        // Skip rows with specific classes that indicate they're not employee rows
        if (row.className && (
          row.className.includes('header') || 
          row.className.includes('heading') ||
          row.className.includes('title')
        )) return false;
        
        return true;
      });
      
      // Try to find a row with a similar name
      for (const row of potentialRows) {
        if (window.StaffRotaAutomation.EmployeeFinder.areSimilarNames(row.textContent, employeeName)) {
          console.log(`Found similar name match for ${employeeName}: "${row.textContent.trim()}"`);
          return row;
        }
      }
      
      // Method 4: Generic approach - look for any element containing parts of the employee name
      const nameParts = employeeName.split(' ').filter(part => part.length > 1);
      
      if (nameParts.length > 0) {
        for (const namePart of nameParts) {
          const employeeElements = allRows.filter(el => 
            el.textContent && el.textContent.toLowerCase().includes(namePart.toLowerCase())
          );
          
          if (employeeElements.length > 0) {
            console.log(`Found ${employeeElements.length} elements containing name part "${namePart}"`);
            
            // Find the element that looks most like a row
            const rowLikeElement = employeeElements.find(el => 
              el.tagName === 'TR' || 
              (el.className && el.className.includes('row')) || 
              (el.id && el.id.includes('row')) ||
              (el.getAttribute('role') === 'row')
            );
            
            if (rowLikeElement) {
              console.log(`Found row-like element for employee using name part "${namePart}": "${rowLikeElement.textContent.trim()}"`);
              return rowLikeElement;
            }
            
            // If no row-like element, return the first element that contains the name part
            console.log(`Returning first element containing name part "${namePart}": "${employeeElements[0].textContent.trim()}"`);
            return employeeElements[0];
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error(`Error searching for employee ${employeeName}:`, error);
      return null;
    }
  };
  
  // First try to find the employee in the main iframe
  const mainIframe = document.getElementById('main');
  if (mainIframe) {
    try {
      const iframeDoc = mainIframe.contentDocument || mainIframe.contentWindow.document;
      if (iframeDoc) {
        const employeeRow = searchForEmployee(iframeDoc);
        if (employeeRow) {
          return employeeRow;
        }
      }
    } catch (e) {
      console.warn('Error accessing main iframe content:', e);
    }
  }
  
  // If not found in the main iframe, try other iframes
  const allIframes = document.querySelectorAll('iframe');
  for (const iframe of allIframes) {
    if (iframe.id === 'main') continue; // Skip the main iframe as we already checked it
    
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      if (iframeDoc) {
        const employeeRow = searchForEmployee(iframeDoc);
        if (employeeRow) {
          return employeeRow;
        }
      }
    } catch (e) {
      console.warn(`Error accessing iframe content for ${iframe.id || 'unnamed iframe'}:`, e);
    }
  }
  
  // As a last resort, try the main document
  const employeeRow = searchForEmployee(document);
  if (employeeRow) {
    return employeeRow;
  }
  
  console.warn(`Could not find employee row for: ${employeeName}`);
  return null;
}

/**
 * Click on the day cell for the specified employee and day
 * @param {Element} employeeRow - The employee row element
 * @param {string} day - The day of the week (Monday, Tuesday, etc.)
 * @returns {Promise} A promise that resolves when the day cell has been clicked
 */
window.StaffRotaAutomation.EmployeeFinder.clickDayCell = async function(employeeRow, day) {
  console.log(`Looking for ${day} cell in employee row with ID: ${employeeRow.id || 'unnamed row'}`);
  
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
  
  // Method 1: Try to find day cells with specific selectors
  const specificDayCells = Array.from(employeeRow.querySelectorAll('td[class*="day"], td[headers*="day"], div[class*="day-cell"]'));
  if (specificDayCells.length > dayIndex) {
    console.log(`Found specific day cells, clicking day cell at index ${dayIndex} for ${day}`);
    specificDayCells[dayIndex].click();
    
    // Wait for the shift form to appear
    await window.StaffRotaAutomation.Utils.sleep(1000);
    return;
  }
  
  // Method 2: Try to find all td elements that are direct children
  const directTdCells = Array.from(employeeRow.querySelectorAll(':scope > td'));
  if (directTdCells.length > dayIndex) {
    console.log(`Found direct td cells, clicking day cell at index ${dayIndex} for ${day}`);
    directTdCells[dayIndex].click();
    
    // Wait for the shift form to appear
    await window.StaffRotaAutomation.Utils.sleep(1000);
    return;
  }
  
  // Method 3: Find all day cells in the employee row (fallback to original method)
  const dayCells = Array.from(employeeRow.querySelectorAll('td, div[role="cell"], div[class*="cell"]'));
  
  // Filter out cells that don't look like day cells (e.g., cells with employee info)
  const filteredDayCells = dayCells.filter(cell => {
    // Skip cells with too much text (likely employee info cells)
    if (cell.textContent && cell.textContent.trim().length > 20) {
      return false;
    }
    
    // Skip cells with specific classes that indicate they're not day cells
    if (cell.className && (
      cell.className.includes('employee') || 
      cell.className.includes('name') || 
      cell.className.includes('header')
    )) {
      return false;
    }
    
    return true;
  });
  
  if (filteredDayCells.length > dayIndex) {
    console.log(`Using filtered day cells, clicking day cell at index ${dayIndex} for ${day}`);
    filteredDayCells[dayIndex].click();
    
    // Wait for the shift form to appear
    await window.StaffRotaAutomation.Utils.sleep(1000);
    return;
  }
  // Method 4: Last resort - just try all cells
  if (dayCells.length > dayIndex) {
    console.log(`Using all cells as fallback, clicking cell at index ${dayIndex} for ${day}`);
    dayCells[dayIndex].click();
    
    // Wait for the shift form to appear
    await window.StaffRotaAutomation.Utils.sleep(1000);
    return;
  }
  
  // If we still can't find the day cell, try to find it by day name
  const dayNameCells = Array.from(employeeRow.querySelectorAll('td, div'))
    .filter(cell => cell.textContent && cell.textContent.includes(day));
  
  if (dayNameCells.length > 0) {
    console.log(`Found cell containing day name "${day}", clicking it`);
    dayNameCells[0].click();
    
    // Wait for the shift form to appear
    await window.StaffRotaAutomation.Utils.sleep(1000);
    return;
  }
  
  throw new Error(`Cell for ${day} not found in row. Tried multiple methods but none succeeded.`);
}
