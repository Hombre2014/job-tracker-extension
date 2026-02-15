# Chrome Web Store Listing - Job Tracker Helper

## Basic Information

### Extension Name

Job Tracker Helper

### Short Description (132 characters max)

Extract job details from LinkedIn and Indeed with one click. Save directly to your Job Tracker without manual copying.

## Detailed Description

### Opening Hook

Tired of copying and pasting job details? Job Tracker Helper automates the entire process with a single click.

### Main Description

**What It Does:**
Job Tracker Helper is your intelligent job search companion that eliminates tedious manual data entry. While browsing LinkedIn or Indeed, simply click the extension icon and all job details—title, company, location, salary, and full description—are instantly saved to your Job Tracker application.

**Key Features:**

✅ **One-Click Job Capture**
No more copying and pasting. Extract complete job details instantly from any LinkedIn or Indeed posting.

✅ **Smart Tab Management**
Automatically reuses your existing Job Tracker tabs instead of cluttering your browser with duplicates.

✅ **Intelligent Salary Detection**
Captures real compensation data while filtering out promotional text and zero values. Supports multiple formats: $100K/yr, €55K-€65K, "Salary: Up to 70,000 EUR"

✅ **Complete Data Preservation**
Never lose information. Full job descriptions up to 10MB are stored securely—no truncation.

✅ **Company Logo Capture**
Automatically fetches company logos when available for a more visual job tracking experience.

✅ **Board Selection**
Choose which job board to save to, or let it go to your default board automatically.

✅ **Real-Time Sync**
Changes appear instantly in your Job Tracker dashboard. No delays, no confusion.

**Perfect For:**

- Active job seekers tracking multiple applications
- Career changers exploring new opportunities
- Recruiters managing candidate pipelines
- Anyone who wants to spend less time on data entry and more time on actual applications

**How It Works:**

1. Browse LinkedIn or Indeed job postings
2. Click the Job Tracker Helper icon
3. Select your target board (optional)
4. Click "Quick Save"
5. Done! View it in your Job Tracker dashboard

**Why Job Tracker Helper?**

- **Save Time**: Reduce manual data entry by 90%
- **Stay Organized**: All jobs in one place with full details
- **Never Miss Details**: Complete descriptions and salary information captured
- **Secure & Private**: Direct browser-to-app communication, no intermediary servers
- **Modern & Fast**: Built with the latest web technologies for speed and reliability

**Platform Support:**

Currently optimized for LinkedIn and Indeed. Works with most standard job posting formats. More platforms coming soon!

**Requirements:**

- Free Job Tracker account (sign up at [your-domain])
- Chrome or Edge browser
- Active internet connection

Transform your job search from tedious to effortless. Install Job Tracker Helper today!

### Version Information

**Current Version**: 1.6.3

See [CHANGELOG.md](./CHANGELOG.md) for complete version history.

## Store Listing Assets

### Category

**Primary**: Search Tools (or Shopping as alternative)
**Justification**: Helps users search for jobs and organize job search information

**Note**: Select "Search Tools" from the dropdown. If that doesn't feel right, "Shopping" also works (job shopping).

### Icon Requirements

- **Size**: 128x128 pixels (PNG)
- **Design**: See ICON_IDEAS.md for concept suggestions
- **Background**: Transparent or solid color
- **Style**: Modern, clean, professional

### Screenshots Required

Create 5 high-quality screenshots at 1280x800 or 640x400:

1. **main-popup.png**
   - Show: Extension popup with scraped job data
   - Highlight: Clean UI, extracted fields (title, company, location, salary)
   - Caption: "Extract job details with one click"

2. **linkedin-demo.png**
   - Show: LinkedIn job page with extension icon highlighted
   - Highlight: Extension in action on real LinkedIn page
   - Caption: "Works seamlessly with LinkedIn"

3. **indeed-demo.png**
   - Show: Indeed job page with extension popup open
   - Highlight: Salary extraction in action
   - Caption: "Captures salary information from Indeed"

4. **dashboard-integration.png**
   - Show: Job Tracker dashboard with newly saved job highlighted
   - Highlight: Job appearing in the selected board
   - Caption: "Instantly syncs to your Job Tracker"

5. **board-selection.png**
   - Show: Extension popup with board dropdown open
   - Highlight: Multiple boards available for selection
   - Caption: "Choose where to save each job"

### Promotional Images

#### Small Tile (440x280)

- Extension icon + "Job Tracker Helper" text
- Tagline: "Automate Your Job Search"

#### Large Tile (920x680)

- Hero image showing extension in use
- Key features listed visually
- Call to action: "Install Now"

#### Marquee (1400x560) - Optional

- Full workflow demonstration
- Before/After comparison
- Statistics: "Save 90% of your time"

### Demo Video/GIF (Highly Recommended)

**Duration**: 10-15 seconds
**Content**:

1. Show LinkedIn job page (2s)
2. Click extension icon (1s)
3. Show popup with extracted data (3s)
4. Click "Quick Save" (1s)
5. Tab switches to Job Tracker (2s)
6. Job appears in board (2s)
7. End screen: "Job Tracker Helper - Install Now" (2s)

**Tools to Create**:

- ScreenToGif (Free, Windows)
- OBS Studio (Free, cross-platform)
- LICEcap (Free, cross-platform)
- Camtasia (Paid)

**Specifications**:

- Format: MP4 or WebM
- Resolution: 1280x800 recommended
- Max file size: 1GB
- Keep under 30 seconds for best engagement

## Privacy Policy

### Required for Store Listing

**Data Collection**: None

- We do not collect any user data
- We do not track usage or analytics
- We do not sell or share information

**Data Storage**: Local Only

- Job drafts stored in browser's local storage
- Data transferred directly to your Job Tracker app
- No intermediary servers

**Permissions Explained**:

- `activeTab`: To read job posting content on the current page
- `storage`: To temporarily store job data before sending to app
- `scripting`: To inject content scripts on job posting pages
- Host permissions: Only to communicate with your Job Tracker app

**Third-Party Services**: None

- Direct browser-to-app communication only
- No external API calls except to your Job Tracker instance

### Privacy Policy URL

Create a page on your Job Tracker domain:
`https://[your-domain]/privacy-policy/extension`

## Support Information

### Support URL

`https://github.com/Hombre2014/job-tracker-extension/issues`

### Support Email

[Your support email]

### Homepage URL

`https://github.com/Hombre2014/job-tracker-extension`

## Pre-Launch Checklist

### Code & Build

- [ ] Build production version: `npm run build`
- [ ] Test extension thoroughly in fresh Chrome profile
- [ ] Verify all permissions are necessary and documented
- [ ] Remove console.log statements from production code
- [ ] Verify manifest.json version matches package.json

### Store Assets

- [ ] Create 128x128 icon (PNG, transparent or solid background)
- [ ] Create 5 screenshots at 1280x800 or 640x400
- [ ] (Optional) Create promotional tiles (440x280, 920x680, 1400x560)
- [ ] (Highly Recommended) Record demo video/GIF (10-15s)
- [ ] Optimize all images for file size

### Documentation

- [ ] Create or update privacy policy page
- [ ] Verify all links in store listing work
- [ ] Check spelling and grammar in description
- [ ] Ensure contact information is current

### Legal & Compliance

- [ ] Verify you have rights to all images/screenshots
- [ ] Confirm no trademarked terms in name (except LinkedIn/Indeed in description)
- [ ] Review Chrome Web Store Program Policies
- [ ] Prepare $5 one-time developer registration fee (already paid ✅)

### Testing

- [ ] Test on Windows Chrome
- [ ] Test on Mac Chrome (if possible)
- [ ] Test on Edge
- [ ] Test with fresh/empty Job Tracker account
- [ ] Test with multiple boards
- [ ] Test with slow internet connection
- [ ] Test error scenarios (Job Tracker app down, wrong credentials)

### Store Submission

- [ ] ZIP the dist folder contents (not the dist folder itself)
- [ ] Log into Chrome Web Store Developer Dashboard
- [ ] Create new item
- [ ] Upload ZIP file
- [ ] Fill in store listing details
- [ ] Upload screenshots and icon
- [ ] Set visibility (Public / Unlisted / Private)
- [ ] Submit for review

### Post-Publication

- [ ] Update README.md with actual Chrome Web Store link
- [ ] Add extension badges to repository
- [ ] Share on social media / job search communities
- [ ] Monitor reviews and respond promptly
- [ ] Set up GitHub issues template for bug reports

## Expected Timeline

- **Review Time**: 1-3 business days (sometimes up to 1-2 weeks for first submission)
- **Rejection Reasons** (if any):
  - Permissions not properly justified
  - Privacy policy missing or incomplete
  - Screenshots don't match functionality
  - Code quality issues
  - Trademark violations

## Post-Launch Marketing Ideas

1. **Share on Reddit**:
   - r/jobs
   - r/careerguidance
   - r/webdev (for technical audience)

2. **LinkedIn Post**:
   - Share your own job search story
   - How this tool helped you
   - Ask for feedback

3. **Product Hunt**:
   - Launch when you have good screenshots/GIF
   - Prepare for questions and feedback

4. **Twitter/X**:
   - Share the story behind building it
   - Show the demo GIF

5. **Blog Post** (on Job Tracker site):
   - "Introducing Job Tracker Helper"
   - Benefits and tutorial

## Notes

- **Pricing**: Free (no in-app purchases or subscriptions)
- **Maturity Rating**: Everyone
- **Language**: English (add more later if needed)
- **Performance Impact**: Minimal - only active on job posting pages
- **Offline Functionality**: Requires internet to sync with Job Tracker app

## Contact for Review Questions

If reviewers have questions, they'll email you at the address associated with your developer account. Monitor that inbox closely during the review period.

---

Good luck with your Chrome Web Store launch! 🚀
