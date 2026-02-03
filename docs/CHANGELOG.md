# Changelog

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.0] - 2026-02-03

### Fixed

- **Full Job Description Preservation**
  - Removed 1000-character truncation limit on job descriptions
  - Extension now stores full job data in `chrome.storage.local` instead of URL parameters
  - Passes only a storage key via URL to avoid URL length limitations
  - Used `chrome.runtime.onMessageExternal` for proper external web page communication
  - Backend service worker retrieves full data on frontend request
  - Auto-cleanup of old draft data (>1 hour)
  - One-time use: draft data is removed after frontend retrieves it
  - **Note**: Backward-compatible URL parameter fallback exists but is limited (1000-char truncation, security concerns) and deprecated for future removal
  - Files: `App.tsx`, `background/index.ts`, `manifest.json`
  - Documentation: `docs/FRONTEND_INTEGRATION.md`

- **Salary Field Enhancement**
  - Fixed salary field to remain empty when no salary detected (instead of showing "€0")
  - Added promotional text filtering to exclude LinkedIn advertisements (e.g., "Try Premium for €0")
  - Improved salary validation to filter out currency symbols with zero values
  - Detects and excludes promotional phrases combined with zero amounts
  - Cleaner URL parameters when salary information is unavailable
  - Files: `content/scrapers.ts`, `App.tsx`

- **Company Logo Support**
  - Extension now captures and sends company logo URLs from Clearbit autocomplete
  - Frontend receives company domain and logo information
  - Blank/placeholder image detection for companies without real logos
  - Generic Building2 icon displays when logo is unavailable or invalid
  - Intelligent detection of Brandfetch placeholder images (≤50x50 pixels)
  - Files: `App.tsx` (extension), `CompanyLogo.tsx` (frontend), `companiesThunk.ts` (frontend)

- **Message Channel Reliability**
  - Fixed content script message handler to always send response for unknown actions
  - Prevents message channel from hanging when invalid action is received
  - Added warning log for unknown actions to aid debugging
  - File: `content/index.ts`

- **Code Consistency**
  - Standardized `companyLogo` handling between try/catch blocks in handleSave
  - Removed duplicate salary validation logic
  - Salary value now calculated once and reused in both code paths
  - File: `App.tsx`

### Added

- **Extension Communication API**
  - Added `externally_connectable` configuration in manifest
  - Allows frontend application to communicate with extension
  - New message handler: `getJobDraft` action in background service worker
  - Frontend can retrieve full job data using `chrome.runtime.sendMessage()`
  - Secure one-time retrieval with automatic cleanup
  - Proper external message listener for web page communication
  - **Security**: Origin validation with explicit allowlist prevents unauthorized domains from retrieving job data
  - Allowlist includes production domain and local development servers (localhost:3000, localhost:5173, 127.0.0.1)
  - Rejected attempts logged with warning for security monitoring
  - File: `background/index.ts`

- **Company Data Transfer**
  - Extension sends `companyDomain` and `companyLogo` fields to frontend
  - Support for `null` logo values (companies without logos)
  - Frontend `ExtensionJobData` interface includes `companyLogo` field
  - Backend API accepts logo parameter in company creation

### Changed

- **User Interface Simplification**
  - Removed "Customize" button (incomplete feature)
  - Simplified to single "Quick Save" button for auto-save functionality
  - Button now centered with better visual emphasis
  - Removed unused `Edit3` icon import
  - Simplified `handleSave` function - no longer requires `autoSave` parameter
  - Always sends `autoSave=true` to frontend for consistent behavior
  - File: `App.tsx`

- **Version Display**
  - Updated extension version display from "Build 1.3.8-pro" to "v1.5.0"
  - Version now matches manifest.json for consistency
  - File: `App.tsx`

- **Production Optimization**
  - Cleaned up verbose console.log statements for production
  - Kept only error and warning logs for debugging
  - Reduced console noise in both extension and frontend integration

- **Frontend Logo Component**
  - Replaced Next.js `Image` component with standard `<img>` tag for better error handling
  - Added intelligent blank image detection based on dimensions
  - Improved fallback to generic icon when logo fetch fails
  - Better handling of external image loading errors

## [1.4.3] - 2026-02-03

### Fixed in v1.4.3

- **LinkedIn SPA Navigation Scraping**
  - Added DOM readiness check before scraping to handle LinkedIn's client-side routing
  - Content script now waits for page content to load after navigation (up to 2 seconds with retries)
  - Fixes issue where extension couldn't scrape data until page was manually refreshed
  - Extension now works immediately after clicking on new job postings without refresh
  - Improved user experience on LinkedIn's single-page application
  - Files: `content/index.ts`

## [1.4.2] - 2026-02-03

### Fixed in v1.4.2

- **Token Sync Error Handling**
  - Added missing `chrome.runtime.lastError` check in token sync storage callback
  - Prevents silent failures when recovering tokens from chrome.storage
  - Consistent error handling across all storage operations
  - Files: `App.tsx`

- **Async Storage in Message Callbacks**
  - Changed `await storeTokens()` to fire-and-forget pattern with `.catch()` error handling
  - Prevents popup closure from interrupting storage operations
  - Storage operations now complete even if popup closes quickly
  - Better user experience with non-blocking callback execution
  - Files: `App.tsx`

- **Scrape Retry Mechanism Memory Leak**
  - Added `isMounted` flag to prevent state updates on unmounted components
  - Retry timeouts now check mount state before scheduling
  - Prevents React warnings about updating unmounted components
  - Proper cleanup function prevents memory leaks
  - Files: `App.tsx`

- **Token Refresh Error Handling**
  - Made token clearing smarter - only clears on authentication failures (401/403)
  - Network errors (timeouts, DNS issues) no longer force re-authentication
  - Preserves valid tokens during transient network failures
  - Better UX: users don't need to re-login after temporary network glitches
  - Files: `lib/auth.ts`

### Removed

- **Unused tokenService.ts Module**
  - Removed duplicate `lib/tokenService.ts` file (dead code)
  - Module was not imported anywhere in codebase
  - Eliminated confusion from having two token management implementations
  - `lib/auth.ts` remains as the single source of truth for token operations
  - Files: `lib/tokenService.ts` (deleted)

### Technical Details

- **Storage Operations**: All chrome.storage callbacks now consistently check `chrome.runtime.lastError`
- **Component Lifecycle**: Added proper cleanup for async operations to prevent memory leaks
- **Error Resilience**: Token refresh now distinguishes between auth failures and network issues
- **Code Cleanup**: Removed 91 lines of unused duplicate code

## [1.4.1] - 2026-02-02

### Fixed - 2026-02-02

- **CompanyLogo Component Robustness**
  - Added `chrome.runtime.lastError` check to prevent silent failures when background script is unavailable
  - Implemented unmounted component state guard to prevent React warnings from async callbacks
  - Fixed synchronous `setState` in effect by properly initializing loading state based on domain presence
  - Removed unused `logoUrl` prop from component interface (now exclusively uses background worker)
  - Files: `components/CompanyLogo.tsx`, `components/CompanyAutocomplete.tsx`

- **Type Safety Improvements**
  - Fixed `catch (err: any)` to `catch (err)` in useCompanyAutocomplete hook for proper TypeScript error handling
  - Changed TextEditor onChange event type from `any` to proper `ContentEditableEvent` from react-simple-wysiwyg
  - Ensures type safety and eliminates ESLint warnings
  - Files: `hooks/useCompanyAutocomplete.ts`, `components/TextEditor.tsx`

- **Content Script Error Handling**
  - Added explicit error response for unauthorized origins attempting to access tokens
  - Implemented error logging in catch block instead of silent failure
  - Improves debugging and security monitoring
  - Files: `content/index.ts`

- **Async Storage Operations**
  - Made `storeTokens()` async with proper Promise handling and chrome.runtime.lastError checks
  - Made `clearTokens()` async with proper Promise handling and chrome.runtime.lastError checks
  - Updated App.tsx callback to async for proper await of storage operations
  - Prevents race conditions and ensures storage operations complete before continuing
  - Files: `lib/tokenService.ts`, `App.tsx`

- **URL Security Enhancement**
  - Added `encodeURIComponent()` for domain parameter in Google Favicon Service URL
  - Handles special characters, internationalized domains, and prevents URL injection
  - Example: "münchen.de" → "m%C3%BCnchen.de"
  - Files: `background/index.ts`

### Changed - 2026-02-02

- **Consistency Improvements**
  - All chrome.storage operations now follow consistent async/await pattern with error checking
  - All error handlers properly log errors before sending responses
  - All type annotations use specific types instead of `any`

## [1.4.0-pro] - 2026-02-02

### Added - 2026-02-02

- **Company Logo Display System**
  - Implemented Background Service Worker to fetch company logos via Google Favicon Service
  - Added logo caching system in background worker for performance optimization
  - Integrated CompanyLogo component with data URL display system
  - Company logos now display in extension popup when selected from autocomplete
  - Logos are successfully transferred to frontend application via `companyDomain` URL parameter
  - See `docs/Background_Worker_Logo_System.md` for technical details

- **Rich Text Editor for Job Descriptions**
  - Integrated `react-simple-wysiwyg` editor (v3.1.2) for formatted job descriptions
  - Full formatting toolbar: Bold, Italic, Underline, Strikethrough, Alignment, Lists, Links, HTML view
  - Supports HTML formatted descriptions scraped from job boards
  - Debounced onChange (300ms) for performance optimization
  - Yellow background styling for better visual distinction
  - Files: `components/TextEditor.tsx`

- **Smart Company Autocomplete**
  - Auto-opens dropdown with suggestions when company name is scraped from job page
  - Extracts first word from company name for better Clearbit API matching
  - Displays company logos from Google Favicon Service
  - Prevents repeated auto-opens with ref-based tracking
  - Resets auto-open flag on user interaction
  - Files: `components/CompanyAutocomplete.tsx`, `components/CompanyLogo.tsx`

- **Automatic Token Refresh System**
  - Implemented token refresh mechanism to maintain session beyond 1 hour
  - Created `lib/auth.ts` utility module with refresh functions
  - Auto-refreshes access token on 401 errors
  - Stores both access and refresh tokens via chrome.storage
  - Retrieves refresh token from content script alongside access token
  - Prevents disconnection after refresh token rotation
  - Files: `lib/auth.ts`, `App.tsx`, `content/index.ts`

- **Enhanced Job Data Scraping**
  - Changed description capture from plain text to HTML format
  - Preserves formatting: headings, lists, bold, italic, links
  - Removes script tags for security
  - LinkedIn: Captures via `.innerHTML` with HTML cleanup
  - Indeed: Captures `#jobDescriptionText` inner HTML
  - Files: `content/scrapers.ts`

- **Manifest Updates**
  - Added background service worker configuration
  - Added host permissions for Google Favicon Service (`www.google.com/*`)
  - Added host permissions for Google Static Content (`*.gstatic.com/*`)
  - Critical for logo fetching without CORS restrictions

### Fixed 2026-02-02

- **First-Click Job Capture Issue**
  - Added ping mechanism to check content script readiness
  - Implemented automatic script injection if not loaded
  - Added 1200ms initialization wait time after injection
  - Retry mechanism with exponential backoff
  - Files: `App.tsx`

- **Salary Extraction for LinkedIn**
  - Enhanced salary selectors for pill-shaped salary display
  - Improved regex to capture complete salary ranges
  - Added descriptive salary text support (e.g., "Competitive")
  - Files: `content/scrapers.ts`

- **Job Title Suffix Removal**
  - Automatically removes "- job post" suffix from scraped titles
  - Case-insensitive regex replacement
  - Cleaner job titles in extension and frontend
  - Files: `content/scrapers.ts`

- **TextEditor Component Missing**
  - Restored TextEditor import after accidental removal during cleanup
  - Replaced textarea with TextEditor component in App.tsx
  - Job descriptions now display with rich text formatting
  - Files: `App.tsx`

- **Company Logo Not Transferring to Frontend**
  - Added `companyDomain` parameter to URL when opening frontend
  - Passes domain from Clearbit autocomplete data
  - Frontend now receives domain for logo fetching
  - Logos display correctly in Job Info Modal, Job Post cards, and Company tab
  - Files: `App.tsx`

### Changed - 2026-02-02

- **Description Field Label**
  - Changed from "Job Description (Snippet)" to "Job Description"
  - Reflects rich text editing capability
  - Files: `App.tsx`

### Technical Details - 2026-02-02

- **Background Worker Architecture**
  - Service worker runs in background context with special permissions
  - Fetches from Google Favicon Service: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
  - Follows redirects to `t3.gstatic.com` (requires host_permissions)
  - Converts blob to base64 data URL using FileReader
  - Sends data URL back to popup via `chrome.runtime.sendMessage`
  - Popup displays data URL without CORS restrictions
  - Caches logos in Map<string, string> for performance

- **Dependencies Added**
  - `react-simple-wysiwyg@3.1.2` - Rich text editor
  - `lodash@4.17.21` - Debouncing utility

### Known Issues Resolved

- ~~Brandfetch API: 403 Forbidden errors~~ (Resolved: switched to Google Favicon Service)
- ~~Clearbit Logo API: ERR_NAME_NOT_RESOLVED~~ (Resolved: switched to Google Favicon Service)
- ~~Direct image loading in popup: CORS blocked~~ (Resolved: background worker with data URLs)
- ~~Extension disconnects after 1 hour~~ (Resolved: automatic token refresh)
- ~~Raw HTML showing in descriptions~~ (Resolved: TextEditor component restored)

## [1.3.9-pro] - 2026-01-31

### Added -2026-01-31

- **Enhanced Job Scraper**
  - Implemented heuristic-based salary scanning to detect currency patterns (e.g., $100k, £50/hr).
  - Improved LinkedIn scraper with specific insight filtering and top-card text scanning.
  - Enhanced Indeed scraper with new selectors for salary and location.
  - Added support for Schema.org `baseSalary` metadata extraction.
- **Production Readiness**
  - Replaced hardcoded URLs with configurable environment variables (`VITE_BACKEND_URL`, `VITE_FRONTEND_URL`).
  - Implemented automatic job description truncation (1000 characters) to prevent URL length limit issues.
  - Created `.env` and `.env.example` templates for deployment configuration.

### Fixed -2026-01-31

- **Cascading Render in Components**
  - Resolved ESLint error `react-hooks/set-state-in-effect` in `CompanyAutocomplete.tsx` and `CompanyLogo.tsx`.
  - Optimized component logic to use event-based or render-phase state updates instead of redundant `useEffect` hooks.
- **Security Hardening**
  - Restricted message listeners to only respond to the extension's own ID.
  - Implemented origin validation for token synchronization to prevent unauthorized data exposure.
  - Removed sensitive console logs containing tokens or scraped data.
- **Robustness & Resilience**
  - Implemented automatic session recovery: extension now detects `401 Unauthorized` errors, clears the expired token, and triggers an immediate re-sync with active web app tabs.
  - Added `.catch()` handlers to all API fetch operations with user-friendly error messages.
  - Improved token synchronization to baseline with local storage and handle unresponsive tabs.
  - Removed dead code and unreachable "No boards found" UI conditions.
- **Configuration**
  - Updated `manifest.json` with production host permissions and content script matches.
  - Fixed localhost matching in manifest to be more robust across different ports.

## [1.3.8-pro] - 2026-01-30

### Added -2026-01-30

- **Initial Extension Scaffold (Phase 2)**
  - Initialized project with Vite + React + TypeScript + TailwindCSS
  - Configured Manifest V3 for Chrome Extension compatibility
  - Integrated `@crxjs/vite-plugin` for seamless development and building
  - Set up TailwindCSS with `postcss` and custom configuration
  - Configured TypeScript with project references (`tsconfig.app.json`, `tsconfig.node.json`)
  - Added "Build 1.3.8-pro" version indicator in the popup UI
  - Created initial popup interface with "Job Tracker Extension" header

### Configuration

- **Manifest V3**
  - Permissions: `activeTab`, `scripting`, `storage`, `tabs`
  - Host Permissions: LinkedIn, Indeed, and Localhost
- Content Scripts: Configured for injection on target job boards
- Action: Default popup pointing to `index.html`

- **Build System**
  - Configured `vite.config.ts` for extension building
  - Resolved Tailwind CLI installation issues
  - Fixed TypeScript strict mode warnings

[1.5.0]: https://github.com/Hombre2014/job-tracker-extension/compare/v1.4.3...v1.5.0
[1.4.3]: https://github.com/Hombre2014/job-tracker-extension/compare/v1.4.2...v1.4.3
[1.4.2]: https://github.com/Hombre2014/job-tracker-extension/compare/v1.4.1...v1.4.2
[1.4.1]: https://github.com/Hombre2014/job-tracker-extension/compare/v1.4.0-pro...v1.4.1
[1.4.0-pro]: https://github.com/Hombre2014/job-tracker-extension/compare/v1.3.9-pro...v1.4.0-pro
[1.3.9-pro]: https://github.com/Hombre2014/job-tracker-extension/compare/v1.3.8-pro...v1.3.9-pro
[1.3.8-pro]: https://github.com/Hombre2014/job-tracker-extension/releases/tag/v1.3.8-pro
