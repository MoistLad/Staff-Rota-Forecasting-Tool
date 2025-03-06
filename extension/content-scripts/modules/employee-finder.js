/**
 * Employee finder functions for the Staff Rota Automation extension
 */

import { sleep } from './utils.js';

/**
 * Find the employee row in the scheduling table
 * @param {string} employeeName - The name of the employee to find
 * @returns {Element|null} The employee row element, or null if not found
 */
export function findEmployeeRow(employeeName) {
  console.log(`Looking for employee row with name: ${employeeName}`);
  
  // Helper function to search for employee in a document
  const searchForEmployee = (doc) => {
    // Method 1: Look for employee rows in tables with more specific selectors
    const tables = doc.querySelectorAll('table');
    for (const table of tables) {
      // Look for rows that might contain employee data
      const rows = table.querySelectorAll('tr');
      
      for (const row of rows) {
        if (row.textContent && row.textContent.includes(employeeName)) {
          console.log(`Found employee row for ${employeeName} in table`);
          return row;
        }
      }
    }
    
    // Method 2: Look for specific employee row selectors
    const specificRows = doc.querySelectorAll('tr[class*="employee"], tr[id*="employee"], div[class*="employee-row"], div[id*="employee-row"]');
    for (const row of specificRows) {
      if (row.textContent && row.textContent.includes(employeeName)) {
        console.log(`Found employee row with specific selector for ${employeeName}`);
        return row;
      }
    }
    
    // Method 3: Generic approach - look for any element containing the employee name
    const employeeElements = Array.from(doc.querySelectorAll('tr, div[class*="row"], div[role="row"]'))
      .filter(el => el.textContent && el.textContent.includes(employeeName));
    
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
    
    return null;
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
export async function clickDayCell(employeeRow, day) {
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
    await sleep(1000);
    return;
  }
  
  // Method 2: Try to find all td elements that are direct children
  const directTdCells = Array.from(employeeRow.querySelectorAll(':scope > td'));
  if (directTdCells.length > dayIndex) {
    console.log(`Found direct td cells, clicking day cell at index ${dayIndex} for ${day}`);
    directTdCells[dayIndex].click();
    
    // Wait for the shift form to appear
    await sleep(1000);
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
    await sleep(1000);
    return;
  }
  // Method 4: Last resort - just try all cells
  if (dayCells.length > dayIndex) {
    console.log(`Using all cells as fallback, clicking cell at index ${dayIndex} for ${day}`);
    dayCells[dayIndex].click();
    
    // Wait for the shift form to appear
    await sleep(1000);
    return;
  }
  
  // If we still can't find the day cell, try to find it by day name
  const dayNameCells = Array.from(employeeRow.querySelectorAll('td, div'))
    .filter(cell => cell.textContent && cell.textContent.includes(day));
  
  if (dayNameCells.length > 0) {
    console.log(`Found cell containing day name "${day}", clicking it`);
    dayNameCells[0].click();
    
    // Wait for the shift form to appear
    await sleep(1000);
    return;
  }
  
  throw new Error(`Cell for ${day} not found in row. Tried multiple methods but none succeeded.`);
}
