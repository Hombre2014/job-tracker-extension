# Testing Guide for LinkedIn Scraping Fixes

## Changes Made

### 1. Enhanced Salary Detection

- **Added Pattern 1 Enhancement**: Now detects "Compensation:", "Pay:", "Rate:" in addition to "Salary:"
- **Added Pattern 1 Currency Code Support**: Now recognizes currency codes (USD, EUR, GBP, CHF, CAD, AUD, JPY, CNY) in addition to symbols (€, $, £)
- **Added Pattern 5**: New pattern specifically for currency code ranges (e.g., "USD 0-65 per hour")
- **Extended Pattern 4**: Added more currency codes (CAD, AUD, JPY, CNY)

### 2. Enhanced DOM Selectors for Single Job View

- **Job Title**: Added 2 new selectors for single job view
- **Company Name**: Added 2 new selectors for single job view
- **Location**: Added 2 new selectors for single job view
- **Salary Insights**: Added 2 new selectors for single job view
- **Description**: Added 2 new selectors for single job view

## Test Cases

### Test Case 1: Original Issue - Single Job View with USD Salary

**URL**: `https://www.linkedin.com/jobs/view/4374701324/`

**Expected Results**:

- ✅ **Company**: "Quik Hire Staffing"
- ✅ **Job Title**: "Software Expert (Remote)" (NOT including company name)
- ✅ **Location**: Should extract location (e.g., "Remote", "100% Remote (Global)", etc.)
- ✅ **Salary**: "USD 0-65 per hour" (or similar format)
- ✅ **Description**: Should capture the full job description HTML

**How to Test**:

1. Build and load the extension
2. Navigate to the URL above
3. Click the extension icon
4. Click "Quick Save" or open the form
5. Verify all fields are populated correctly

---

### Test Case 2: Split View (Regression Test)

**URL**: Navigate to LinkedIn jobs search and select a job from the list

**Expected Results**:

- ✅ All fields should still work as before
- ✅ Salary with $ symbol should still be detected
- ✅ Job title, company, location should still work

**How to Test**:

1. Go to `https://www.linkedin.com/jobs/`
2. Search for any job (e.g., "software engineer")
3. Click on a job in the left panel (split view)
4. Open the extension
5. Verify all fields are populated

---

### Test Case 3: Salary with Currency Symbols (Regression Test)

**Test**: Find jobs with traditional salary formats

**Expected Salary Formats to Still Work**:

- ✅ "$50,000 - $70,000 per year"
- ✅ "€40k - €60k"
- ✅ "£35,000/year"
- ✅ "Up to $150,000"

---

### Test Case 4: Salary with Currency Codes

**Test**: Find jobs with currency code salaries

**Expected Salary Formats That Now Work**:

- ✅ "USD 0-65 per hour"
- ✅ "EUR 50-70 per hour"
- ✅ "Compensation: USD 100-150 per hour"
- ✅ "Pay: 50,000 EUR per year"
- ✅ "Rate: GBP 40-50 per hour"

---

### Test Case 5: Jobs Without Salary (Regression Test)

**Test**: Jobs that don't list salary

**Expected Results**:

- ✅ Salary field should be empty
- ✅ Other fields should still populate
- ✅ No errors should occur

---

## How to Build and Test the Extension

### Step 1: Build the Extension

```bash
cd job-tracker-extension
npm run build
```

### Step 2: Load in Browser

1. Open Chrome/Edge
2. Navigate to `chrome://extensions/` (or `edge://extensions/`)
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `dist` folder in the extension project

### Step 3: Test

1. Navigate to a LinkedIn job posting
2. Click the extension icon
3. Verify the scraped data appears correctly
4. Test both single job view and split view

### Step 4: Check Console for Errors

1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for any errors related to the extension
4. The extension logs messages like "🚀 Job Tracker Extension: Content script active"

---

## Debugging Tips

### If Salary Still Not Detected

1. Open the page with the job posting
2. Open Developer Tools Console
3. Run this to see what text the extension is searching:

   ```javascript
   document.body.innerText;
   ```

4. Look for the salary text manually
5. Check if it matches the regex patterns in the `findSalaryInText` function in [scrapers.ts](src/content/scrapers.ts)

### If Job Title Includes Company Name

- This suggests the title selector is picking the wrong element
- Check which selector is matching by adding console.log in the `getText` function
- The issue is likely that single job view uses a different structure

### If Location or Description Missing

- The selectors may need adjustment for that specific LinkedIn layout
- LinkedIn occasionally changes their class names
- Check the page HTML to see current class names being used

---

## Verification Checklist

Use this checklist to ensure all features work:

- [ ] **Single job view** - All fields populate correctly
- [ ] **Split job view** - All fields populate correctly (regression)
- [ ] **Salary with $ symbol** - Still detected (regression)
- [ ] **Salary with € symbol** - Still detected (regression)
- [ ] **Salary with £ symbol** - Still detected (regression)
- [ ] **Salary with "USD"** - Now detected (new feature)
- [ ] **Salary with "EUR"** - Now detected (new feature)
- [ ] **Salary with "GBP"** - Now detected (new feature)
- [ ] **Salary range format "X-Y"** - Detected with both symbols and codes
- [ ] **"Compensation:" keyword** - Recognized as salary indicator
- [ ] **"Pay:" keyword** - Recognized as salary indicator
- [ ] **"per hour" suffix** - Included in salary string
- [ ] **Jobs without salary** - Don't cause errors
- [ ] **Job description** - Full HTML content captured
- [ ] **Company name** - Not duplicated in job title

---

## Expected Regex Pattern Matches

### Pattern 1 (Prefix-based)

- ✅ "Compensation: USD 0-65 per hour"
- ✅ "Salary: €50k - €70k"
- ✅ "Pay: $100-150 per hour"
- ✅ "Rate: GBP 40-50/hr"

### Pattern 2 (Symbol Range)

- ✅ "$50,000 - $70,000"
- ✅ "€40k - €60k"
- ✅ "$100/hr - $150/hr"

### Pattern 3 (Single Symbol)

- ✅ "$50,000"
- ✅ "Up to $150,000"
- ✅ "€60k"

### Pattern 4 (Code Single)

- ✅ "Salary: 70,000 EUR"
- ✅ "Compensation: Up to 100,000 USD per year"

### Pattern 5 (Code Range) - NEW

- ✅ "USD 0-65 per hour"
- ✅ "EUR 50-70 per hour"
- ✅ "GBP 40-50/hour"
- ✅ "CHF 80-100 per hour"

---

## Rollback Instructions

If you need to revert these changes:

```bash
git checkout HEAD~1 src/content/scrapers.ts
npm run build
```

Then reload the extension in the browser.
