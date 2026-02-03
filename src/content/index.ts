import { getScrapedInfo } from './scrapers';

/**
 * Job Tracker Extension - Content Script
 * Handles communication between the extension popup and the web page.
 */

console.log(
  '🚀 Job Tracker Extension: Content script starting on',
  window.location.href,
);

console.log(
  '🚀 Job Tracker Extension: Content script active on',
  window.location.host,
);

/**
 * Wait for DOM to be ready after SPA navigation
 * LinkedIn uses client-side routing, so we need to wait for content to load
 */
const waitForDOMReady = async (
  maxAttempts = 10,
  delay = 200,
): Promise<boolean> => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Check if key elements exist (different selectors for different LinkedIn layouts)
    const hasContent =
      document.querySelector(
        '.job-details-jobs-unified-top-card__company-name',
      ) ||
      document.querySelector('.jobs-unified-top-card__company-name') ||
      document.querySelector('.job-view-layout') ||
      document.querySelector('.jobs-search__job-details');

    if (hasContent) {
      return true;
    }

    // Wait before next attempt
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  return false;
};

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  const handleMessage = async () => {
    try {
      if (request.action === 'scrapeJobInfo') {
        // Wait for DOM to be ready (important for SPA navigation)
        const isDOMReady = await waitForDOMReady();

        if (!isDOMReady) {
          console.warn(
            'Job Tracker: DOM not ready after waiting, scraping anyway...',
          );
        }

        const jobInfo = getScrapedInfo();
        sendResponse(jobInfo);
      } else if (request.action === 'getTokens') {
        // Security: Only return tokens if we are on a trusted Job Tracker domain
        const trustedOrigins = [
          'localhost:3001',
          'localhost:3000',
          '127.0.0.1:3001',
          '127.0.0.1:3000',
          'online-job-trackr.vercel.app',
        ];

        const currentOrigin = window.location.host;
        if (!trustedOrigins.includes(currentOrigin)) {
          sendResponse({ error: 'Unauthorized origin' });
          return;
        }

        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        sendResponse({ accessToken, refreshToken });
      } else if (request.action === 'ping') {
        sendResponse({ status: 'ready' });
      } else {
        // Handle unknown actions to prevent hanging message channel
        console.warn(
          'Content script: Unknown action received:',
          request.action,
        );
        sendResponse({ error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Content script error:', error);
      sendResponse({ error: 'Internal error' });
    }
  };

  // Handle async message
  handleMessage();

  return true; // Keep the message channel open for async response
});

console.log('✅ Job Tracker Extension: Content script ready and listening');
