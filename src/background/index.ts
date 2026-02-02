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
    const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

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
});

console.log('Background service worker loaded');
