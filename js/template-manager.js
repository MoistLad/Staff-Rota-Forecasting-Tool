/**
 * Template Manager for the Staff Rota Excel to Forecasting Tool
 * Handles saving, loading, and managing templates for default break durations and finish times
 */

const TemplateManager = {
    /**
     * Initialize the template manager
     */
    init: function() {
        this.loadTemplateList();
        this.setupEventListeners();
    },
    
    /**
     * Set up event listeners for template-related actions
     */
    setupEventListeners: function() {
        // Save template button
        document.getElementById('saveTemplate').addEventListener('click', () => {
            this.saveCurrentTemplate();
        });
        
        // Load template button
        document.getElementById('loadTemplate').addEventListener('click', () => {
            this.loadSelectedTemplate();
        });
        
        // Delete template button
        document.getElementById('deleteTemplate').addEventListener('click', () => {
            this.deleteSelectedTemplate();
        });
    },
    
    /**
     * Save the current template to localStorage
     */
    saveCurrentTemplate: function() {
        const templateName = document.getElementById('templateName').value.trim();
        
        if (!templateName) {
            Utils.showError('Please enter a template name');
            return;
        }
        
        const defaultBreakDuration = parseInt(document.getElementById('defaultBreakDuration').value, 10) || 30;
        
        // Get default finish times for each day
        const defaultFinishTimes = {};
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        
        for (const day of days) {
            const timeInput = document.getElementById(`defaultFinish${day}`).value;
            if (timeInput && !Utils.isValidTimeFormat(timeInput)) {
                Utils.showError(`Invalid time format for ${day}. Please use HH:MM format.`);
                return;
            }
            defaultFinishTimes[day.toLowerCase()] = timeInput || '';
        }
        
        // Create template object
        const template = {
            name: templateName,
            defaultBreakDuration,
            defaultFinishTimes
        };
        
        // Get existing templates
        const templates = this.getTemplates();
        
        // Check if template with this name already exists
        const existingIndex = templates.findIndex(t => t.name === templateName);
        if (existingIndex >= 0) {
            // Update existing template
            templates[existingIndex] = template;
            Utils.showSuccess(`Template "${templateName}" updated`);
        } else {
            // Add new template
            templates.push(template);
            Utils.showSuccess(`Template "${templateName}" saved`);
        }
        
        // Save templates to localStorage
        localStorage.setItem('rotaTemplates', JSON.stringify(templates));
        
        // Refresh template list
        this.loadTemplateList();
    },
    
    /**
     * Load the selected template
     */
    loadSelectedTemplate: function() {
        const templateSelect = document.getElementById('templateSelect');
        if (templateSelect.selectedIndex === -1) {
            Utils.showWarning('Please select a template to load');
            return;
        }
        
        const templateName = templateSelect.options[templateSelect.selectedIndex].value;
        const templates = this.getTemplates();
        const template = templates.find(t => t.name === templateName);
        
        if (!template) {
            Utils.showError(`Template "${templateName}" not found`);
            return;
        }
        
        // Fill form with template data
        document.getElementById('templateName').value = template.name;
        document.getElementById('defaultBreakDuration').value = template.defaultBreakDuration || 30;
        
        // Set default finish times
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        for (const day of days) {
            const input = document.getElementById(`defaultFinish${day}`);
            input.value = template.defaultFinishTimes[day.toLowerCase()] || '';
        }
        
        Utils.showSuccess(`Template "${templateName}" loaded`);
    },
    
    /**
     * Delete the selected template
     */
    deleteSelectedTemplate: function() {
        const templateSelect = document.getElementById('templateSelect');
        if (templateSelect.selectedIndex === -1) {
            Utils.showWarning('Please select a template to delete');
            return;
        }
        
        const templateName = templateSelect.options[templateSelect.selectedIndex].value;
        
        if (!confirm(`Are you sure you want to delete the template "${templateName}"?`)) {
            return;
        }
        
        // Get templates and filter out the one to delete
        const templates = this.getTemplates();
        const filteredTemplates = templates.filter(t => t.name !== templateName);
        
        // Save updated templates
        localStorage.setItem('rotaTemplates', JSON.stringify(filteredTemplates));
        
        // Refresh template list
        this.loadTemplateList();
        
        Utils.showSuccess(`Template "${templateName}" deleted`);
    },
    
    /**
     * Load the template list from localStorage
     */
    loadTemplateList: function() {
        const templateSelect = document.getElementById('templateSelect');
        templateSelect.innerHTML = '';
        
        const templates = this.getTemplates();
        
        if (templates.length === 0) {
            const option = document.createElement('option');
            option.textContent = 'No templates saved';
            option.disabled = true;
            templateSelect.appendChild(option);
        } else {
            templates.forEach(template => {
                const option = document.createElement('option');
                option.value = template.name;
                option.textContent = template.name;
                templateSelect.appendChild(option);
            });
        }
    },
    
    /**
     * Get all templates from localStorage
     * @returns {Array} Array of template objects
     */
    getTemplates: function() {
        const templatesJson = localStorage.getItem('rotaTemplates');
        return templatesJson ? JSON.parse(templatesJson) : [];
    },
    
    /**
     * Get a template by name
     * @param {string} name - Template name
     * @returns {Object|null} Template object or null if not found
     */
    getTemplateByName: function(name) {
        const templates = this.getTemplates();
        return templates.find(t => t.name === name) || null;
    },
    
    /**
     * Get the default break duration from the current template settings
     * @returns {number} Default break duration in minutes
     */
    getDefaultBreakDuration: function() {
        return parseInt(document.getElementById('defaultBreakDuration').value, 10) || 30;
    },
    
    /**
     * Get the default finish time for a specific day
     * @param {string} day - Day name (e.g., 'monday', 'tuesday')
     * @returns {string} Default finish time in HH:MM format
     */
    getDefaultFinishTime: function(day) {
        const dayLower = day.toLowerCase();
        const dayCapitalized = dayLower.charAt(0).toUpperCase() + dayLower.slice(1);
        return document.getElementById(`defaultFinish${dayCapitalized}`).value || '';
    }
};
