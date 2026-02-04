# Frontend Integration Guide

## Tab Reuse with Message Passing (Phase 4.5)

**NEW in v1.6.0**: The extension now reuses existing tabs instead of always opening new ones!

### How It Works

1. **Extension Side**: When user clicks "Save" or "Customize":
   - Stores full job data in `chrome.storage.local` with a unique key
   - Sends message to background script: `{ action: 'sendJobData', data: jobData }`

2. **Background Script**:
   - Queries for existing Job Tracker tabs (production or localhost)
   - If tab found: Sends message to content script → focuses tab → sends job data
   - If no tab: Falls back to opening new tab with URL parameters

3. **Content Script**:
   - Receives `forwardJobData` message from background
   - Forwards to page using `window.postMessage` with secure origin
   - Listens for acknowledgment from page

4. **Frontend Page**:
   - Listens for `JOB_DATA` messages from extension
   - Validates message source and type
   - Populates form with received data
   - Sends acknowledgment back to extension

### Benefits

- ✅ No more tab proliferation (10+ duplicate tabs)
- ✅ Instant navigation to existing tab
- ✅ Better user experience
- ✅ Cleaner browser history
- ✅ Backward compatible with URL parameters

### Frontend Implementation

The frontend must implement an extension message listener. See example below:

```typescript
// lib/extensionMessageListener.ts
export interface ExtensionMessage {
  type: string;
  source: string;
  data: {
    company: string;
    companyDomain?: string;
    companyLogo?: string | null;
    title: string;
    location?: string;
    url?: string;
    salary?: string;
    storageKey: string;
  };
}

export function initExtensionMessageListener(
  onMessageReceived: (data: ExtensionMessage['data']) => void,
): () => void {
  const messageHandler = (event: MessageEvent) => {
    // Validate message structure
    if (
      !event.data ||
      event.data.type !== 'JOB_DATA' ||
      event.data.source !== 'job-tracker-extension'
    ) {
      return;
    }

    const message = event.data as ExtensionMessage;

    // Validate required fields
    if (!message.data?.company || !message.data?.title) {
      console.error('Extension message missing required fields');
      return;
    }

    console.log('Received job data from extension:', message.data);

    // Send acknowledgment back to extension
    window.postMessage(
      {
        type: 'JOB_DATA_ACK',
        source: 'job-tracker-app',
      },
      window.location.origin,
    );

    // Call the callback with the data
    onMessageReceived(message.data);
  };

  window.addEventListener('message', messageHandler);

  // Return cleanup function
  return () => {
    window.removeEventListener('message', messageHandler);
  };
}
```

Usage in your component:

```typescript
// In your AddJobShortForm or similar component
import { initExtensionMessageListener } from '@/lib/extensionMessageListener';

useEffect(() => {
  const cleanup = initExtensionMessageListener((data) => {
    // Populate form with received data
    setValue('company', data.company);
    setValue('title', data.title);
    setValue('location', data.location || '');
    setValue('url', data.url || '');
    setValue('salary', data.salary || '');

    // If storageKey provided, fetch full description
    if (data.storageKey) {
      retrieveFullDescription(data.storageKey);
    }
  });

  return cleanup;
}, [setValue]);
```

## Retrieving Full Job Data from Extension

The extension now stores full job data (including complete, untruncated descriptions) in `chrome.storage.local` and passes only a storage key via URL parameters.

> **⚠️ IMPORTANT: URL Parameter Fallback Limitations**
>
> The extension includes backward-compatible URL parameters, but they have **significant limitations**:
>
> - **Description truncated to 1000 characters** (URL length restrictions)
> - **Security/Privacy risk**: Job data visible in browser history, server logs, analytics
> - **Not recommended for production use**
>
> **Always use the storage-based method** (`jobDataKey` parameter + `chrome.runtime.sendMessage`) for:
>
> - Full job descriptions (up to 10MB)
> - Sensitive data protection
> - Better user experience
>
> The URL fallback exists only for backward compatibility and will be removed in a future version.

### How It Works (Phase 4.5)

1. **Extension Side**: When user clicks "Save" or "Customize", the extension:
   - Stores full job data in `chrome.storage.local` with a unique key like `job_draft_1234567890_abc123`
   - Opens frontend URL with only the key: `/home/boards/{boardId}/board?jobDataKey=job_draft_1234567890_abc123`

2. **Frontend Side**: The frontend needs to:
   - Check for `jobDataKey` parameter in URL
   - Request the full data from the extension using `chrome.runtime.sendMessage()`
   - Use the retrieved data to populate the form

### Frontend Implementation Example

#### Step 1: Check URL Parameters

```typescript
// In your board page component
const searchParams = new URLSearchParams(window.location.search);
const jobDataKey = searchParams.get('jobDataKey');

if (jobDataKey) {
  // New flow: retrieve from extension storage
  retrieveJobDraftFromExtension(jobDataKey);
} else {
  // Old flow: read from URL params directly (fallback)
  const company = searchParams.get('company');
  const title = searchParams.get('title');
  // ... etc
}
```

#### Step 2: Retrieve Data from Extension

```typescript
const retrieveJobDraftFromExtension = async (key: string) => {
  try {
    // Get extension ID from environment variable
    const extensionId = process.env.NEXT_PUBLIC_EXTENSION_ID;

    if (!extensionId) {
      console.error('NEXT_PUBLIC_EXTENSION_ID environment variable is not set');
      throw new Error(
        'Extension ID not configured. Please set NEXT_PUBLIC_EXTENSION_ID in your environment variables.',
      );
    }

    // Request data from extension
    const response = await chrome.runtime.sendMessage(extensionId, {
      action: 'getJobDraft',
      key: key,
    });

    if (response.success && response.data) {
      const jobData = response.data;

      // Now you have the full job data including complete description
      console.log('Full description length:', jobData.description.length);

      // Populate your form with the data
      setFormData({
        company: jobData.company,
        companyDomain: jobData.companyDomain,
        companyLogo: jobData.companyLogo, // Logo URL or null
        title: jobData.title,
        location: jobData.location,
        description: jobData.description, // Full description, no truncation!
        url: jobData.url,
        salary: jobData.salary,
        columnId: jobData.columnId,
      });

      // Handle auto-save if needed
      if (jobData.autoSave) {
        // Automatically save the job
        handleSaveJob(jobData);
      }
    } else {
      console.error('Failed to retrieve job draft:', response.error);
      // Fall back to URL params if available
    }
  } catch (error) {
    console.error('Error communicating with extension:', error);
    // Fall back to URL params if available
  }
};
```

#### Step 3: Handle Extension Not Installed

```typescript
// Check if extension is available
const isExtensionAvailable = () => {
  return (
    typeof chrome !== 'undefined' &&
    chrome.runtime &&
    chrome.runtime.sendMessage
  );
};

if (!isExtensionAvailable()) {
  console.warn('Extension not available, using fallback URL params');
  // Use old method of reading from URL params
}
```

### Extension Configuration

The extension's manifest includes `externally_connectable` to allow your frontend domains to communicate:

```json
{
  "externally_connectable": {
    "matches": [
      "https://online-job-trackr.vercel.app/*",
      "http://localhost:*/*",
      "http://127.0.0.1:*/*"
    ]
  }
}
```

### Security: Origin Validation

The extension implements **origin validation** to prevent unauthorized access to job data:

**Allowed Origins (Hardcoded Allowlist):**

- ✅ `https://online-job-trackr.vercel.app` - Production
- ✅ `http://localhost:3000` - Next.js dev server
- ✅ `http://localhost:5173` - Vite dev server
- ✅ `http://127.0.0.1:3000` - Alternative localhost
- ✅ `http://127.0.0.1:5173` - Alternative localhost

**Security Features:**

1. **Explicit allowlist** in background service worker validates sender origin
2. **Unauthorized attempts** are rejected with error: `"Unauthorized origin"`
3. **Logging**: Rejected attempts logged for security monitoring
4. **Defense-in-depth**: Multiple layers (manifest + code validation + one-time keys + expiration)

**Important**: If you deploy to a new domain, you must:

1. Add the domain to `externally_connectable` in `manifest.json`
2. Add the domain to the `allowedOrigins` array in `background/index.ts`
3. Rebuild the extension

### Extension ID

To find your extension ID:

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Find "Job Tracker Extension" and copy the ID below the name
4. Add it to your frontend environment variables:

   ```text
   NEXT_PUBLIC_EXTENSION_ID=your_extension_id_here
   ```

### Data Structure

The job data object retrieved from extension has this structure:

```typescript
interface JobDraft {
  company: string;
  companyDomain: string;
  companyLogo: string | null; // Company logo URL from Clearbit, or null if unavailable
  title: string;
  location: string;
  description: string; // Full HTML description, no truncation
  url: string;
  salary: string;
  columnId: string;
  autoSave: boolean;
  timestamp: number;
}
```

### Company Logo Handling

The extension now captures and sends company logo URLs when available:

- **Logo Source**: Clearbit autocomplete API provides logo URLs
- **Value**: Logo URL string when available, `null` when company has no logo
- **Frontend Handling**:
  - Use the `companyLogo` field to display company branding
  - Implement fallback to generic icon when logo is `null` or fails to load
  - Brandfetch CDN may return blank 40x40 placeholder images - detect these using image dimensions
  - Display generic Building2 icon for companies without valid logos

#### Logo Detection Example

```typescript
// Frontend logo component with blank image detection
const [isBlankImage, setIsBlankImage] = useState(false);

const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const img = e.currentTarget;
  // Detect Brandfetch placeholder images (40x40 blank)
  if (img.naturalWidth <= 50 && img.naturalHeight <= 50) {
    setIsBlankImage(true);
  }
};

// Show generic icon when:
// - No domain available
// - Image failed to load
// - Image is detected as blank placeholder
const showGenericIcon = !cleanDomain || hasError || isBlankImage;
```

### Benefits of Extension Integration

✅ **No truncation** - Full job descriptions are preserved
✅ **No URL length limits** - Data stored in chrome.storage has much higher limits (10MB)
✅ **Backward compatible** - Falls back to URL params if extension communication fails
✅ **Secure** - Data is one-time use and auto-cleaned up after retrieval
✅ **Auto-cleanup** - Old drafts (>1 hour) are automatically removed

### Testing

1. Install the extension in development mode
2. Navigate to a LinkedIn job posting
3. Open extension popup and click "Save" or "Customize"
4. Verify the frontend receives the `jobDataKey` parameter
5. Verify the frontend successfully retrieves full job data including complete description
6. Check browser console for any errors

### Troubleshooting

**Issue**: `chrome.runtime.sendMessage` returns undefined

- **Solution**: Make sure extension ID is correct and extension is installed

**Issue**: "Extension context invalidated"

- **Solution**: Extension was reloaded/updated. User needs to reload the frontend page

**Issue**: "Job draft not found or expired"

- **Solution**: Draft was already retrieved (one-time use) or expired (>1 hour old)

**Issue**: Frontend doesn't have `chrome` API available

- **Solution**: This is normal. You need to use `chrome.runtime.sendMessage(extensionId, ...)` with the full extension ID, not just `chrome.runtime.sendMessage(...)`
