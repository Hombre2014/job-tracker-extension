# Privacy Policy for Job Tracker Extension

**Last Updated:** February 5, 2026

## Overview

Job Tracker Extension ("we", "our", or "the extension") is committed to protecting your privacy. This Privacy Policy explains how we handle information when you use our Chrome extension.

## Information Collection and Use

### Data We Collect

The Job Tracker Extension collects and processes the following data:

1. **Authentication Information**
   - Authentication tokens to communicate with the Job Tracker web application
   - Stored locally in your browser using Chrome's storage API
   - Used solely to authenticate your requests to your Job Tracker account

2. **User Activity Data**
   - Jobs you choose to save
   - Board selections and organization preferences
   - Notes, tags, and ratings you add to job postings
   - This data is sent to and stored in your personal Job Tracker account

3. **Website Content**
   - Job posting information scraped from LinkedIn and Indeed, including:
     - Job titles and descriptions
     - Company names and locations
     - Salary information (when available)
     - Application URLs
   - This data is processed locally and transmitted only to your Job Tracker account

### How We Use Your Data

All collected data is used **exclusively** for the extension's single purpose: to help you save and organize job postings in your Job Tracker account.

### Third-Party Data Sharing

**Company Name Autocomplete:**
When you use the company name search field, your typed queries are sent to Clearbit's autocomplete API to provide real-time suggestions. This is the only data shared with a third party (other than your own Job Tracker account).

We do NOT:

- Sell your data to third parties for profit
- Use your data for advertising or marketing
- Track your general browsing history
- Collect personally identifiable information beyond what's necessary for authentication and functionality
- Share job posting content or your saved jobs with third parties (only company search queries are shared with Clearbit for autocomplete)

## Data Storage

- **Local Storage:** Authentication tokens are stored locally in your browser using Chrome's storage API
- **Remote Storage:** Job data you choose to save is transmitted to and stored in your Job Tracker account at `https://online-job-trackr.vercel.app`

## Third-Party Services

The extension communicates with:

1. **Job Tracker Web Application** (`https://online-job-trackr.vercel.app`)
   - Your personal account where saved jobs are stored
   - Owned and operated by us

2. **Clearbit** (`https://autocomplete.clearbit.com`)
   - Used to provide company name autocomplete suggestions and fetch company logos
   - **Data Shared:** Company names you type in the company search field are sent to Clearbit's autocomplete API
   - **Privacy Impact:** The company names you search for may reveal your job search interests
   - **Purpose:** To provide real-time company suggestions and accurate company information
   - **Clearbit's Privacy Policy:** https://clearbit.com/privacy
   - Note: Clearbit may log these requests according to their own privacy practices

3. **LinkedIn and Indeed**
   - The extension reads publicly available job posting data from pages you visit
   - No data is sent to LinkedIn or Indeed by the extension

## Legal Basis for Processing (GDPR Article 6)

We process your data under the following legal bases:

1. **Contract Performance** (Article 6(1)(b))
   - Authentication and account access
   - Saving and retrieving job postings
   - These are necessary to provide the service you requested by installing the extension

2. **Legitimate Interest** (Article 6(1)(f))
   - Company autocomplete via Clearbit to improve user experience
   - You can disable this by not using the company search field or uninstalling the extension

3. **Consent** (Article 6(1)(a))
   - By installing and actively using this extension, you provide informed consent for the data processing described in this policy
   - You can withdraw consent at any time by uninstalling the extension

## Data Security

We implement appropriate security measures to protect your data:

- Authentication tokens are stored securely in Chrome's storage
- All communications with the Job Tracker web application use HTTPS encryption
- We validate the origin of messages to prevent unauthorized access

## Data Retention

We retain your data based on the following policies:

### Local Storage (In Your Browser)

- **Authentication tokens**: Retained until you log out, uninstall the extension, or clear browser data
- **Cached data**: Automatically cleared when you uninstall the extension

### Remote Storage (In Your Job Tracker Account)

- **Job postings and related data**: Retained indefinitely while your account remains active
- **Account data**: Retained until you explicitly delete jobs or your entire account

### Data Deletion

When you take action to delete data:

- **Uninstall extension**: Local storage data is immediately and permanently removed
- **Log out**: Authentication tokens are immediately deleted from local storage
- **Delete jobs**: Selected job posts are permanently deleted from your account within 24 hours
- **Delete account**: All associated data is permanently deleted within 30 days
- **Request deletion**: Contact us to request complete data deletion (processed within 30 days)

You may request complete account deletion and data erasure by contacting us through our GitHub Issues page.

## International Data Transfers

### Data Location

- **Local Data**: Stored in your browser on your device (remains in your location)
- **Remote Data**: Your Job Tracker account is hosted on Vercel's infrastructure, which may involve servers in various locations globally

### Third-Party Services and Data Transfers

1. **Job Tracker Backend** (`online-job-trackr.vercel.app`)
   - Hosted on Vercel (may be in US or EU depending on region)
   - Data transfers are protected by Vercel's SOC 2 compliance and EU-US Data Privacy Framework

2. **Clearbit** (`autocomplete.clearbit.com`)
   - Based in the United States
   - Company search queries may be transferred to US servers
   - Protected under EU-US Data Privacy Framework and Standard Contractual Clauses

### Safeguards for EEA Users

If you are in the European Economic Area (EEA), we rely on:

- **Adequacy decisions**: For transfers to countries deemed adequate by the European Commission
- **Standard Contractual Clauses (SCCs)**: For transfers to third-party services
- **Encryption**: All data transfers use HTTPS/TLS encryption

### Your Control

You can limit international transfers by:

- Not using the company autocomplete feature (avoids Clearbit transfers)
- Uninstalling the extension to stop all data processing

## Your Rights Under GDPR

If you are in the European Economic Area (EEA), you have the following rights:

- **Right of Access**: View your saved jobs through your Job Tracker account
- **Right to Rectification**: Edit or correct your job data in your Job Tracker account
- **Right to Erasure**: Delete your data by removing jobs from your account or deleting your account entirely
- **Right to Data Portability**: Export your job data from your Job Tracker account
- **Right to Withdraw Consent**: Uninstall the extension at any time to stop all data processing and remove locally stored data
- **Right to Object**: Contact us to object to processing based on legitimate interest
- **Right to Lodge a Complaint**: Contact your local data protection authority

### How to Exercise Your Rights

- **Stop using Clearbit autocomplete**: Don't type in the company search field, or manually enter company names from scraped data
- **Delete local data**: Uninstall the extension (removes all Chrome storage data immediately)
- **Delete account data**: Log into your Job Tracker account and delete your jobs or account
- **Withdraw all consent**: Uninstall the extension - this is as easy as installing it was

## Changes to This Policy

We may update this Privacy Policy from time to time. Any changes will be reflected in the "Last Updated" date at the top of this document.

## Contact Us

If you have questions or concerns about this Privacy Policy, please contact us:

- **GitHub Issues:** https://github.com/Hombre2014/job-tracker-extension/issues
- **Repository:** https://github.com/Hombre2014/job-tracker-extension

### Data Protection Officer

Under GDPR Article 37, we are not required to appoint a Data Protection Officer because:

- We are not a public authority
- We do not engage in large-scale processing of special categories of data
- We do not engage in large-scale systematic monitoring

However, for all privacy-related inquiries, you can contact us through the GitHub Issues page above, and we will respond within 30 days as required by GDPR Article 12.

## Third-Party Terms of Service

**Important Disclaimer:**

This extension extracts job posting data from LinkedIn, Indeed, and other job sites when you manually visit those pages. While we believe this user-initiated, personal use extraction falls within fair use, these platforms have their own Terms of Service that may restrict automated data extraction.

**User Responsibility:**

- You are solely responsible for complying with the Terms of Service of LinkedIn, Indeed, and any other websites you use with this extension
- This extension is intended for **personal use only** to help you organize your job search
- Do not use this extension to build competing services, aggregate data for commercial purposes, or violate any third-party terms
- The use of this extension does not constitute authorization from LinkedIn, Indeed, or any other platform to extract their data

**Legal Position:**

- This extension facilitates user-initiated extraction of publicly visible data that you are already viewing
- No automated crawling, bulk extraction, or bot activity is performed
- All extracted data is saved to your personal account only and is not redistributed

By using this extension, you acknowledge that you have read and understand the Terms of Service of the job sites you visit, and you agree to use this extension in compliance with those terms.

## Consent and Agreement

### Installing This Extension

When you install this extension from the Chrome Web Store, you are:

1. **Informed**: You have access to this Privacy Policy explaining all data processing
2. **Making an Active Choice**: Installation is a deliberate action, not passive acceptance
3. **Providing Specific Consent**: For the specific purpose of saving and organizing job postings
4. **Able to Withdraw Easily**: Uninstalling the extension withdraws consent and stops all processing

This constitutes valid consent under GDPR Article 7 (freely given, specific, informed, and unambiguous consent).

### Using the Extension

By actively using features of this extension (clicking "Quick Save," typing in search fields, etc.), you reaffirm your consent to the data processing necessary for those features.

### Withdrawing Consent

You can withdraw your consent at any time by:

- Uninstalling the extension (stops all processing immediately)
- Deleting your Job Tracker account (removes all saved data)
- Not using optional features (e.g., company autocomplete)

Withdrawing consent does not affect the lawfulness of processing before withdrawal.

## Compliance

This extension complies with:

- Chrome Web Store Developer Program Policies
- General Data Protection Regulation (GDPR) Articles 6, 7, 13, and 15-22
- ePrivacy Directive
- California Consumer Privacy Act (CCPA) where applicable
- Applicable data protection laws
