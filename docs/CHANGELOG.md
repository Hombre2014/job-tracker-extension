# Changelog

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[1.3.8-pro]: https://github.com/Hombre2014/job-tracker-extension/releases/tag/v1.3.8-pro
