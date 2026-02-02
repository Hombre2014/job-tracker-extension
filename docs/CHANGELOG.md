# Changelog

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.1] - 2026-02-02

### Fixed

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

### Changed

- **Consistency Improvements**
  - All chrome.storage operations now follow consistent async/await pattern with error checking
  - All error handlers properly log errors before sending responses
  - All type annotations use specific types instead of `any`

## [1.4.0-pro] - 2026-02-02

### Added

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

### Fixed - 2026-02-02

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

### Technical Details

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

[1.3.9-pro]: https://github.com/Hombre2014/job-tracker-extension/compare/v1.3.8-pro...v1.3.9-pro
[1.3.8-pro]: https://github.com/Hombre2014/job-tracker-extension/releases/tag/v1.3.8-pro
