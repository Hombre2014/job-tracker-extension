import { getScrapedInfo } from './scrapers';

/**
 * Job Tracker Extension - Content Script
 * Handles communication between the extension popup and the web page.
 */

console.log('🚀 Job Tracker Extension: Content script starting on', window.location.href);

console.log('🚀 Job Tracker Extension: Content script active on', window.location.host);

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
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
        return;
      }

      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      sendResponse({ accessToken, refreshToken });
    } else if (request.action === 'ping') {
      sendResponse({ status: 'ready' });
    }
  } catch (error) {
    sendResponse({ error: 'Internal error' });
  }
  
  return true; // Keep the message channel open for async response
});

console.log('✅ Job Tracker Extension: Content script ready and listening');
