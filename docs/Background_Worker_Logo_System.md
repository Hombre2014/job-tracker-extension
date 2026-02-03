# Background Worker Logo System

## Overview

This document explains the technical architecture of the company logo fetching system in the Job Tracker browser extension. This system was implemented to overcome Chrome extension security restrictions that prevent direct external image loading in extension popups.

## Latest Updates (v1.5.0)

The logo system now integrates with the frontend application:

- **Logo Transfer**: Company logos are now passed to the frontend via the `companyLogo` field in job draft data
- **Frontend Integration**: Logos are stored in the backend and displayed in the job tracker interface
- **Blank Image Detection**: Frontend implements intelligent detection of Brandfetch placeholder images (40x40 blanks)
- **Fallback Icon**: Generic Building2 icon displays when logos are unavailable or invalid
- **See also**: [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md) for frontend-specific implementation details

## Table of Contents

1. [The Problem](#the-problem)
2. [Why Previous Solutions Failed](#why-previous-solutions-failed)
3. [The Solution: Background Service Worker](#the-solution-background-service-worker)
4. [Architecture & Data Flow](#architecture--data-flow)
5. [Implementation Details](#implementation-details)
6. [Key Concepts for Junior Developers](#key-concepts-for-junior-developers)
7. [Troubleshooting](#troubleshooting)

---

## The Problem

### Initial Requirement

When users scrape a job posting and select a company from the autocomplete dropdown, we want to display the company's logo in the extension popup. Later, when the job is saved to the frontend application, the logo should also appear there.

### Chrome Extension Security Restrictions

Chrome extensions have strict Content Security Policy (CSP) rules that prevent:

- Loading external images directly via `<img src="https://external-site.com/logo.png">`
- Making fetch requests to external APIs from the popup context
- Bypassing CORS (Cross-Origin Resource Sharing) restrictions

This means you cannot simply set an image source to an external URL like you would in a regular web page.

---

## Why Previous Solutions Failed

We attempted **5 different approaches** before finding the working solution:

### Attempt 1: Brandfetch Direct URL

```tsx
<img src={`https://logo.brandfetch.io/${domain}`} />
```

**Result:** ❌ HTTP 403 Forbidden
**Why it failed:** Brandfetch servers detect and block requests from chrome-extension:// origins

### Attempt 2: Clearbit Logo API Direct URL

```tsx
<img src={`https://logo.clearbit.com/${domain}`} />
```

**Result:** ❌ ERR_NAME_NOT_RESOLVED / CORS errors
**Why it failed:** Clearbit's logo service has DNS/CORS restrictions that block extension requests

### Attempt 3: Fetch in Popup + Convert to Data URL

```tsx
const response = await fetch(`https://logo.clearbit.com/${domain}`);
const blob = await response.blob();
const dataUrl = URL.createObjectURL(blob);
setLogoUrl(dataUrl);
```

**Result:** ❌ CORS blocked
**Why it failed:** Popup context still cannot bypass CORS, even when converting to data URLs

### Attempt 4: Google Favicon Service in Popup

```tsx
const response = await fetch(
  `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
);
const blob = await response.blob();
const dataUrl = await blobToDataURL(blob);
setLogoUrl(dataUrl);
```

**Result:** ❌ CORS error on redirect to gstatic.com
**Why it failed:** Google Favicon Service redirects to `t3.gstatic.com`, which triggers CORS errors in popup context

### Attempt 5: Background Service Worker ✅

**Result:** ✅ SUCCESS!
**Why it worked:** Background service workers have elevated permissions and can bypass CORS restrictions that block popup contexts

---

## The Solution: Background Service Worker

### What is a Background Service Worker?

A background service worker is a special JavaScript context that runs independently from your extension's popup or content scripts. Think of it as a "helper program" that runs in the background.

**Key Properties:**

- Runs in a separate context from the popup
- Has elevated permissions (can access external resources)
- Can bypass CORS restrictions when configured with proper `host_permissions`
- Can communicate with popup via message passing (`chrome.runtime.sendMessage`)
- Stays alive even when popup is closed (for short periods)

### Why Can It Bypass CORS?

1. **Host Permissions:** When you declare `host_permissions` in `manifest.json`, Chrome gives the background worker permission to fetch from those domains
2. **Trusted Context:** Background workers are considered trusted by Chrome, unlike popup contexts
3. **No Browser UI:** Background workers don't render UI, so Chrome allows them broader network access

---

## Architecture & Data Flow

### High-Level Flow Diagram

```flowchart TD

┌─────────────────┐         ┌──────────────────────┐         ┌─────────────────────┐
│                 │         │                      │         │                     │
│  User selects   │         │   Background         │         │   Google Favicon    │
│  company from   │ ──────> │   Service Worker     │ ──────> │   Service           │
│  autocomplete   │  (1)    │                      │  (2)    │   (www.google.com)  │
│                 │         │                      │         │                     │
└─────────────────┘         └──────────────────────┘         └─────────────────────┘
                                       │                               │
                                       │                               │
                                       │ (4)                           │ (3)
                                       ▼                               ▼
                            ┌──────────────────────┐         ┌─────────────────────┐
                            │                      │         │                     │
                            │   CompanyLogo        │         │   t3.gstatic.com    │
                            │   Component          │ <────── │   (redirected)      │
                            │   (displays logo)    │         │                     │
                            │                      │         └─────────────────────┘
                            └──────────────────────┘
```

### Step-by-Step Flow

1. **User Selection**
   - User selects "Tesla" from company autocomplete
   - CompanyLogo component receives `domain="tesla.com"`

2. **Message to Background Worker**

   ```typescript
   chrome.runtime.sendMessage(
     { action: 'fetchLogo', domain: 'tesla.com' },
     (response) => {
       /* handle response */
     },
   );
   ```

3. **Background Worker Fetches Logo**
   - Worker receives message
   - Checks cache: has this logo been fetched before?
   - If not cached: fetches from Google Favicon Service
   - URL: `https://www.google.com/s2/favicons?domain=tesla.com&sz=128`
   - Google redirects to: `https://t3.gstatic.com/...actual-image-url...`
   - Worker follows redirect and downloads image blob

4. **Convert to Data URL**
   - Worker converts blob to base64 data URL using FileReader
   - Data URL format: `data:image/png;base64,iVBORw0KGgoAAAANS...`
   - Stores in cache for future requests

5. **Send Back to Popup**
   - Worker sends response: `{ success: true, dataUrl: 'data:image/png;base64,...' }`
   - CompanyLogo component receives data URL

6. **Display Logo**
   - CompanyLogo sets image src to data URL
   - Data URLs are safe to use in extension popups (no CORS)
   - Logo appears instantly on subsequent loads (cached)

---

## Implementation Details

### 1. Manifest Configuration (`manifest.json`)

```json
{
  "manifest_version": 3,
  "background": {
    "service_worker": "src/background/index.ts",
    "type": "module"
  },
  "host_permissions": [
    "https://www.google.com/*",
    "https://*.gstatic.com/*",
    "https://autocomplete.clearbit.com/*"
  ]
}
```

**Why These Permissions?**

- `www.google.com/*`: Initial Google Favicon Service request
- `*.gstatic.com/*`: Where Google redirects for actual image files
- `autocomplete.clearbit.com/*`: Company autocomplete API

### 2. Background Worker (`src/background/index.ts`)

```typescript
// Cache to avoid repeated fetches
const logoCache = new Map<string, string>();

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'fetchLogo') {
    const { domain } = request;

    // Check cache first
    if (logoCache.has(domain)) {
      sendResponse({ success: true, dataUrl: logoCache.get(domain) });
      return true;
    }

    // Fetch from Google Favicon Service
    fetch(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`)
      .then((response) => response.blob())
      .then((blob) => {
        // Convert blob to data URL
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          logoCache.set(domain, dataUrl); // Cache it
          sendResponse({ success: true, dataUrl });
        };
        reader.readAsDataURL(blob);
      })
      .catch((error) => {
        console.error('Background: Logo fetch failed:', error);
        sendResponse({ success: false, error: error.message });
      });

    return true; // Keeps sendResponse channel open for async response
  }
});
```

**Key Concepts:**

- **Caching:** Avoids repeated network requests for same logo
- **Async Response:** `return true` keeps message channel open for async operations
- **Error Handling:** Catches and reports fetch failures
- **FileReader:** Browser API to convert binary data (blob) to base64 string

### 3. CompanyLogo Component (`src/components/CompanyLogo.tsx`)

```typescript
const CompanyLogo = ({ companyName, domain, size = 48 }) => {
  const [logoDataUrl, setLogoDataUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!domain) {
      setIsLoading(false);
      setHasError(true);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    // Request logo from background worker
    chrome.runtime.sendMessage(
      { action: 'fetchLogo', domain: cleanDomain(domain) },
      (response) => {
        if (response?.success && response.dataUrl) {
          setLogoDataUrl(response.dataUrl);
        } else {
          setHasError(true);
        }
        setIsLoading(false);
      }
    );
  }, [domain]);

  // Show loading state
  if (isLoading) return <div>Loading...</div>;

  // Show fallback icon on error
  if (hasError) return <Building2 size={size} />;

  // Show logo
  return <img src={logoDataUrl} alt={`${companyName} logo`} />;
};
```

**UI States:**

1. **Loading:** Empty box while fetching
2. **Error:** Building icon (🏢) if fetch fails or no domain
3. **Success:** Company logo displayed

### 4. Sending Domain to Frontend (`src/App.tsx`)

```typescript
const handleSave = (autoSave: boolean) => {
  const params = new URLSearchParams({
    company: jobInfo.company,
    companyDomain: jobInfo.companyData?.domain || '', // ← Critical!
    title: jobInfo.jobTitle,
    location: jobInfo.location || '',
    description: jobInfo.description || '',
    url: jobInfo.postUrl || '',
    salary: jobInfo.salary || '',
    columnId: selectedColumnId,
    autoSave: autoSave.toString(),
  });

  const targetUrl = `${frontendUrl}/home/boards/${boardId}/board?${params}`;
  window.open(targetUrl, '_blank');
};
```

**Why Send `companyDomain`?**

- Frontend needs the domain to fetch logos for saved jobs
- Without domain, frontend shows generic building icon
- Domain comes from Clearbit autocomplete data

---

## Key Concepts for Junior Developers

### What is CORS?

**CORS (Cross-Origin Resource Sharing)** is a browser security feature that prevents websites from making requests to different domains without permission.

**Example:**

- Your extension popup runs on `chrome-extension://abcdef123456`
- You try to fetch from `https://logo.clearbit.com`
- Browser says: "No! These are different origins. Request blocked!"

**Why it exists:** Prevents malicious websites from stealing data from other sites

### What is a Data URL?

A **Data URL** is a way to embed files (like images) directly in HTML/JavaScript as a string, instead of loading them from a separate URL.

**Format:**

```text
data:[MIME-type];base64,[base64-encoded-data]
```

**Example:**

```text
data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...
```

**Why we use it:**

- Data URLs are considered "same-origin" (safe)
- No network request needed once generated
- Bypasses CORS restrictions
- Can be cached in memory

### What is FileReader?

**FileReader** is a browser API that reads file data and converts it to different formats.

**What we use it for:**

```typescript
const reader = new FileReader();
reader.onloadend = () => {
  const dataUrl = reader.result; // ← Base64 string
};
reader.readAsDataURL(blob); // ← Convert blob to base64
```

**Steps:**

1. Get binary data (blob) from fetch
2. FileReader converts blob to base64 string
3. Prepends `data:image/png;base64,` prefix
4. Result is a complete data URL ready to use in `<img src="">`

### What is Message Passing?

In Chrome extensions, different parts (popup, background, content scripts) run in separate contexts and cannot directly access each other's variables.

**Message Passing** lets them communicate:

**Sender (Popup):**

```typescript
chrome.runtime.sendMessage(
  { action: 'fetchLogo', domain: 'tesla.com' },
  (response) => {
    console.log('Got response:', response);
  },
);
```

**Receiver (Background Worker):**

```typescript
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchLogo') {
    // Do something with request.domain
    sendResponse({ success: true, dataUrl: '...' });
  }
  return true; // Keep channel open for async response
});
```

**Important:** Must `return true` if sending async response, otherwise channel closes

---

## Troubleshooting

### Logo Not Appearing

**Checklist:**

1. ✅ Is `companyData` set when company selected? (Check in console)
2. ✅ Is background worker registered in manifest.json?
3. ✅ Are host_permissions including `*.gstatic.com/*`?
4. ✅ Is domain being sent in message? (Check background worker console)
5. ✅ Is FileReader converting successfully? (Check for errors)
6. ✅ Is response being received in CompanyLogo? (Check popup console)

### CORS Errors

**Symptoms:** Console shows `Access to fetch blocked by CORS policy`

**Solutions:**

- ✅ Ensure fetching happens in background worker, NOT popup
- ✅ Add required domains to `host_permissions` in manifest
- ✅ Reload extension after manifest changes

### Logo Shows in Extension but Not Frontend

**Symptoms:** Logo displays in extension popup but shows generic icon in web app

**Cause:** `companyDomain` not being sent to frontend

**Solution:**

1. Check extension is sending `companyDomain` in URL parameters
2. Check frontend is reading `companyDomain` from searchParams
3. Check frontend is passing domain to `createCompany({ name, url })` API call

### Cache Not Working

**Symptoms:** Logos refetch on every render, slow performance

**Check:**

- Background worker cache is declared outside message listener
- Cache key matches exactly (no extra spaces/cases)
- Cache `Map` is not being cleared accidentally

---

## Performance Considerations

### Caching Strategy

**Why Cache?**

- Avoids repeated network requests
- Instant logo display on subsequent loads
- Reduces bandwidth usage

**Cache Location:**

- Lives in background worker's memory
- Cleared when extension reloads
- Not persisted to disk (could be added with chrome.storage)

**Future Improvements:**

- Persist cache to `chrome.storage.local` for cross-session persistence
- Add cache expiration (e.g., 7 days)
- Implement cache size limits to prevent memory bloat

### Network Optimization

**Current:**

- 128x128 pixel logos (~5-15 KB each)
- Google Favicon Service is fast and reliable
- One redirect per fetch (google.com → gstatic.com)

**Could Optimize:**

- Batch requests (if multiple logos needed)
- Use smaller size (64x64) if sufficient
- Preload logos for common companies

---

## Security Considerations

### Why Google Favicon Service?

**Advantages:**

- Reliable and fast
- No authentication required
- Already used by billions of Chrome users
- Unlikely to block extension requests

**Alternatives Considered:**

- Brandfetch: Blocks extension origins (403)
- Clearbit: DNS/CORS issues
- Direct company website favicons: Unreliable, many CORS blocks

### Data URL Security

**Are Data URLs Safe?**
✅ Yes, when created from trusted sources

**Why:**

- Data URLs are same-origin (embedded in extension)
- No external network request at display time
- Cannot execute JavaScript (if properly sanitized)

**Best Practices:**

- Only convert images (not HTML/JS)
- Validate blob MIME type before conversion
- Use Google Favicon Service (trusted source)

---

## Future Enhancements

### Potential Improvements

1. **Persistent Cache**

   ```typescript
   // Store in chrome.storage.local
   chrome.storage.local.set({ [`logo_${domain}`]: dataUrl });
   ```

2. **Multiple Logo Sources**
   - Try Google first
   - Fallback to Clearbit via backend proxy
   - Fallback to company website favicon

3. **Higher Quality Logos**
   - Use Brandfetch via backend proxy (to avoid 403)
   - Store full-size logos in database
   - Serve optimized versions based on display size

4. **Background Updates**
   - Periodically refresh cached logos
   - Update logos when company data changes
   - Notify UI of logo updates

---

## Conclusion

The background service worker architecture successfully solves the complex problem of displaying external company logos in a Chrome extension popup while respecting browser security policies.

**Key Takeaways:**

- Extension popups cannot load external images directly
- Background service workers bypass CORS restrictions
- Data URLs enable safe display of fetched images
- Message passing connects popup and background worker
- Caching improves performance and user experience

This pattern can be applied to any Chrome extension that needs to fetch and display external resources while respecting security boundaries.

---

## Related Documentation

- [Chrome Extension Background Service Workers](https://developer.chrome.com/docs/extensions/mv3/service_workers/)
- [Chrome Extension Message Passing](https://developer.chrome.com/docs/extensions/mv3/messaging/)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Data URLs](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs)
- [FileReader API](https://developer.mozilla.org/en-US/docs/Web/API/FileReader)

---

**Document Version:** 1.0  
**Last Updated:** February 2, 2026  
**Author:** Job Tracker Development Team
