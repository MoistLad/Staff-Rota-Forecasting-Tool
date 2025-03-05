/**
 * Forecasting Interface for the Staff Rota Excel to Forecasting Tool
 * Handles interaction with the forecasting system
 */

const ForecastingInterface = {
    currentEmployee: null,
    currentShift: null,
    currentStep: 0,
    totalSteps: 0,
    
    /**
     * Initialize the forecasting interface
     */
    init: function() {
        this.setupEventListeners();
    },
    
    /**
     * Set up event listeners for forecasting-related actions
     */
    setupEventListeners: function() {
        // Start data entry button
        document.getElementById('startDataEntry').addEventListener('click', () => {
            this.startDataEntry();
        });
    },
    
    /**
     * Start the data entry process
     */
    startDataEntry: function() {
        const processedData = ExcelProcessor.getProcessedData();
        
        if (!processedData || !processedData.employees || processedData.employees.length === 0) {
            Utils.showError('No data to enter. Please process an Excel file first.');
            return;
        }
        
        // Show progress bar
        document.getElementById('entryProgress').style.display = 'block';
        
        // Calculate total steps
        this.calculateTotalSteps(processedData);
        
        // Start the data entry process
        this.currentStep = 0;
        this.updateProgress();
        
        // Display instructions
        this.displayDataEntryInstructions(processedData);
    },
    
    /**
     * Calculate the total number of steps in the data entry process
     * @param {Object} data - Processed data
     */
    calculateTotalSteps: function(data) {
        let steps = 0;
        
        data.employees.forEach(employee => {
            employee.shifts.forEach(shift => {
                if (shift.shiftType !== 'none') {
                    // Each shift requires multiple steps:
                    // 1. Find the employee row
                    // 2. Click on the day cell
                    // 3. Enter start time
                    // 4. Enter end time
                    // 5. Enter break duration
                    // 6. Click save
                    steps += 6;
                    
                    // Double shifts require additional steps
                    if (shift.shiftType === 'double') {
                        // Need to add a second shift
                        steps += 5; // (no need to find employee row again)
                    }
                }
            });
        });
        
        this.totalSteps = steps;
    },
    
    /**
     * Update the progress bar
     */
    updateProgress: function() {
        const progressBar = document.getElementById('progressBar');
        const percentage = Math.round((this.currentStep / this.totalSteps) * 100);
        
        progressBar.style.width = `${percentage}%`;
        progressBar.setAttribute('aria-valuenow', percentage);
        progressBar.textContent = `${percentage}%`;
    },
    
    /**
     * Display instructions for the data entry process
     * @param {Object} data - Processed data
     */
    displayDataEntryInstructions: function(data) {
        const currentAction = document.getElementById('currentAction');
        
        currentAction.innerHTML = `
            <div class="alert alert-info">
                <h5>Data Entry Instructions</h5>
                <p>Follow these steps to enter the data into the forecasting system:</p>
                <ol>
                    <li>Make sure you are logged into the forecasting system and have selected the correct week.</li>
                    <li>For each employee, the tool will guide you through entering their shifts.</li>
                    <li>You will need to manually click on the employee's row in the forecasting system.</li>
                    <li>Then click on the day cell to open the shift entry dialog.</li>
                    <li>Enter the start time, end time, and break duration as instructed.</li>
                    <li>Click the Save button to save each shift.</li>
                </ol>
                <p>Let's start with the first employee: <strong>${data.employees[0].name}</strong></p>
                <p>Look for this employee in the forecasting system and click on their row.</p>
                <button class="btn btn-primary" onclick="ForecastingInterface.proceedToNextStep()">I've found the employee</button>
            </div>
        `;
        
        this.currentEmployee = data.employees[0];
        this.currentShift = null;
    },
    
    /**
     * Proceed to the next step in the data entry process
     */
    proceedToNextStep: function() {
        this.currentStep++;
        this.updateProgress();
        
        if (!this.currentEmployee) {
            Utils.showError('No current employee selected');
            return;
        }
        
        // If we don't have a current shift, find the first shift for the current employee
        if (!this.currentShift) {
            this.currentShift = this.findNextShift(this.currentEmployee);
            
            if (!this.currentShift) {
                // No shifts for this employee, move to the next employee
                this.moveToNextEmployee();
                return;
            }
        }
        
        // Display instructions for the current shift
        this.displayShiftInstructions();
    },
    
    /**
     * Find the next shift for an employee
     * @param {Object} employee - Employee object
     * @returns {Object|null} Next shift or null if no more shifts
     */
    findNextShift: function(employee) {
        if (!employee || !employee.shifts) {
            return null;
        }
        
        // Find the first shift that has a type other than 'none'
        return employee.shifts.find(shift => shift.shiftType !== 'none');
    },
    
    /**
     * Move to the next employee
     */
    moveToNextEmployee: function() {
        const processedData = ExcelProcessor.getProcessedData();
        
        if (!processedData || !processedData.employees) {
            this.completeDataEntry();
            return;
        }
        
        // Find the index of the current employee
        const currentIndex = processedData.employees.findIndex(e => e.name === this.currentEmployee.name);
        
        if (currentIndex === -1 || currentIndex >= processedData.employees.length - 1) {
            // No more employees, we're done
            this.completeDataEntry();
            return;
        }
        
        // Move to the next employee
        this.currentEmployee = processedData.employees[currentIndex + 1];
        this.currentShift = null;
        
        const currentAction = document.getElementById('currentAction');
        currentAction.innerHTML = `
            <div class="alert alert-info">
                <p>Now let's move to the next employee: <strong>${this.currentEmployee.name}</strong></p>
                <p>Look for this employee in the forecasting system and click on their row.</p>
                <button class="btn btn-primary" onclick="ForecastingInterface.proceedToNextStep()">I've found the employee</button>
            </div>
        `;
    },
    
    /**
     * Display instructions for the current shift
     */
    displayShiftInstructions: function() {
        if (!this.currentShift) {
            this.moveToNextEmployee();
            return;
        }
        
        const currentAction = document.getElementById('currentAction');
        const shift = this.currentShift;
        
        // Format times for display
        const startTime1 = Utils.formatTimeToHHMM(shift.startTime1);
        const endTime1 = Utils.formatTimeToHHMM(shift.endTime1);
        const breakDuration = shift.breakDuration;
        
        let instructions = '';
        
        if (shift.shiftType === 'single') {
            instructions = `
                <div class="alert alert-info">
                    <h5>Enter Shift for ${this.currentEmployee.name} on ${shift.day}</h5>
                    <p>1. Click on the ${shift.day} cell for this employee to open the shift entry dialog.</p>
                    <p>2. Enter the following information:</p>
                    <ul>
                        <li>Start Time: <strong>${startTime1}</strong></li>
                        <li>End Time: <strong>${endTime1}</strong></li>
                        <li>Break Duration: <strong>${breakDuration} minutes</strong></li>
                    </ul>
                    <p>3. Click the Save button to save the shift.</p>
                    <button class="btn btn-primary" onclick="ForecastingInterface.shiftEntered()">I've entered the shift</button>
                </div>
            `;
        } else if (shift.shiftType === 'double') {
            const startTime2 = Utils.formatTimeToHHMM(shift.startTime2);
            const endTime2 = Utils.formatTimeToHHMM(shift.endTime2);
            
            instructions = `
                <div class="alert alert-info">
                    <h5>Enter First Shift for ${this.currentEmployee.name} on ${shift.day}</h5>
                    <p>1. Click on the ${shift.day} cell for this employee to open the shift entry dialog.</p>
                    <p>2. Enter the following information for the first shift:</p>
                    <ul>
                        <li>Start Time: <strong>${startTime1}</strong></li>
                        <li>End Time: <strong>${endTime1}</strong></li>
                        <li>Break Duration: <strong>${breakDuration} minutes</strong></li>
                    </ul>
                    <p>3. Click the Save button to save the first shift.</p>
                    <p>4. Click on the ${shift.day} cell again to add the second shift.</p>
                    <p>5. Enter the following information for the second shift:</p>
                    <ul>
                        <li>Start Time: <strong>${startTime2}</strong></li>
                        <li>End Time: <strong>${endTime2}</strong></li>
                        <li>Break Duration: <strong>0 minutes</strong> (break is already accounted for in the first shift)</li>
                    </ul>
                    <p>6. Click the Save button to save the second shift.</p>
                    <button class="btn btn-primary" onclick="ForecastingInterface.shiftEntered()">I've entered both shifts</button>
                </div>
            `;
        }
        
        currentAction.innerHTML = instructions;
    },
    
    /**
     * Handle when a shift has been entered
     */
    shiftEntered: function() {
        if (!this.currentEmployee || !this.currentShift) {
            return;
        }
        
        // Remove the current shift from the employee's shifts
        const shiftIndex = this.currentEmployee.shifts.findIndex(s => 
            s.day === this.currentShift.day && s.shiftType === this.currentShift.shiftType
        );
        
        if (shiftIndex !== -1) {
            this.currentEmployee.shifts.splice(shiftIndex, 1);
        }
        
        // Find the next shift for this employee
        this.currentShift = this.findNextShift(this.currentEmployee);
        
        // Increment step counter
        this.currentStep += (this.currentShift && this.currentShift.shiftType === 'double') ? 5 : 0;
        this.updateProgress();
        
        // Display instructions for the next shift or move to the next employee
        if (this.currentShift) {
            this.displayShiftInstructions();
        } else {
            this.moveToNextEmployee();
        }
    },
    
    /**
     * Complete the data entry process
     */
    completeDataEntry: function() {
        const currentAction = document.getElementById('currentAction');
        
        currentAction.innerHTML = `
            <div class="alert alert-success">
                <h5>Data Entry Complete!</h5>
                <p>All shifts have been entered into the forecasting system.</p>
                <p>If you need to make any corrections, you can do so directly in the forecasting system.</p>
            </div>
        `;
        
        // Set progress to 100%
        const progressBar = document.getElementById('progressBar');
        progressBar.style.width = '100%';
        progressBar.setAttribute('aria-valuenow', 100);
        progressBar.textContent = '100%';
        
        Utils.showSuccess('Data entry process completed successfully');
    }
};
