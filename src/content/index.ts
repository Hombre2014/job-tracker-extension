import { getScrapedInfo } from './scrapers';

/**
 * Job Tracker Extension - Content Script
 * Handles communication between the extension popup and the web page.
 */

console.log('🚀 Job Tracker Extension: Content script starting on', window.location.href);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Security: Only respond to messages from our own extension
  if (sender.id && sender.id !== chrome.runtime.id) {
    return;
  }

  try {
    if (request.action === 'scrapeJobInfo') {
      const jobInfo = getScrapedInfo();
      sendResponse(jobInfo);
    } else if (request.action === 'getTokens') {
      // Security: Only return tokens if we are on a trusted Job Tracker domain
      const trustedOrigins = [
        'localhost:3001',
        'localhost:3000',
        '127.0.0.1:3001',
        '127.0.0.1:3000',
        'online-job-trackr.vercel.app'
      ];
      
      const currentOrigin = window.location.host;
      if (!trustedOrigins.includes(currentOrigin)) {
        sendResponse({ error: 'Unauthorized origin' });
        return;
      }

      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      
      // Do not log token presence or values to the console
      sendResponse({ accessToken, refreshToken });
    } else if (request.action === 'ping') {
      sendResponse({ status: 'ready' });
    }
  } catch (error) {
    // Log generic error but avoid details in production
    sendResponse({ error: 'Internal error' });
  }
  
  return true; // Keep the message channel open for async response
});

console.log('✅ Job Tracker Extension: Content script ready and listening');
