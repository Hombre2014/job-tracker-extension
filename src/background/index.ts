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
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
    ];

    const senderOrigin = sender.origin || sender.url;
    const isAllowed = allowedOrigins.some((allowed) =>
      senderOrigin?.startsWith(allowed)
    );

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

console.log('Background service worker loaded');
