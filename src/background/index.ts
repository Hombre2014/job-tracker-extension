// Background service worker for fetching company logos

const logoCache = new Map<string, string>();

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'fetchLogo') {
    const { domain } = request;

    // Check cache first
    if (logoCache.has(domain)) {
      sendResponse({ success: true, dataUrl: logoCache.get(domain) });
      return true;
    }

    // Fetch logo - use Google's favicon service (most reliable for extensions)
    const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;

    fetch(googleFaviconUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.blob();
      })
      .then((blob) => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      })
      .then((dataUrl) => {
        logoCache.set(domain, dataUrl);
        sendResponse({ success: true, dataUrl });
      })
      .catch((error) => {
        console.error('Background: Failed to fetch logo for', domain, error);
        sendResponse({ success: false, error: error.message });
      });

    return true; // Keep channel open for async response
  }

  // Handle job draft data retrieval
  if (request.action === 'getJobDraft') {
    console.log(
      'Background: Received getJobDraft request from:',
      _sender.origin || _sender.url,
    );
    const { key } = request;

    if (!key || typeof key !== 'string') {
      console.error('Background: Invalid storage key provided:', key);
      sendResponse({ success: false, error: 'Invalid storage key' });
      return true; // Changed from false to true - keep channel open
    }

    console.log(`Background: Attempting to retrieve job draft for key: ${key}`);

    chrome.storage.local.get([key], (result) => {
      if (chrome.runtime.lastError) {
        console.error(
          'Background: Failed to retrieve job draft:',
          chrome.runtime.lastError,
        );
        sendResponse({
          success: false,
          error: chrome.runtime.lastError.message,
        });
        return;
      }

      if (result[key]) {
        console.log(
          `Background: Successfully retrieved job draft for key: ${key}`,
        );
        console.log(
          `Background: Description length: ${result[key].description?.length || 0} chars`,
        );
        sendResponse({ success: true, data: result[key] });

        // Clean up after retrieval (one-time use)
        chrome.storage.local.remove([key]).catch((err) => {
          console.error('Background: Failed to clean up job draft:', err);
        });
      } else {
        console.warn(`Background: Job draft not found for key: ${key}`);
        sendResponse({
          success: false,
          error: 'Job draft not found or expired',
        });
      }
    });

    return true; // Keep channel open for async response
  }

  // If no action matched, return false
  console.warn('Background: Unknown action received:', request.action);
  return false;
});

// EXTERNAL MESSAGE LISTENER - For messages from web pages (frontend app)
chrome.runtime.onMessageExternal.addListener(
  (request, sender, sendResponse) => {
    // Validate sender origin against allowlist for security
    const allowedOrigins = [
      'https://online-job-trackr.vercel.app',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:5173',
    ];

    const senderOrigin =
      sender.origin || (sender.url ? new URL(sender.url).origin : undefined);
    const isAllowed = senderOrigin
      ? allowedOrigins.includes(senderOrigin)
      : false;

    if (!isAllowed) {
      console.warn(
        'Background: Rejected external message from unauthorized origin:',
        senderOrigin,
      );
      sendResponse({ success: false, error: 'Unauthorized origin' });
      return true;
    }

    console.log(
      'Background: Accepted external message from authorized origin:',
      senderOrigin,
    );

    // Handle job draft data retrieval from frontend
    if (request.action === 'getJobDraft') {
      const { key } = request;

      if (!key || typeof key !== 'string') {
        console.error('Background: Invalid storage key');
        sendResponse({ success: false, error: 'Invalid storage key' });
        return true;
      }

      chrome.storage.local.get([key], (result) => {
        if (chrome.runtime.lastError) {
          console.error(
            'Background: Failed to retrieve job draft:',
            chrome.runtime.lastError,
          );
          sendResponse({
            success: false,
            error: chrome.runtime.lastError.message,
          });
          return;
        }

        if (result[key]) {
          sendResponse({ success: true, data: result[key] });

          // Clean up after retrieval (one-time use)
          chrome.storage.local.remove([key]).catch((err) => {
            console.error('Background: Failed to clean up job draft:', err);
          });
        } else {
          console.warn('Background: Job draft not found or expired');
          sendResponse({
            success: false,
            error: 'Job draft not found or expired',
          });
        }
      });

      return true; // Keep channel open for async response
    }

    return false;
  },
);

/**
 * Send job data to an existing Job Tracker tab or open a new one
 * Implements Phase 4.5: Tab reuse with message passing
 */
interface SendJobDataParams {
  company: string;
  companyDomain?: string;
  companyLogo?: string | null;
  title: string;
  location?: string;
  description?: string;
  url?: string;
  salary?: string;
  columnId: string;
  boardId: string;
  autoSave?: boolean;
  storageKey: string;
}

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'sendJobData') {
    const data: SendJobDataParams = request.data;
    console.log('Background: Received sendJobData request:', data);

    // Check for existing Job Tracker tabs
    chrome.tabs
      .query({})
      .then((tabs) => {
        console.log('Background: Total tabs found:', tabs.length);
        console.log(
          'Background: Tab URLs:',
          tabs.map((t) => t.url),
        );

        const frontendTabs = tabs.filter((tab) => {
          const url = tab.url || '';
          return (
            url.includes('online-job-trackr.vercel.app') ||
            url.includes('localhost:3000') ||
            url.includes('localhost:3001') ||
            url.includes('localhost:5173') ||
            url.includes('127.0.0.1:3000') ||
            url.includes('127.0.0.1:3001') ||
            url.includes('127.0.0.1:5173')
          );
        });

        console.log('Background: Frontend tabs found:', frontendTabs.length);
        if (frontendTabs.length > 0) {
          console.log(
            'Background: Frontend tab URLs:',
            frontendTabs.map((t) => t.url),
          );
        }

        // Determine dev mode based on the target tab we'll use/create
        // If we have existing tabs, check the first one; otherwise default to production
        let isDevMode = false;
        if (frontendTabs.length > 0) {
          const targetUrl = frontendTabs[0].url || '';
          isDevMode =
            targetUrl.includes('localhost:') ||
            targetUrl.includes('127.0.0.1:');
          console.log(
            'Background: Dev mode detected for target tab:',
            isDevMode,
            'URL:',
            targetUrl,
          );
        } else {
          // No existing tabs - default to production mode
          console.log(
            'Background: No existing tabs - defaulting to production mode',
          );
        }

        if (frontendTabs.length > 0 && frontendTabs[0].id) {
          // Found existing tab - send message to it
          const targetTab = frontendTabs[0];
          const tabId = targetTab.id!; // We know id exists from the condition
          console.log(
            'Background: Attempting to reuse tab:',
            tabId,
            targetTab.url,
          );

          // First, check if content script is loaded by sending a ping
          chrome.tabs.sendMessage(tabId, { action: 'ping' }, (pingResponse) => {
            console.log(
              'Background: Ping response:',
              pingResponse,
              'Last error:',
              chrome.runtime.lastError,
            );
            if (chrome.runtime.lastError || !pingResponse) {
              // Content script not loaded - inject it first
              console.log(
                'Background: Content script not loaded, injecting...',
              );

              chrome.scripting
                .executeScript({
                  target: { tabId: tabId },
                  files: ['assets/index.ts.js'],
                })
                .then(() => {
                  console.log('Background: Content script injected');
                  // Wait for content script to be ready by retrying ping
                  return waitForContentScriptReady(tabId, 10, 100);
                })
                .then(() => {
                  // Now focus and send the message
                  return sendMessageToTab(tabId, targetTab, data, isDevMode);
                })
                .then(() => {
                  sendResponse({ success: true, method: 'message' });
                })
                .catch((error) => {
                  console.error('Background: Failed after injection:', error);
                  openNewTabWithParams(data, isDevMode);
                  sendResponse({ success: true, method: 'fallback' });
                });
            } else {
              // Content script already loaded - proceed normally
              sendMessageToTab(tabId, targetTab, data, isDevMode)
                .then(() => {
                  sendResponse({ success: true, method: 'message' });
                })
                .catch((error) => {
                  console.error('Background: Failed to send message:', error);
                  openNewTabWithParams(data, isDevMode);
                  sendResponse({ success: true, method: 'fallback' });
                });
            }
          });
        } else {
          // No existing tab - open new one with URL params
          console.log('Background: No frontend tab found, opening new tab');
          openNewTabWithParams(data, isDevMode);
          sendResponse({ success: true, method: 'new-tab' });
        }
      })
      .catch((error) => {
        console.error('Background: Tab query failed:', error);
        // Default to production mode if query fails
        openNewTabWithParams(data, false);
        sendResponse({ success: true, method: 'error-fallback' });
      });

    return true; // Keep channel open for async response
  }
});

/**
 * Wait for content script to be ready by retrying ping
 */
async function waitForContentScriptReady(
  tabId: number,
  maxRetries: number = 10,
  delayMs: number = 100,
): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await chrome.tabs.sendMessage(tabId, {
        action: 'ping',
      });
      if (response?.status === 'ready') {
        console.log(`Background: Content script ready after ${i + 1} attempts`);
        return; // Success!
      }
    } catch {
      // Script not ready yet, continue retrying
    }
    // Wait before next retry
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  throw new Error('Content script failed to initialize after retries');
}

/**
 * Helper: Navigate existing tab to job post URL
 */
async function sendMessageToTab(
  tabId: number,
  targetTab: chrome.tabs.Tab,
  data: SendJobDataParams,
  isDevMode: boolean,
): Promise<void> {
  // Build URL with parameters
  const params = new URLSearchParams();
  params.set('company', data.company);
  params.set('companyDomain', data.companyDomain || '');
  if (data.companyLogo) {
    params.set('companyLogo', data.companyLogo);
  }
  params.set('title', data.title);
  params.set('location', data.location || '');
  params.set('url', data.url || '');
  if (data.salary) {
    params.set('salary', data.salary);
  }
  params.set('autoSave', data.autoSave ? 'true' : 'false');
  params.set('jobDataKey', data.storageKey);

  // Determine target URL
  const frontendUrl = isDevMode
    ? 'http://localhost:3001'
    : 'https://online-job-trackr.vercel.app';

  // Use the board ID from user's selection
  const boardId = data.boardId;

  if (!boardId) {
    console.error('Background: No board ID provided in data:', data);
    throw new Error('Board ID is required');
  }

  const targetUrl = `${frontendUrl}/home/boards/${boardId}/board?${params.toString()}`;

  // Navigate the existing tab to the new URL
  await chrome.tabs.update(tabId, { url: targetUrl, active: true });

  if (targetTab.windowId) {
    await chrome.windows.update(targetTab.windowId, { focused: true });
  }

  console.log('Background: Navigated existing tab to:', targetUrl);
}

/**
 * Fallback: Open new tab with URL parameters
 */
function openNewTabWithParams(data: SendJobDataParams, isDevMode: boolean) {
  const params = new URLSearchParams();
  params.set('company', data.company);
  params.set('companyDomain', data.companyDomain || '');
  if (data.companyLogo) {
    params.set('companyLogo', data.companyLogo);
  }
  params.set('title', data.title);
  params.set('location', data.location || '');
  params.set('description', (data.description || '').slice(0, 1000));
  params.set('url', data.url || '');
  if (data.salary) {
    params.set('salary', data.salary);
  }
  params.set('columnId', data.columnId);
  params.set('autoSave', data.autoSave ? 'true' : 'false');
  params.set('jobDataKey', data.storageKey);

  // Use localhost in development, production otherwise
  const frontendUrl = isDevMode
    ? 'http://localhost:3001'
    : 'https://online-job-trackr.vercel.app';

  console.log(
    `Background: Opening new tab with ${isDevMode ? 'localhost:3001' : 'production'} URL`,
  );

  const targetUrl = `${frontendUrl}/home/boards/${data.boardId}/board?${params.toString()}`;

  chrome.tabs.create({ url: targetUrl }).catch((error) => {
    console.error('Background: Failed to open new tab:', error);
  });
}

console.log('Background service worker loaded');
