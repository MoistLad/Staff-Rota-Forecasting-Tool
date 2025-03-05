/**
 * Browser Automation for the Staff Rota Excel to Forecasting Tool
 * Handles automated interaction with the forecasting system using browser automation
 */

const BrowserAutomation = {
    /**
     * Initialize the browser automation
     */
    init: function() {
        // Nothing to initialize
    },
    
    /**
     * Start the automated data entry process
     * @param {Object} processedData - The processed data from Excel
     * @returns {Promise} Promise that resolves when the process is complete
     */
    startAutomatedDataEntry: async function(processedData) {
        if (!processedData || !processedData.employees || processedData.employees.length === 0) {
            Utils.showError('No data to enter. Please process an Excel file first.');
            return;
        }
        
        // Show progress bar
        document.getElementById('entryProgress').style.display = 'block';
        
        // Calculate total steps
        const totalSteps = this.calculateTotalSteps(processedData);
        let currentStep = 0;
        
        // Update progress function
        const updateProgress = (step) => {
            currentStep = step;
            const progressBar = document.getElementById('progressBar');
            const percentage = Math.round((currentStep / totalSteps) * 100);
            
            progressBar.style.width = `${percentage}%`;
            progressBar.setAttribute('aria-valuenow', percentage);
            progressBar.textContent = `${percentage}%`;
        };
        
        // Update status function
        const updateStatus = (message) => {
            const currentAction = document.getElementById('currentAction');
            currentAction.innerHTML = `<div class="alert alert-info">${message}</div>`;
        };
        
        try {
            updateStatus('Starting automated data entry. Please wait...');
            
            // Prepare data for Chrome extension
            const employees = processedData.employees.map(employee => {
                // Map employee names to forecasting system names
                const forecastingName = NameMatcher.findMatchForName(employee.name);
                
                return {
                    name: forecastingName,
                    originalName: employee.name,
                    shifts: employee.shifts
                };
            });
            
            updateStatus('Checking for Chrome extension...');
            
            // Check if the Chrome extension is installed using a more reliable method
            const extensionDetected = await this.detectExtension();
            
            if (!extensionDetected) {
                updateStatus('Chrome extension not detected. Please install the Staff Rota Automation extension.');
                throw new Error('Chrome extension not detected. Please install the Staff Rota Automation extension.');
            }
            
            updateStatus('Sending data to Chrome extension...');
            
            // Send data to the Chrome extension using postMessage
            try {
                // Set up a listener for responses from the extension
                const messageListener = (event) => {
                    // Only accept messages from the same window
                    if (event.source !== window) return;
                    
                    // Only accept messages with the correct format
                    if (!event.data || !event.data.type) return;
                    
                    // Handle response from the extension
                    if (event.data.type === 'STAFF_ROTA_AUTOMATION_RESPONSE' && event.data.action === 'startAutomation') {
                        // Remove the listener to avoid memory leaks
                        window.removeEventListener('message', messageListener);
                        
                        if (event.data.success) {
                            updateStatus('Chrome extension is processing data. Please check the forecasting system tab.');
                        } else {
                            const errorMsg = `Error communicating with Chrome extension: ${event.data.error}`;
                            updateStatus(errorMsg);
                            console.error(errorMsg);
                            // We can't throw from inside an event listener, so we'll just log the error
                        }
                    }
                    
                    // Handle updates from the extension
                    if (event.data.type === 'STAFF_ROTA_AUTOMATION_UPDATE') {
                        // Update progress
                        if (event.data.progress && event.data.total) {
                            const progress = Math.min(event.data.progress, event.data.total);
                            updateProgress(progress);
                        }
                        
                        // Update status
                        if (event.data.status === 'processing_employee' && event.data.data) {
                            updateStatus(`Processing employee ${event.data.data.index}/${event.data.data.total}: ${event.data.data.employee}`);
                        } else if (event.data.status === 'processing_shift' && event.data.data) {
                            updateStatus(`Processing ${event.data.data.day} shift for ${event.data.data.employee}`);
                        } else if (event.data.status === 'login_required') {
                            updateStatus('Please log in to the forecasting system to continue');
                        } else if (event.data.status === 'complete') {
                            updateStatus('Automated data entry completed successfully!');
                            updateProgress(totalSteps);
                            Utils.showSuccess('Automated data entry process completed successfully');
                        } else if (event.data.status === 'error') {
                            updateStatus(`Error during automated data entry: ${event.data.data?.error || 'Unknown error'}`);
                            Utils.showError(`Failed to complete automated data entry: ${event.data.data?.error || 'Unknown error'}`);
                        }
                    }
                };
                
                // Add the message listener
                window.addEventListener('message', messageListener);
                
                // Send the message to the extension
                window.postMessage({
                    type: 'STAFF_ROTA_AUTOMATION',
                    action: 'startAutomation',
                    data: { employees }
                }, '*');
                
            } catch (error) {
                updateStatus(`Error communicating with Chrome extension: ${error.message}`);
                throw new Error(`Error communicating with Chrome extension: ${error.message}`);
            }
            
        } catch (error) {
            console.error('Error during automated data entry:', error);
            updateStatus(`Error during automated data entry: ${error.message}`);
            Utils.showError(`Failed to complete automated data entry: ${error.message}`);
        }
    },
    
    /**
     * Calculate the total number of steps in the data entry process
     * @param {Object} data - Processed data
     * @returns {number} Total number of steps
     */
    calculateTotalSteps: function(data) {
        let steps = 0;
        
        data.employees.forEach(employee => {
            employee.shifts.forEach(shift => {
                if (shift.shiftType !== 'none') {
                    steps += (shift.shiftType === 'double') ? 2 : 1;
                }
            });
        });
        
        return steps;
    },
    
    /**
     * Actual implementation of browser automation using Puppeteer
     * This would be implemented in a real application
     * @param {Object} processedData - The processed data from Excel
     */
    actualBrowserAutomation: async function(processedData) {
        // This is a skeleton implementation that would be filled in with actual Puppeteer code
        
        try {
            // 1. Launch browser and navigate to the forecasting site
            // const browser = await puppeteer.launch({ headless: false });
            // const page = await browser.newPage();
            // await page.goto('https://fourthospitality.com/portal/menus/frameset.asp');
            
            // 2. For each employee
            for (const employee of processedData.employees) {
                // Get the forecasting system name
                const forecastingName = NameMatcher.findMatchForName(employee.name);
                
                // 3. Find the employee row in the table
                // This would use page.evaluate to find the row with the employee name
                // const employeeRow = await this.findEmployeeRow(page, forecastingName);
                
                // 4. For each shift
                for (const shift of employee.shifts) {
                    // Skip days with no shifts
                    if (shift.shiftType === 'none') continue;
                    
                    // 5. Find and click the day cell
                    // await this.clickDayCell(page, employeeRow, shift.day);
                    
                    // 6. Fill in the shift form
                    if (shift.shiftType === 'single') {
                        // Fill in single shift
                        // await this.fillShiftForm(page, {
                        //     startTime: Utils.formatTimeToHHMM(shift.startTime1),
                        //     endTime: Utils.formatTimeToHHMM(shift.endTime1),
                        //     breakDuration: shift.breakDuration
                        // });
                    } else if (shift.shiftType === 'double') {
                        // Fill in first shift
                        // await this.fillShiftForm(page, {
                        //     startTime: Utils.formatTimeToHHMM(shift.startTime1),
                        //     endTime: Utils.formatTimeToHHMM(shift.endTime1),
                        //     breakDuration: shift.breakDuration
                        // });
                        
                        // Click the day cell again for second shift
                        // await this.clickDayCell(page, employeeRow, shift.day);
                        
                        // Fill in second shift
                        // await this.fillShiftForm(page, {
                        //     startTime: Utils.formatTimeToHHMM(shift.startTime2),
                        //     endTime: Utils.formatTimeToHHMM(shift.endTime2),
                        //     breakDuration: 0
                        // });
                    }
                }
            }
            
            // 7. Close the browser
            // await browser.close();
            
            return true;
        } catch (error) {
            console.error('Error in browser automation:', error);
            throw error;
        }
    },
    
    /**
     * Find the employee row in the table
     * @param {Object} page - Puppeteer page object
     * @param {string} employeeName - Employee name to find
     * @returns {Object} Employee row element handle
     */
    findEmployeeRow: async function(page, employeeName) {
        // This would use page.evaluate to find the row with the employee name
        // For example:
        /*
        return await page.evaluate((name) => {
            // Get all employee rows
            const rows = document.querySelectorAll('.employee-row');
            
            // Find the row with the matching name
            for (const row of rows) {
                const nameElement = row.querySelector('.employee-name');
                if (nameElement && nameElement.textContent.trim().toLowerCase().includes(name.toLowerCase())) {
                    return row;
                }
            }
            
            return null;
        }, employeeName);
        */
        
        // For now, just return a placeholder
        return { employeeName };
    },
    
    /**
     * Click on the day cell for an employee
     * @param {Object} page - Puppeteer page object
     * @param {Object} employeeRow - Employee row element handle
     * @param {string} day - Day of the week
     */
    clickDayCell: async function(page, employeeRow, day) {
        // This would use page.evaluate to find and click the day cell
        // For example:
        /*
        await page.evaluate((row, dayName) => {
            // Find the day column index
            const headers = document.querySelectorAll('.day-header');
            let dayIndex = -1;
            
            for (let i = 0; i < headers.length; i++) {
                if (headers[i].textContent.trim().toLowerCase().includes(dayName.toLowerCase())) {
                    dayIndex = i;
                    break;
                }
            }
            
            if (dayIndex === -1) {
                throw new Error(`Day column for ${dayName} not found`);
            }
            
            // Find and click the cell
            const cells = row.querySelectorAll('.day-cell');
            if (dayIndex < cells.length) {
                cells[dayIndex].click();
            } else {
                throw new Error(`Cell for ${dayName} not found in row`);
            }
        }, employeeRow, day);
        */
    },
    
    /**
     * Fill in the shift form
     * @param {Object} page - Puppeteer page object
     * @param {Object} shiftData - Shift data (startTime, endTime, breakDuration)
     */
    fillShiftForm: async function(page, shiftData) {
        // This would use page.type and page.click to fill in the form
        // For example:
        /*
        // Wait for the form to appear
        await page.waitForSelector('.shift-form');
        
        // Fill in start time
        await page.type('input[name="startTime"]', shiftData.startTime);
        
        // Fill in end time
        await page.type('input[name="endTime"]', shiftData.endTime);
        
        // Fill in break duration
        await page.type('input[name="breakDuration"]', shiftData.breakDuration.toString());
        
        // Click save button
        await page.click('.save-button');
        
        // Wait for the form to close
        await page.waitForSelector('.shift-form', { hidden: true });
        */
    },
    
    /**
     * Detect if the Chrome extension is installed and active
     * @returns {Promise<boolean>} Promise that resolves to true if the extension is detected
     */
    detectExtension: function() {
        return new Promise((resolve) => {
            console.log('Starting extension detection process...');
            
            // Method 1: Check for the marker element
            const markerElement = document.getElementById('staff-rota-extension-marker');
            if (markerElement) {
                console.log('Extension detected via DOM marker element');
                resolve(true);
                return;
            }
            
            // Method 2: Check for the data attribute on body
            if (document.body.getAttribute('data-staff-rota-extension-installed') === 'true') {
                console.log('Extension detected via body data attribute');
                resolve(true);
                return;
            }
            
            // Method 3: Check for the marker element in iframes (for Fourth Hospitality system)
            const iframes = document.querySelectorAll('iframe');
            for (const iframe of iframes) {
                try {
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    if (iframeDoc) {
                        // Check for marker in iframe
                        const iframeMarker = iframeDoc.getElementById('staff-rota-extension-marker');
                        if (iframeMarker) {
                            console.log('Extension detected via DOM marker element in iframe');
                            resolve(true);
                            return;
                        }
                        
                        // Check for data attribute in iframe body
                        if (iframeDoc.body && iframeDoc.body.getAttribute('data-staff-rota-extension-installed') === 'true') {
                            console.log('Extension detected via body data attribute in iframe');
                            resolve(true);
                            return;
                        }
                    }
                } catch (e) {
                    // Ignore cross-origin iframe errors
                    console.warn('Could not access iframe content:', e.message);
                }
            }
            
            // Method 4: Use custom events with a longer timeout
            const timeout = setTimeout(() => {
                console.log('Extension detection timeout reached');
                // Remove the event listener to avoid memory leaks
                document.removeEventListener('staffRotaExtensionInstalled', extensionDetectedHandler);
                
                // Final check for marker element (it might have been added after our initial check)
                if (document.getElementById('staff-rota-extension-marker')) {
                    console.log('Extension detected via DOM marker (delayed)');
                    resolve(true);
                    return;
                }
                
                // Check iframes again
                for (const iframe of iframes) {
                    try {
                        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                        if (iframeDoc) {
                            const iframeMarker = iframeDoc.getElementById('staff-rota-extension-marker');
                            if (iframeMarker) {
                                console.log('Extension detected via DOM marker element in iframe (delayed)');
                                resolve(true);
                                return;
                            }
                        }
                    } catch (e) {
                        // Ignore cross-origin iframe errors
                    }
                }
                
                // Try the traditional method as a fallback
                if (window.chrome && chrome.runtime && chrome.runtime.sendMessage) {
                    try {
                        console.log('Trying fallback detection via chrome.runtime.sendMessage...');
                        chrome.runtime.sendMessage({ action: 'ping' }, response => {
                            if (chrome.runtime.lastError) {
                                console.warn('Extension detection fallback failed:', chrome.runtime.lastError);
                                resolve(false);
                            } else {
                                console.log('Extension detected via fallback method');
                                resolve(true);
                            }
                        });
                    } catch (error) {
                        console.warn('Error in extension detection fallback:', error);
                        resolve(false);
                    }
                } else {
                    console.warn('Chrome runtime API not available');
                    resolve(false);
                }
            }, 5000); // 5 second timeout
            
            // Handler for the custom event
            const extensionDetectedHandler = () => {
                console.log('Extension detected via custom event');
                clearTimeout(timeout);
                resolve(true);
            };
            
            // Listen for the custom event from the extension
            document.addEventListener('staffRotaExtensionInstalled', extensionDetectedHandler, { once: true });
            
            // Dispatch an event to trigger any existing content scripts
            console.log('Dispatching checkStaffRotaExtension event...');
            document.dispatchEvent(new CustomEvent('checkStaffRotaExtension'));
            
            // Also dispatch the event in all iframes
            for (const iframe of iframes) {
                try {
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    if (iframeDoc) {
                        iframeDoc.dispatchEvent(new CustomEvent('checkStaffRotaExtension'));
                    }
                } catch (e) {
                    // Ignore cross-origin iframe errors
                }
            }
            
            // Try multiple times with a delay
            setTimeout(() => {
                console.log('Retrying extension detection...');
                // Check for the marker element again
                if (document.getElementById('staff-rota-extension-marker')) {
                    console.log('Extension detected via DOM marker (retry)');
                    clearTimeout(timeout);
                    resolve(true);
                    return;
                }
                
                // Dispatch the event again
                document.dispatchEvent(new CustomEvent('checkStaffRotaExtension'));
                
                // Also dispatch in iframes again
                for (const iframe of iframes) {
                    try {
                        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                        if (iframeDoc) {
                            iframeDoc.dispatchEvent(new CustomEvent('checkStaffRotaExtension'));
                        }
                    } catch (e) {
                        // Ignore cross-origin iframe errors
                    }
                }
            }, 1000);
        });
    }
};
