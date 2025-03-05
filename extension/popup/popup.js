/**
 * Popup script for the Staff Rota Automation extension
 */

document.addEventListener('DOMContentLoaded', () => {
  // Get elements
  const statusElement = document.getElementById('status');
  const progressBar = document.getElementById('progress-bar');
  const detailsElement = document.getElementById('details');
  const openOptionsButton = document.getElementById('open-options');
  
  // Get current status from background script
  chrome.runtime.sendMessage({ action: 'getStatus' }, response => {
    updateUI(response.status, response.progress, response.total);
  });
  
  // Listen for status updates from background script
  chrome.runtime.onMessage.addListener(message => {
    if (message.action === 'automationUpdate') {
      updateUI(message.status, message.progress, message.total);
    }
  });
  
  // Open options page when button is clicked
  openOptionsButton.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
  
  /**
   * Update the UI with the current status
   * @param {string} status - The current status
   * @param {number} progress - The current progress
   * @param {number} total - The total number of steps
   */
  function updateUI(status, progress, total) {
    // Update status element
    statusElement.className = `status ${status}`;
    
    let statusText = 'Status: ';
    
    switch (status) {
      case 'idle':
        statusText += 'Idle';
        break;
      case 'starting':
        statusText += 'Starting...';
        break;
      case 'running':
        statusText += 'Running...';
        break;
      case 'login_required':
        statusText += 'Login Required';
        break;
      case 'complete':
        statusText += 'Complete';
        break;
      case 'error':
        statusText += 'Error';
        break;
      default:
        statusText += status;
    }
    
    statusElement.textContent = statusText;
    
    // Update progress bar
    if (total > 0) {
      const percentage = Math.round((progress / total) * 100);
      progressBar.style.width = `${percentage}%`;
    } else {
      progressBar.style.width = '0%';
    }
    
    // Update details
    if (status === 'processing_employee') {
      detailsElement.textContent = `Processing employee ${progress.index} of ${progress.total}: ${progress.employee}`;
    } else if (status === 'processing_shift') {
      detailsElement.textContent = `Processing ${progress.day} shift for ${progress.employee}`;
    } else if (status === 'login_required') {
      detailsElement.textContent = 'Please log in to the forecasting system to continue';
    } else if (status === 'error') {
      detailsElement.textContent = `Error: ${progress.error}`;
    } else {
      detailsElement.textContent = '';
    }
  }
});
