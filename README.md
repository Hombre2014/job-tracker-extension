# Job Tracker Extension

> A browser extension for scraping job details from LinkedIn and Indeed and saving them to Job Tracker.

## Built With

- Libraries: React
- Framework: Vite
- Tooling: CRXJS Vite Plugin
- Styling: TailwindCSS
- Major languages: TypeScript

## Related Repositories

- [Job Tracker Frontend](https://github.com/Hombre2014/job-tracker-frontend)
- [Job Tracker Backend](https://github.com/Hombre2014/job-tracker-backend)

## Features

- **Automated Scraping**: Quickly extract job titles, company names, locations, and full descriptions from LinkedIn and Indeed.
- **Full Description Preservation**: No truncation - complete job descriptions up to 10MB stored securely.
- **Company Logo Detection**: Automatically captures company logos from Clearbit autocomplete with intelligent fallback.
- **Smart Salary Filtering**: Filters out promotional text and zero values, only showing real salary information.
- **Easy Integration**: Seamless data transfer to Job Tracker via secure storage-based communication.
- **Modern UI**: Clean popup interface built with React and TailwindCSS.
- **Backward Compatible**: Fallback to URL parameters if storage-based transfer fails.

## Installation

### Prerequisites

- Node.js (v21 or later)
- Job Tracker Frontend and Backend running (to save data)

### Developer Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/Hombre2014/job-tracker-extension
   ```

2. **Change the directory**:

   ```bash
   cd job-tracker-extension
   ```

3. **Install the dependencies**:

   ```bash
   npm install
   ```

4. **Build the extension**:

   ```bash
   npm run dev
   ```

   _This will generate a `dist` folder in the project directory._

### Load in Browser

1. Open Chrome or Edge and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (toggle in the top right).
3. Click **Load unpacked**.
4. Select the `dist` folder from your `job-tracker-extension` directory.

## Authors

👤 **Yuriy Chamkoriyski**

- GitHub: [@Hombre2014](https://github.com/Hombre2014)
- Twitter: [@Chamkoriyski](https://twitter.com/Chamkoriyski)
- LinkedIn: [axebit](https://linkedin.com/in/axebit)

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## Show your support

Give a ⭐️ if you like this project!

## 📝 License

This project is [Proprietary](./LICENSE) licensed. No modifications or distributions of modified versions are allowed without prior written permission.
