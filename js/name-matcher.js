/**
 * Name Matcher for the Staff Rota Excel to Forecasting Tool
 * Handles matching employee names from Excel to names in the forecasting system
 */

const NameMatcher = {
    /**
     * Initialize the name matcher
     */
    init: function() {
        // Nothing to initialize
    },
    
    /**
     * Find a match for a name in the forecasting system
     * @param {string} excelName - Name from Excel
     * @returns {string} Matched name for forecasting system
     */
    findMatchForName: function(excelName) {
        if (!excelName) return '';
        
        // First check if we have a saved mapping for this name
        const savedMapping = this.getSavedMapping(excelName);
        if (savedMapping) {
            return savedMapping;
        }
        
        // Try to find a match using common name variations
        const normalizedName = this.normalizeName(excelName);
        
        // For now, just return the normalized name
        // In a real implementation, this would check against a list of known names in the forecasting system
        return normalizedName;
    },
    
    /**
     * Normalize a name (remove titles, convert to first name only, etc.)
     * @param {string} name - Name to normalize
     * @returns {string} Normalized name
     */
    normalizeName: function(name) {
        if (!name) return '';
        
        // Convert to lowercase for comparison
        let normalized = name.toLowerCase();
        
        // Remove titles
        normalized = normalized.replace(/^(mr|mrs|ms|miss|dr)\.\s+/i, '');
        
        // Get first name only (assuming format is "First Last")
        const parts = normalized.split(' ');
        if (parts.length > 1) {
            normalized = parts[0];
        }
        
        // Apply common nickname mappings
        const nicknames = {
            'robert': 'rob',
            'roberto': 'rob',
            'robbie': 'rob',
            'bob': 'rob',
            'bobby': 'rob',
            
            'richard': 'rick',
            'rick': 'richard',
            'dick': 'richard',
            'richie': 'richard',
            
            'william': 'will',
            'will': 'william',
            'bill': 'william',
            'billy': 'william',
            
            'james': 'jim',
            'jim': 'james',
            'jimmy': 'james',
            'jamie': 'james',
            
            'john': 'johnny',
            'johnny': 'john',
            'jon': 'john',
            
            'michael': 'mike',
            'mike': 'michael',
            'mikey': 'michael',
            'mick': 'michael',
            
            'thomas': 'tom',
            'tom': 'thomas',
            'tommy': 'thomas',
            
            'christopher': 'chris',
            'chris': 'christopher',
            
            'joseph': 'joe',
            'joe': 'joseph',
            'joey': 'joseph',
            
            'daniel': 'dan',
            'dan': 'daniel',
            'danny': 'daniel',
            
            'matthew': 'matt',
            'matt': 'matthew',
            'matty': 'matthew',
            
            'david': 'dave',
            'dave': 'david',
            'davey': 'david',
            
            'nicholas': 'nick',
            'nick': 'nicholas',
            'nicky': 'nicholas',
            
            'anthony': 'tony',
            'tony': 'anthony',
            
            'andrew': 'andy',
            'andy': 'andrew',
            'drew': 'andrew',
            
            'steven': 'steve',
            'steve': 'steven',
            'stephen': 'steve',
            
            'edward': 'ed',
            'ed': 'edward',
            'eddie': 'edward',
            'ted': 'edward',
            
            'charles': 'charlie',
            'charlie': 'charles',
            'chuck': 'charles',
            
            'benjamin': 'ben',
            'ben': 'benjamin',
            'benji': 'benjamin',
            
            'samuel': 'sam',
            'sam': 'samuel',
            'sammy': 'samuel',
            
            'alexander': 'alex',
            'alex': 'alexander',
            
            'patrick': 'pat',
            'pat': 'patrick',
            'patty': 'patrick',
            
            'victoria': 'vicky',
            'vicky': 'victoria',
            'vicki': 'victoria',
            
            'elizabeth': 'liz',
            'liz': 'elizabeth',
            'beth': 'elizabeth',
            'lizzie': 'elizabeth',
            'eliza': 'elizabeth',
            
            'catherine': 'cathy',
            'katherine': 'cathy',
            'cathy': 'catherine',
            'kate': 'catherine',
            'katie': 'catherine',
            
            'jennifer': 'jen',
            'jen': 'jennifer',
            'jenny': 'jennifer',
            
            'margaret': 'maggie',
            'maggie': 'margaret',
            'meg': 'margaret',
            'peggy': 'margaret',
            
            'rebecca': 'becky',
            'becky': 'rebecca',
            
            'stephanie': 'steph',
            'steph': 'stephanie',
            
            'deborah': 'debbie',
            'debbie': 'deborah',
            'deb': 'deborah',
            
            'jessica': 'jess',
            'jess': 'jessica',
            'jessie': 'jessica',
            
            'susan': 'sue',
            'sue': 'susan',
            'suzie': 'susan',
            
            'barbara': 'barb',
            'barb': 'barbara',
            
            'kimberly': 'kim',
            'kim': 'kimberly',
            
            'amanda': 'mandy',
            'mandy': 'amanda',
            
            'patricia': 'patty',
            'patty': 'patricia',
            'pat': 'patricia',
            
            'nicole': 'nikki',
            'nikki': 'nicole',
            
            'christine': 'chris',
            'chris': 'christine',
            'christy': 'christine',
            
            'samantha': 'sam',
            'sam': 'samantha',
            
            'michelle': 'shelly',
            'shelly': 'michelle',
            
            'angela': 'angie',
            'angie': 'angela',
            
            'melissa': 'mel',
            'mel': 'melissa',
            'missy': 'melissa'
        };
        
        if (nicknames[normalized]) {
            normalized = nicknames[normalized];
        }
        
        // Capitalize first letter
        return normalized.charAt(0).toUpperCase() + normalized.slice(1);
    },
    
    /**
     * Save a name mapping to localStorage
     * @param {string} excelName - Name from Excel
     * @param {string} forecastingName - Name in forecasting system
     */
    saveNameMapping: function(excelName, forecastingName) {
        if (!excelName || !forecastingName) {
            Utils.showError('Both Excel name and forecasting system name are required');
            return;
        }
        
        // Get existing mappings
        const mappings = this.getNameMappings();
        
        // Update or add mapping
        mappings[excelName] = forecastingName;
        
        // Save to localStorage
        localStorage.setItem('nameMapppings', JSON.stringify(mappings));
        
        Utils.showSuccess(`Mapping saved: ${excelName} → ${forecastingName}`);
    },
    
    /**
     * Get a saved mapping for a name
     * @param {string} excelName - Name from Excel
     * @returns {string|null} Mapped name or null if not found
     */
    getSavedMapping: function(excelName) {
        if (!excelName) return null;
        
        const mappings = this.getNameMappings();
        return mappings[excelName] || null;
    },
    
    /**
     * Get all name mappings from localStorage
     * @returns {Object} Name mappings
     */
    getNameMappings: function() {
        const mappingsJson = localStorage.getItem('nameMapppings');
        return mappingsJson ? JSON.parse(mappingsJson) : {};
    },
    
    /**
     * Calculate the Levenshtein distance between two strings
     * @param {string} a - First string
     * @param {string} b - Second string
     * @returns {number} Levenshtein distance
     */
    levenshteinDistance: function(a, b) {
        if (!a || !b) return (a || b).length;
        
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
    },
    
    /**
     * Find the best match for a name in a list of names
     * @param {string} name - Name to match
     * @param {Array} nameList - List of names to match against
     * @returns {string|null} Best match or null if no good match found
     */
    findBestMatch: function(name, nameList) {
        if (!name || !nameList || nameList.length === 0) {
            return null;
        }
        
        const normalizedName = this.normalizeName(name).toLowerCase();
        
        let bestMatch = null;
        let bestScore = Infinity;
        
        nameList.forEach(candidate => {
            const normalizedCandidate = this.normalizeName(candidate).toLowerCase();
            const score = this.levenshteinDistance(normalizedName, normalizedCandidate);
            
            if (score < bestScore) {
                bestScore = score;
                bestMatch = candidate;
            }
        });
        
        // Only return a match if the score is below a threshold
        return bestScore <= 2 ? bestMatch : null;
    }
};
