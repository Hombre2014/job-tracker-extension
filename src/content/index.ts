import { getScrapedInfo } from './scrapers';

/**
 * Job Tracker Extension - Content Script
 * Handles communication between the extension popup and the web page.
 */

console.log('🚀 Job Tracker Extension: Content script starting on', window.location.href);

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  console.log('📨 Job Tracker Extension: Message received:', request.action);
  
  try {
    if (request.action === 'scrapeJobInfo') {
      const jobInfo = getScrapedInfo();
      console.log('✅ Job Tracker Extension: Sending scraped info:', jobInfo.jobTitle);
      sendResponse(jobInfo);
    } else if (request.action === 'getTokens') {
      // This will only return tokens if the content script is running on the Job Tracker domain
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      console.log('🔑 Job Tracker Extension: Sending tokens (present:', !!accessToken, ')');
      sendResponse({ accessToken, refreshToken });
    } else if (request.action === 'ping') {
      sendResponse({ status: 'ready' });
    }
  } catch (error) {
    console.error('❌ Job Tracker Extension: Content script error:', error);
    sendResponse({ error: 'Internal error in content script' });
  }
  
  return true; // Keep the message channel open for async response
});

console.log('✅ Job Tracker Extension: Content script ready and listening');
