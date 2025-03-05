/**
 * Excel Processor for the Staff Rota Excel to Forecasting Tool
 * Handles reading and processing Excel files
 */

const ExcelProcessor = {
    workbook: null,
    selectedSheet: null,
    extractedData: null,
    
    /**
     * Initialize the Excel processor
     */
    init: function() {
        this.setupEventListeners();
    },
    
    /**
     * Set up event listeners for Excel-related actions
     */
    setupEventListeners: function() {
        // Excel file input change
        document.getElementById('excelFile').addEventListener('change', (event) => {
            this.handleFileSelect(event);
        });
        
        // Sheet select change
        document.getElementById('sheetSelect').addEventListener('change', () => {
            this.handleSheetSelect();
        });
        
        // Process Excel button
        document.getElementById('processExcel').addEventListener('click', () => {
            this.processExcelData();
        });
    },
    
    /**
     * Handle file selection
     * @param {Event} event - File input change event
     */
    handleFileSelect: function(event) {
        const file = event.target.files[0];
        if (!file) {
            return;
        }
        
        const processingStatus = document.getElementById('processingStatus');
        processingStatus.innerHTML = '<div class="alert alert-info">Reading Excel file...</div>';
        
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                this.workbook = XLSX.read(data, { type: 'array' });
                
                // Populate sheet select dropdown
                this.populateSheetSelect();
                
                processingStatus.innerHTML = '<div class="alert alert-success">Excel file loaded successfully. Please select a sheet.</div>';
                document.getElementById('processExcel').disabled = false;
            } catch (error) {
                console.error('Error reading Excel file:', error);
                processingStatus.innerHTML = `<div class="alert alert-danger">Error reading Excel file: ${error.message}</div>`;
                Utils.showError(`Failed to read Excel file: ${error.message}`);
            }
        };
        
        reader.onerror = (error) => {
            console.error('FileReader error:', error);
            processingStatus.innerHTML = '<div class="alert alert-danger">Error reading file</div>';
            Utils.showError('Failed to read file');
        };
        
        reader.readAsArrayBuffer(file);
    },
    
    /**
     * Populate the sheet select dropdown with available sheets
     */
    populateSheetSelect: function() {
        const sheetSelect = document.getElementById('sheetSelect');
        const sheetSelectContainer = document.getElementById('sheetSelectContainer');
        
        sheetSelect.innerHTML = '';
        
        if (!this.workbook || !this.workbook.SheetNames || this.workbook.SheetNames.length === 0) {
            sheetSelectContainer.classList.add('d-none');
            return;
        }
        
        this.workbook.SheetNames.forEach(sheetName => {
            const option = document.createElement('option');
            option.value = sheetName;
            option.textContent = sheetName;
            sheetSelect.appendChild(option);
        });
        
        sheetSelectContainer.classList.remove('d-none');
        
        // Auto-select first sheet
        if (sheetSelect.options.length > 0) {
            sheetSelect.selectedIndex = 0;
            this.handleSheetSelect();
        }
    },
    
    /**
     * Handle sheet selection
     */
    handleSheetSelect: function() {
        const sheetSelect = document.getElementById('sheetSelect');
        const selectedSheetName = sheetSelect.value;
        
        if (!selectedSheetName || !this.workbook) {
            return;
        }
        
        this.selectedSheet = this.workbook.Sheets[selectedSheetName];
        
        // Check if the selected sheet matches the current week in the forecasting system
        const sheetWeekRange = Utils.extractWeekRange(selectedSheetName);
        if (sheetWeekRange) {
            const processingStatus = document.getElementById('processingStatus');
            processingStatus.innerHTML = `<div class="alert alert-info">Selected sheet: ${selectedSheetName}. Make sure this matches the week selected in the forecasting system.</div>`;
        }
    },
    
    /**
     * Process the Excel data from the selected sheet
     */
    processExcelData: function() {
        if (!this.workbook || !this.selectedSheet) {
            Utils.showError('No Excel sheet selected');
            return;
        }
        
        const processingStatus = document.getElementById('processingStatus');
        processingStatus.innerHTML = '<div class="alert alert-info">Processing Excel data...</div>';
        
        try {
            // Convert sheet to JSON
            const sheetData = XLSX.utils.sheet_to_json(this.selectedSheet, { header: 1, defval: null });
            
            // Extract employee names and shift data
            this.extractedData = this.extractEmployeeData(sheetData);
            
            if (this.extractedData.employees.length === 0) {
                processingStatus.innerHTML = '<div class="alert alert-warning">No employee data found in the selected sheet</div>';
                Utils.showWarning('No employee data found in the selected sheet');
                return;
            }
            
            // Display extracted data
            this.displayExtractedData();
            
            processingStatus.innerHTML = '<div class="alert alert-success">Excel data processed successfully</div>';
            Utils.showSuccess(`Processed data for ${this.extractedData.employees.length} employees`);
            
            // Show the results card
            document.getElementById('resultsCard').classList.remove('d-none');
            
        } catch (error) {
            console.error('Error processing Excel data:', error);
            processingStatus.innerHTML = `<div class="alert alert-danger">Error processing Excel data: ${error.message}</div>`;
            Utils.showError(`Failed to process Excel data: ${error.message}`);
        }
    },
    
    /**
     * Extract employee data from the sheet
     * @param {Array} sheetData - Sheet data as a 2D array
     * @returns {Object} Extracted employee data
     */
    extractEmployeeData: function(sheetData) {
        const employees = [];
        const nameColumn = 3; // Column D is index 3
        
        // Find rows with employee names
        for (let rowIndex = 0; rowIndex < sheetData.length; rowIndex++) {
            const row = sheetData[rowIndex];
            
            // Skip empty rows or rows without a name in column D
            if (!row || !row[nameColumn] || typeof row[nameColumn] !== 'string') {
                continue;
            }
            
            const employeeName = row[nameColumn].trim();
            
            // Skip empty names or header rows
            if (!employeeName || employeeName.toLowerCase() === 'name') {
                continue;
            }
            
            // Extract shift data for each day
            const shifts = [];
            
            for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
                const dayName = Utils.getDayName(dayIndex);
                const columnRange = Utils.getColumnRangeForDay(dayIndex);
                
                // Get the time values for this day (up to 4 values)
                const timeValues = [];
                for (let col = columnRange.start; col < columnRange.end; col++) {
                    const value = row[col];
                    // Only add numeric values
                    if (typeof value === 'number') {
                        timeValues.push(value);
                    } else if (typeof value === 'string' && !isNaN(parseFloat(value))) {
                        // Try to convert string to number
                        timeValues.push(parseFloat(value));
                    } else {
                        timeValues.push(null);
                    }
                }
                
                // Determine shift type and break duration
                let shiftType = 'none';
                let breakDuration = 0;
                let startTime1 = null;
                let endTime1 = null;
                let startTime2 = null;
                let endTime2 = null;
                
                if (timeValues[0] && timeValues[1] && !timeValues[2] && !timeValues[3]) {
                    // Single shift (first two columns have values)
                    shiftType = 'single';
                    startTime1 = timeValues[0];
                    endTime1 = timeValues[1];
                    breakDuration = TemplateManager.getDefaultBreakDuration();
                } else if (timeValues[2] && timeValues[3] && !timeValues[0] && !timeValues[1]) {
                    // Single shift (last two columns have values)
                    shiftType = 'single';
                    startTime1 = timeValues[2];
                    endTime1 = timeValues[3];
                    breakDuration = TemplateManager.getDefaultBreakDuration();
                } else if (timeValues[0] && timeValues[1] && timeValues[2] && timeValues[3]) {
                    // Double shift (all four columns have values)
                    shiftType = 'double';
                    startTime1 = timeValues[0];
                    endTime1 = timeValues[1];
                    startTime2 = timeValues[2];
                    endTime2 = timeValues[3];
                    breakDuration = Utils.calculateBreakDuration(endTime1, startTime2);
                }
                
                // Use default finish time if needed
                if (shiftType === 'single' && startTime1 && !endTime1) {
                    const defaultFinish = TemplateManager.getDefaultFinishTime(dayName);
                    if (defaultFinish) {
                        endTime1 = Utils.parseTimeFromHHMM(defaultFinish);
                    }
                }
                
                // Add shift data
                shifts.push({
                    day: dayName,
                    dayIndex,
                    shiftType,
                    startTime1,
                    endTime1,
                    startTime2,
                    endTime2,
                    breakDuration
                });
            }
            
            employees.push({
                name: employeeName,
                rowIndex,
                shifts
            });
        }
        
        return {
            employees,
            sheetName: this.workbook.SheetNames[document.getElementById('sheetSelect').selectedIndex]
        };
    },
    
    /**
     * Display the extracted data in the UI
     */
    displayExtractedData: function() {
        if (!this.extractedData || !this.extractedData.employees) {
            return;
        }
        
        // Display name mapping
        this.displayNameMapping();
        
        // Display shifts data
        this.displayShiftsData();
        
        // Show instructions
        this.displayInstructions();
    },
    
    /**
     * Display name mapping in the UI
     */
    displayNameMapping: function() {
        const nameMapping = document.getElementById('nameMapping');
        nameMapping.innerHTML = '';
        
        this.extractedData.employees.forEach(employee => {
            const row = document.createElement('div');
            row.className = 'name-mapping-row';
            
            const nameInput = document.createElement('div');
            nameInput.className = 'row align-items-center';
            
            nameInput.innerHTML = `
                <div class="col-md-5">
                    <label class="form-label">Excel Name:</label>
                    <input type="text" class="form-control" value="${employee.name}" readonly>
                </div>
                <div class="col-md-5">
                    <label class="form-label">Forecasting System Name:</label>
                    <input type="text" class="form-control" id="mappedName_${employee.rowIndex}" value="${NameMatcher.findMatchForName(employee.name)}">
                </div>
                <div class="col-md-2">
                    <label class="form-label">&nbsp;</label>
                    <button class="btn btn-outline-secondary form-control" onclick="NameMatcher.saveNameMapping('${employee.name}', document.getElementById('mappedName_${employee.rowIndex}').value)">Save</button>
                </div>
            `;
            
            row.appendChild(nameInput);
            nameMapping.appendChild(row);
        });
    },
    
    /**
     * Display shifts data in the UI
     */
    displayShiftsData: function() {
        const shiftsData = document.getElementById('shiftsData');
        shiftsData.innerHTML = '';
        
        // Show shifts card
        document.getElementById('shiftsCard').classList.remove('d-none');
        
        this.extractedData.employees.forEach(employee => {
            const employeeRow = document.createElement('div');
            employeeRow.className = 'shift-row';
            
            const employeeHeader = document.createElement('h6');
            employeeHeader.textContent = employee.name;
            employeeRow.appendChild(employeeHeader);
            
            const shiftsContainer = document.createElement('div');
            shiftsContainer.className = 'row';
            
            employee.shifts.forEach(shift => {
                if (shift.shiftType === 'none') {
                    return; // Skip days with no shifts
                }
                
                const shiftCol = document.createElement('div');
                shiftCol.className = 'col-md-4 mb-3';
                
                const shiftDay = document.createElement('div');
                shiftDay.className = 'shift-day';
                
                let shiftDetails = `<strong>${shift.day}</strong><br>`;
                
                if (shift.shiftType === 'single') {
                    shiftDetails += `
                        Start: ${Utils.formatTimeToHHMM(shift.startTime1)}<br>
                        End: ${Utils.formatTimeToHHMM(shift.endTime1)}<br>
                        Break: ${shift.breakDuration} minutes
                    `;
                } else if (shift.shiftType === 'double') {
                    shiftDetails += `
                        First Shift: ${Utils.formatTimeToHHMM(shift.startTime1)} - ${Utils.formatTimeToHHMM(shift.endTime1)}<br>
                        Second Shift: ${Utils.formatTimeToHHMM(shift.startTime2)} - ${Utils.formatTimeToHHMM(shift.endTime2)}<br>
                        Break: ${shift.breakDuration} minutes
                    `;
                }
                
                shiftDay.innerHTML = shiftDetails;
                shiftCol.appendChild(shiftDay);
                shiftsContainer.appendChild(shiftCol);
            });
            
            employeeRow.appendChild(shiftsContainer);
            shiftsData.appendChild(employeeRow);
        });
    },
    
    /**
     * Display instructions in the UI
     */
    displayInstructions: function() {
        const instructions = document.getElementById('instructions');
        instructions.innerHTML = '';
        
        // Add instructions
        const steps = [
            'Make sure you are logged into the forecasting system and have selected the correct week.',
            'Review the extracted names and make sure they match with names in the forecasting system.',
            'Review the extracted shift data to ensure it is correct.',
            'Click "Start Automated Data Entry" to begin the process.',
            'The Chrome extension will automatically enter all shift data into the forecasting system.',
            'Monitor progress through the progress bar and status updates.'
        ];
        
        steps.forEach(step => {
            const li = document.createElement('li');
            li.className = 'mb-2';
            li.textContent = step;
            instructions.appendChild(li);
        });
        
        // Show instructions card
        document.getElementById('instructionsCard').classList.remove('d-none');
    },
    
    /**
     * Get the processed data
     * @returns {Object} Processed data
     */
    getProcessedData: function() {
        return this.extractedData;
    }
};
