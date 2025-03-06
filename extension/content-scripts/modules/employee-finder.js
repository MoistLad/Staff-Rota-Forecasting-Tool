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
  
  // Extract first name only (since rota only contains first names)
  const parts = normalized.split(' ');
  if (parts.length > 0) {
    normalized = parts[0];
  }
  
  return normalized;
}

/**
 * Get just the first name from a full name
 * @param {string} fullName - The full name
 * @returns {string} The first name
 */
window.StaffRotaAutomation.EmployeeFinder.getFirstName = function(fullName) {
  if (!fullName) return '';
  
  // Convert to lowercase and trim
  const normalized = fullName.toLowerCase().trim();
  
  // Remove titles
  const withoutTitles = normalized.replace(/^(mr|mrs|miss|ms|dr|prof)\.?\s+/i, '');
  
  // Get first part of the name
  const parts = withoutTitles.split(/\s+/);
  return parts[0] || '';
}

/**
 * Map common nicknames to formal names
 * @param {string} name - The name to check for nicknames
 * @returns {string} The mapped name or the original if no mapping exists
 */
window.StaffRotaAutomation.EmployeeFinder.mapNickname = function(name) {
  if (!name) return '';
  
  const normalized = name.toLowerCase();
  
  // Common nickname mappings
  const nicknames = {
    'rob': 'robert',
    'bob': 'robert',
    'bobby': 'robert',
    'robbie': 'robert',
    
    'rick': 'richard',
    'dick': 'richard',
    'richie': 'richard',
    
    'will': 'william',
    'bill': 'william',
    'billy': 'william',
    
    'jim': 'james',
    'jimmy': 'james',
    'jamie': 'james',
    
    'johnny': 'john',
    'jon': 'john',
    
    'mike': 'michael',
    'mikey': 'michael',
    'mick': 'michael',
    
    'tom': 'thomas',
    'tommy': 'thomas',
    
    'chris': 'christopher',
    
    'joe': 'joseph',
    'joey': 'joseph',
    
    'dan': 'daniel',
    'danny': 'daniel',
    
    'matt': 'matthew',
    'matty': 'matthew',
    
    'dave': 'david',
    'davey': 'david',
    
    'nick': 'nicholas',
    'nicky': 'nicholas',
    
    'tony': 'anthony',
    
    'andy': 'andrew',
    'drew': 'andrew',
    
    'steve': 'steven',
    'stephen': 'steven',
    
    'ed': 'edward',
    'eddie': 'edward',
    'ted': 'edward',
    
    'charlie': 'charles',
    'chuck': 'charles',
    
    'ben': 'benjamin',
    'benji': 'benjamin',
    
    'sam': 'samuel',
    'sammy': 'samuel',
    
    'alex': 'alexander',
    
    'pat': 'patrick',
    'patty': 'patrick',
    
    'vicky': 'victoria',
    'vicki': 'victoria',
    
    'liz': 'elizabeth',
    'beth': 'elizabeth',
    'lizzie': 'elizabeth',
    'eliza': 'elizabeth',
    
    'cathy': 'catherine',
    'katherine': 'catherine',
    'kate': 'catherine',
    'katie': 'catherine',
    'cat': 'catherine',
    
    'jen': 'jennifer',
    'jenny': 'jennifer',
    
    'maggie': 'margaret',
    'meg': 'margaret',
    'peggy': 'margaret',
    
    'becky': 'rebecca',
    
    'steph': 'stephanie',
    
    'debbie': 'deborah',
    'deb': 'deborah',
    
    'jess': 'jessica',
    'jessie': 'jessica',
    
    'sue': 'susan',
    'suzie': 'susan',
    
    'barb': 'barbara',
    
    'kim': 'kimberly',
    
    'mandy': 'amanda',
    
    'patty': 'patricia',
    'pat': 'patricia',
    
    'nikki': 'nicole',
    
    'chris': 'christine',
    'christy': 'christine',
    
    'sam': 'samantha',
    
    'shelly': 'michelle',
    
    'angie': 'angela',
    
    'mel': 'melissa',
    'missy': 'melissa',
    
    'izzy': 'isabelle'
  };
  
  return nicknames[normalized] || normalized;
}

/**
 * Check if two names are similar
 * @param {string} name1 - First name to compare
 * @param {string} name2 - Second name to compare
 * @returns {boolean} True if the names are similar
 */
window.StaffRotaAutomation.EmployeeFinder.areSimilarNames = function(name1, name2) {
  if (!name1 || !name2) return false;
  
  // Get first names only
  const firstName1 = window.StaffRotaAutomation.EmployeeFinder.getFirstName(name1);
  const firstName2 = window.StaffRotaAutomation.EmployeeFinder.getFirstName(name2);
  
  // Normalize both names
  const normalized1 = window.StaffRotaAutomation.EmployeeFinder.normalizeName(firstName1);
  const normalized2 = window.StaffRotaAutomation.EmployeeFinder.normalizeName(firstName2);
  
  // Exact match after normalization
  if (normalized1 === normalized2) return true;
  
  // Check nickname mappings
  const mapped1 = window.StaffRotaAutomation.EmployeeFinder.mapNickname(normalized1);
  const mapped2 = window.StaffRotaAutomation.EmployeeFinder.mapNickname(normalized2);
  
  // Check if the mapped names match
  if (mapped1 === mapped2) return true;
  
  // Check if one name is contained within the other
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) return true;
  
  // Check for first letter match (for very short names)
  if (normalized1.length > 0 && normalized2.length > 0 && 
      normalized1.charAt(0) === normalized2.charAt(0) &&
      (normalized1.length <= 3 || normalized2.length <= 3)) {
    return true;
  }
  
  // Check for Levenshtein distance for similar names (typos, etc.)
  if (normalized1.length > 2 && normalized2.length > 2) {
    // Simple Levenshtein distance calculation
    const distance = window.StaffRotaAutomation.EmployeeFinder.levenshteinDistance(normalized1, normalized2);
    // Allow 1 character difference for every 3 characters in the longer name
    const maxAllowedDistance = Math.ceil(Math.max(normalized1.length, normalized2.length) / 3);
    if (distance <= maxAllowedDistance) return true;
  }
  
  return false;
}

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} The Levenshtein distance
 */
window.StaffRotaAutomation.EmployeeFinder.levenshteinDistance = function(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  // Initialize matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
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
      
      // Try to find a row with a similar name - focus on first name matching
      for (const row of potentialRows) {
        // Get the row text and try to extract what looks like a name
        const rowText = row.textContent.trim();
        
        // Log the potential match for debugging
        console.log(`Checking potential match: "${rowText}" against "${employeeName}"`);
        
        // Check if the row contains a similar name
        if (window.StaffRotaAutomation.EmployeeFinder.areSimilarNames(rowText, employeeName)) {
          console.log(`Found similar name match for ${employeeName}: "${rowText}"`);
          return row;
        }
        
        // Try to extract what might be a name from the row text
        // This handles cases where the row contains other information besides the name
        const potentialNameParts = rowText.split(/[\s\t\n,;:|]+/).filter(part => 
          part.length > 1 && 
          !/^\d+$/.test(part) && // Skip numbers
          !/^(mon|tue|wed|thu|fri|sat|sun)/i.test(part) // Skip day abbreviations
        );
        
        // Check each potential name part
        for (const namePart of potentialNameParts) {
          if (window.StaffRotaAutomation.EmployeeFinder.areSimilarNames(namePart, employeeName)) {
            console.log(`Found similar name match in part "${namePart}" for ${employeeName}`);
            return row;
          }
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
  // Check if employeeRow is defined
  if (!employeeRow) {
    console.error(`Cannot click day cell: employeeRow is null or undefined for day ${day}`);
    throw new Error(`Employee row is not defined when trying to click ${day} cell`);
  }
  
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
