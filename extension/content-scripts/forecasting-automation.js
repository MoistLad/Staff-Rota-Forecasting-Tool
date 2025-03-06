/**
 * Content script for the Staff Rota Automation extension
 * Injected into the forecasting site to perform automation
 * 
 * This file serves as the entry point for the extension and imports functionality from the modules.
 */

import { initialize } from './modules/core.js';

// Initialize the extension when the script is loaded
initialize();
