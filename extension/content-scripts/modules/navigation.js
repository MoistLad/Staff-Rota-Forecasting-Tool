/**
 * Navigation functions for the Staff Rota Automation extension
 */

// Create a namespace for navigation functions
window.StaffRotaAutomation = window.StaffRotaAutomation || {};
window.StaffRotaAutomation.Navigation = {};

/**
 * Check if we're on the login page
 * @returns {boolean} True if we're on the login page, false otherwise
 */
window.StaffRotaAutomation.Navigation.isLoginPage = function() {
  return document.querySelector('form[name="login"]') !== null;
}

/**
 * Wait for the user to log in
 * @returns {Promise} A promise that resolves when the user has logged in
 */
window.StaffRotaAutomation.Navigation.waitForLogin = function() {
  return new Promise(resolve => {
    const interval = setInterval(() => {
      if (!window.StaffRotaAutomation.Navigation.isLoginPage()) {
        clearInterval(interval);
        resolve();
      }
    }, 1000);
  });
}

/**
 * Check if we're on the scheduling page
 * @returns {boolean} True if we're on the scheduling page, false otherwise
 */
window.StaffRotaAutomation.Navigation.isSchedulingPage = function() {
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
 * @returns {Promise} A promise that resolves when navigation is complete
 */
window.StaffRotaAutomation.Navigation.navigateToSchedulingPage = async function() {
  console.log('Attempting to navigate to scheduling page...');
  
  if (window.StaffRotaAutomation.Navigation.isSchedulingPage()) {
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
        
        if (window.StaffRotaAutomation.Navigation.isSchedulingPage()) {
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
    
    await window.StaffRotaAutomation.Utils.sleep(2000);
    
    if (window.StaffRotaAutomation.Navigation.isSchedulingPage()) {
      console.log('Successfully navigated to scheduling page');
      return;
    }
  }
  
  // Method 3: Look for the burger menu and try to open it to find Scheduling
  const burgerMenu = document.querySelector('.UIXL_burger_icon, [class*="burger"], [class*="menu-icon"]');
  if (burgerMenu) {
    console.log('Found burger menu, clicking it');
    burgerMenu.click();
    
    await window.StaffRotaAutomation.Utils.sleep(1000);
    
    const schedulingInMenu = Array.from(document.querySelectorAll('a, li, div, span'))
      .filter(el => el.textContent && 
             (el.textContent.includes('Scheduling') || 
              el.textContent.includes('Rota') || 
              el.textContent.includes('Schedule')));
    
    if (schedulingInMenu.length > 0) {
      console.log(`Found ${schedulingInMenu.length} potential Scheduling items in menu, clicking the first one`);
      schedulingInMenu[0].click();
      
      await window.StaffRotaAutomation.Utils.sleep(2000);
      
      if (window.StaffRotaAutomation.Navigation.isSchedulingPage()) {
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
      
      await window.StaffRotaAutomation.Utils.sleep(3000);
      
      if (window.StaffRotaAutomation.Navigation.isSchedulingPage()) {
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
    
    await window.StaffRotaAutomation.Utils.sleep(2000);
    
    if (window.StaffRotaAutomation.Navigation.isSchedulingPage()) {
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
          
          await window.StaffRotaAutomation.Utils.sleep(1000);
          
          if (window.StaffRotaAutomation.Navigation.isSchedulingPage()) {
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
