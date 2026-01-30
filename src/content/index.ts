import { getScrapedInfo } from './scrapers';

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((
  request: { action: string }, 
  _sender: chrome.runtime.MessageSender, 
  sendResponse: (response: any) => void
) => {
  if (request.action === 'scrapeJobInfo') {
    const jobInfo = getScrapedInfo();
    sendResponse(jobInfo);
  }
  return true; // Keep the message channel open for async response
});

console.log('Job Tracker Extension: Content script loaded');
