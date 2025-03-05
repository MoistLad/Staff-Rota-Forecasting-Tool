/**
 * Utility functions for the Staff Rota Excel to Forecasting Tool
 */

const Utils = {
    /**
     * Format an integer time value to HH:MM format
     * @param {number} timeValue - Integer time value (e.g., 9, 17, 25)
     * @returns {string} Formatted time string (e.g., "09:00", "17:00", "01:00")
     */
    formatTimeToHHMM: function(timeValue) {
        if (timeValue === null || timeValue === undefined || isNaN(timeValue)) {
            return '';
        }
        
        // Handle times after midnight (24+)
        let hours = Math.floor(timeValue);
        if (hours >= 24) {
            hours = hours - 24;
        }
        
        // Format to HH:MM
        return `${hours.toString().padStart(2, '0')}:00`;
    },
    
    /**
     * Parse a time string in HH:MM format to an integer value
     * @param {string} timeString - Time string in HH:MM format
     * @returns {number|null} Integer time value or null if invalid
     */
    parseTimeFromHHMM: function(timeString) {
        if (!timeString) return null;
        
        const match = timeString.match(/^(\d{1,2}):(\d{2})$/);
        if (!match) return null;
        
        const hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        
        if (isNaN(hours) || isNaN(minutes) || hours > 28 || minutes > 59) {
            return null;
        }
        
        return hours + (minutes / 60);
    },
    
    /**
     * Calculate break duration between two time values
     * @param {number} endTime - End time of first shift
     * @param {number} startTime - Start time of second shift
     * @returns {number} Break duration in minutes
     */
    calculateBreakDuration: function(endTime, startTime) {
        if (endTime === null || startTime === null) {
            return 0;
        }
        
        // Calculate difference in hours
        const diffHours = startTime - endTime;
        
        // Convert to minutes
        return Math.round(diffHours * 60);
    },
    
    /**
     * Get day name from index (0-6)
     * @param {number} index - Day index (0 for Monday, 6 for Sunday)
     * @returns {string} Day name
     */
    getDayName: function(index) {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        return days[index] || '';
    },
    
    /**
     * Show an error message in the error log
     * @param {string} message - Error message
     */
    showError: function(message) {
        const errorLog = document.getElementById('errorLog');
        const errorMessages = document.getElementById('errorMessages');
        
        const errorItem = document.createElement('div');
        errorItem.className = 'error-item';
        errorItem.textContent = message;
        
        errorMessages.appendChild(errorItem);
        errorLog.classList.remove('d-none');
    },
    
    /**
     * Show a warning message in the error log
     * @param {string} message - Warning message
     */
    showWarning: function(message) {
        const errorLog = document.getElementById('errorLog');
        const errorMessages = document.getElementById('errorMessages');
        
        const warningItem = document.createElement('div');
        warningItem.className = 'warning-item';
        warningItem.textContent = message;
        
        errorMessages.appendChild(warningItem);
        errorLog.classList.remove('d-none');
    },
    
    /**
     * Show a success message in the error log
     * @param {string} message - Success message
     */
    showSuccess: function(message) {
        const errorLog = document.getElementById('errorLog');
        const errorMessages = document.getElementById('errorMessages');
        
        const successItem = document.createElement('div');
        successItem.className = 'success-item';
        successItem.textContent = message;
        
        errorMessages.appendChild(successItem);
        errorLog.classList.remove('d-none');
    },
    
    /**
     * Clear all error messages
     */
    clearErrors: function() {
        const errorMessages = document.getElementById('errorMessages');
        errorMessages.innerHTML = '';
        document.getElementById('errorLog').classList.add('d-none');
    },
    
    /**
     * Validate a time string in HH:MM format
     * @param {string} timeString - Time string to validate
     * @returns {boolean} True if valid, false otherwise
     */
    isValidTimeFormat: function(timeString) {
        if (!timeString) return false;
        return /^([01]?[0-9]|2[0-8]):[0-5][0-9]$/.test(timeString);
    },
    
    /**
     * Get the column range for a specific day
     * @param {number} dayIndex - Day index (0 for Monday, 6 for Sunday)
     * @returns {Object} Column range {start, end}
     */
    getColumnRangeForDay: function(dayIndex) {
        // Column D is index 3, then each day has 5 columns
        const startCol = 4 + (dayIndex * 5); // E is index 4
        const endCol = startCol + 4; // 5 columns per day
        return { start: startCol, end: endCol };
    },
    
    /**
     * Extract the week range from a sheet name
     * @param {string} sheetName - Sheet name (e.g., "3rd-9th")
     * @returns {Object|null} Week range object or null if invalid
     */
    extractWeekRange: function(sheetName) {
        const match = sheetName.match(/(\d+)(?:st|nd|rd|th)-(\d+)(?:st|nd|rd|th)/);
        if (!match) return null;
        
        return {
            start: parseInt(match[1], 10),
            end: parseInt(match[2], 10)
        };
    },
    
    /**
     * Compare two week ranges to check if they match
     * @param {Object} range1 - First week range {start, end}
     * @param {Object} range2 - Second week range {start, end}
     * @returns {boolean} True if ranges match, false otherwise
     */
    doWeekRangesMatch: function(range1, range2) {
        if (!range1 || !range2) return false;
        return range1.start === range2.start && range1.end === range2.end;
    },
    
    /**
     * Extract week range from forecasting system date text
     * @param {string} dateText - Date text (e.g., "Mon, 03 Mar - Sun, 09 Mar")
     * @returns {Object|null} Week range object or null if invalid
     */
    extractWeekRangeFromDateText: function(dateText) {
        const match = dateText.match(/\d+/g);
        if (!match || match.length < 2) return null;
        
        return {
            start: parseInt(match[0], 10),
            end: parseInt(match[1], 10)
        };
    }
};
