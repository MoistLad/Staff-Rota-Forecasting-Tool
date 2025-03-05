/**
 * Server for the Staff Rota Excel to Forecasting Tool
 * Handles browser automation using Puppeteer
 */

const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const bodyParser = require('body-parser');

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// Enable CORS and JSON body parsing
app.use(cors());
app.use(bodyParser.json());

// Serve static files from the current directory
app.use(express.static('./'));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// API endpoint for automated data entry
app.post('/api/automate', async (req, res) => {
    try {
        const { employees } = req.body;
        
        if (!employees || !Array.isArray(employees) || employees.length === 0) {
            return res.status(400).json({ error: 'Invalid employee data' });
        }
        
        // Launch browser
        const browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: ['--start-maximized']
        });
        
        const page = await browser.newPage();
        
        // Navigate to the forecasting site
        await page.goto('https://fourthospitality.com/portal/menus/frameset.asp');
        
        // Wait for user to log in and navigate to the correct page
        // This is a placeholder - in a real implementation, you might want to
        // add a way for the user to signal when they're ready to proceed
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        // Process each employee
        for (const employee of employees) {
            // Find the employee row
            const employeeRow = await findEmployeeRow(page, employee.name);
            
            if (!employeeRow) {
                console.warn(`Employee ${employee.name} not found in the forecasting system`);
                continue;
            }
            
            // Process each shift
            for (const shift of employee.shifts) {
                if (shift.shiftType === 'none') continue;
                
                // Click on the day cell
                await clickDayCell(page, employeeRow, shift.day);
                
                // Fill in the shift form
                if (shift.shiftType === 'single') {
                    await fillShiftForm(page, {
                        startTime: formatTimeToHHMM(shift.startTime1),
                        endTime: formatTimeToHHMM(shift.endTime1),
                        breakDuration: shift.breakDuration
                    });
                } else if (shift.shiftType === 'double') {
                    // First shift
                    await fillShiftForm(page, {
                        startTime: formatTimeToHHMM(shift.startTime1),
                        endTime: formatTimeToHHMM(shift.endTime1),
                        breakDuration: shift.breakDuration
                    });
                    
                    // Click on the day cell again for second shift
                    await clickDayCell(page, employeeRow, shift.day);
                    
                    // Second shift
                    await fillShiftForm(page, {
                        startTime: formatTimeToHHMM(shift.startTime2),
                        endTime: formatTimeToHHMM(shift.endTime2),
                        breakDuration: 0
                    });
                }
            }
        }
        
        // Close the browser
        await browser.close();
        
        res.json({ success: true, message: 'Automated data entry completed successfully' });
    } catch (error) {
        console.error('Error during automated data entry:', error);
        res.status(500).json({ error: error.message });
    }
});

// Helper function to find employee row
async function findEmployeeRow(page, employeeName) {
    return await page.evaluate((name) => {
        // This is a placeholder implementation
        // In a real implementation, you would need to inspect the page structure
        // and find the appropriate selectors
        const rows = document.querySelectorAll('tr');
        
        for (const row of rows) {
            if (row.textContent.toLowerCase().includes(name.toLowerCase())) {
                return row;
            }
        }
        
        return null;
    }, employeeName);
}

// Helper function to click on day cell
async function clickDayCell(page, employeeRow, day) {
    await page.evaluate((row, dayName) => {
        // This is a placeholder implementation
        // In a real implementation, you would need to inspect the page structure
        // and find the appropriate selectors
        const cells = row.querySelectorAll('td');
        
        // Map day names to column indices
        const dayMap = {
            'Monday': 1,
            'Tuesday': 2,
            'Wednesday': 3,
            'Thursday': 4,
            'Friday': 5,
            'Saturday': 6,
            'Sunday': 7
        };
        
        const dayIndex = dayMap[dayName];
        
        if (dayIndex && dayIndex < cells.length) {
            cells[dayIndex].click();
        } else {
            throw new Error(`Cell for ${dayName} not found in row`);
        }
    }, employeeRow, day);
    
    // Wait for the shift form to appear
    await page.waitForSelector('.shift-form', { timeout: 5000 });
}

// Helper function to fill shift form
async function fillShiftForm(page, shiftData) {
    await page.evaluate((data) => {
        // This is a placeholder implementation
        // In a real implementation, you would need to inspect the page structure
        // and find the appropriate selectors
        document.querySelector('input[name="startTime"]').value = data.startTime;
        document.querySelector('input[name="endTime"]').value = data.endTime;
        document.querySelector('input[name="breakDuration"]').value = data.breakDuration;
        
        // Click save button
        document.querySelector('.save-button').click();
    }, shiftData);
    
    // Wait for the form to close
    await page.waitForSelector('.shift-form', { hidden: true, timeout: 5000 });
}

// Helper function to format time
function formatTimeToHHMM(time) {
    if (!time) return '';
    
    const hours = Math.floor(time);
    const minutes = Math.round((time - hours) * 60);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Open http://localhost:${port}/index.html to use the tool`);
});
