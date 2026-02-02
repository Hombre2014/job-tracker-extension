# Changelog

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.9-pro] - 2026-01-31

### Added

- **Enhanced Job Scraper**
  - Implemented heuristic-based salary scanning to detect currency patterns (e.g., $100k, £50/hr).
  - Improved LinkedIn scraper with specific insight filtering and top-card text scanning.
  - Enhanced Indeed scraper with new selectors for salary and location.
  - Added support for Schema.org `baseSalary` metadata extraction.
- **Production Readiness**
  - Replaced hardcoded URLs with configurable environment variables (`VITE_BACKEND_URL`, `VITE_FRONTEND_URL`).
  - Implemented automatic job description truncation (1000 characters) to prevent URL length limit issues.
  - Created `.env` and `.env.example` templates for deployment configuration.

### Fixed

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

### Added

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
