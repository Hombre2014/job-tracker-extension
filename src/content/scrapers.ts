/**
 * Universal Scraper for Job Boards
 * Tries Schema.org, OpenGraph, and site-specific fallback logic.
 */

export interface ScrapedJobInfo {
  company: string;
  jobTitle: string;
  location?: string;
  description?: string;
  postUrl?: string;
  salary?: string;
}

/**
 * Heuristic to find salary-like strings in a block of text
 */
const findSalaryInText = (text: string): string => {
  if (!text) return '';

  // Pattern 1: Look for "Salary:" or "Compensation:" followed by salary info
  // Examples: "Salary: up to €130,000 gross/year", "Compensation: $100k - $150k"
  const salaryPrefixRegex = /(?:salary|compensation)\s*:?\s*([^\n]+)/gi;
  const prefixMatch = salaryPrefixRegex.exec(text);
  if (prefixMatch && prefixMatch[1]) {
    const potentialSalary = prefixMatch[1];
    // Check if it contains currency
    if (potentialSalary.match(/[€$£]/)) {
      let salaryText = potentialSalary.trim();
      // Clean up - remove any trailing text that's not part of salary
      salaryText = salaryText
        .split(
          /\||·|•|Remote|Full-time|Part-time|Contract|We are|We're|Join|The /i,
        )[0]
        .trim();
      return salaryText;
    }
  }

  // Pattern 2: Look for salary ranges first (most complete format)
  // Examples: €40K/yr - €55K/yr, $100,000 - $150,000
  const rangeRegex =
    /([€$£]\s?\d{1,3}(?:[.,]\d{3})*[kK]?(?:\s?\/\s?(?:yr|year|hour|hr|mo|month))?)\s*[-–—]\s*([€$£]\s?\d{1,3}(?:[.,]\d{3})*[kK]?(?:\s?\/\s?(?:yr|year|hour|hr|mo|month))?)/i;
  const rangeMatch = rangeRegex.exec(text);
  if (rangeMatch) {
    return rangeMatch[0].trim();
  }

  // Pattern 3: Look for single salary values with descriptors
  // Examples: up to €130,000 gross/year, $100k/yr
  const singleSalaryRegex =
    /(?:up to\s+)?([€$£]\s?\d{1,3}(?:[.,]\d{3})*[kK]?)\s*(?:(?:\/\s?(?:yr|year|hour|hr|mo|month))|(?:per\s+(?:year|hour|month))|(?:gross\/year)|gross|net)?/i;
  const singleMatch = singleSalaryRegex.exec(text);
  if (singleMatch) {
    return singleMatch[0].trim();
  }

  return '';
};

/**
 * Extracts data from Schema.org JSON-LD
 */
const fromJsonLd = (): Partial<ScrapedJobInfo> | null => {
  const scripts = document.querySelectorAll(
    'script[type="application/ld+json"]',
  );
  for (const script of scripts) {
    try {
      const data = JSON.parse(script.textContent || '');
      // Look for JobPosting type
      const jobData = Array.isArray(data)
        ? data.find((d) => d['@type'] === 'JobPosting')
        : data['@type'] === 'JobPosting'
          ? data
          : null;

      if (jobData) {
        let salary = '';
        if (jobData.baseSalary) {
          const val = jobData.baseSalary.value;
          if (typeof val === 'number') {
            salary = `${jobData.baseSalary.currency || '$'}${val}`;
          } else if (typeof val === 'object') {
            salary = `${jobData.baseSalary.currency || '$'}${val.minValue || val.value} - ${val.maxValue || ''}`;
          }
        }

        return {
          jobTitle: jobData.title,
          company:
            jobData.hiringOrganization?.name || jobData.hiringOrganization,
          location:
            typeof jobData.jobLocation?.address === 'string'
              ? jobData.jobLocation.address
              : jobData.jobLocation?.address?.addressLocality || '',
          description:
            typeof jobData.description === 'string'
              ? jobData.description.replace(/<[^>]*>?/gm, '')
              : '', // Support object descriptions if needed later
          postUrl: window.location.href,
          salary: salary.trim(),
        };
      }
    } catch {
      // Ignore parse errors
    }
  }
  return null;
};

/**
 * Extracts data from Open Graph / Meta tags
 */
const fromMetaTags = (): Partial<ScrapedJobInfo> => {
  const getMeta = (name: string) =>
    document
      .querySelector(`meta[property="${name}"]`)
      ?.getAttribute('content') ||
    document.querySelector(`meta[name="${name}"]`)?.getAttribute('content');

  return {
    jobTitle: getMeta('og:title') || document.title,
    company: getMeta('og:site_name') || '',
    postUrl: getMeta('og:url') || window.location.href,
  };
};

/**
 * LinkedIn Specific Fallback
 */
const scrapeLinkedIn = (): Partial<ScrapedJobInfo> => {
  // 1. Find the main job details container (avoids sidebars/alerts)
  const container =
    document.querySelector('[data-view-name="job-details"]') ||
    document.querySelector('.jobs-search__job-details--container') ||
    document.querySelector('main#main') ||
    document;

  const getText = (
    selectors: string[],
    root: Element | Document = container,
  ) => {
    for (const selector of selectors) {
      const el = root.querySelector(selector);
      if (el && el.textContent?.trim()) return el.textContent.trim();
    }
    return '';
  };

  const title = getText([
    '.job-details-jobs-unified-top-card__job-title',
    '.jobs-unified-top-card__job-title',
    'h2.t-24', // LinkedIn often uses h2 for titles in collections view
    'h1.t-24',
    'h1',
    'h2',
  ]);

  const company = getText([
    '.job-details-jobs-unified-top-card__company-name',
    '.jobs-unified-top-card__company-name',
    '.jobs-unified-top-card__company-name a',
    '.job-details-jobs-unified-top-card__primary-description a:nth-of-type(1)',
    '.topcard__org-name-link',
    'a[href*="/company/"]',
  ]);

  const locationRaw = getText([
    '.job-details-jobs-unified-top-card__bullet',
    '.jobs-unified-top-card__bullet',
    '.job-details-jobs-unified-top-card__primary-description span:nth-of-type(1)',
    '.top-card-layout__first-subline span:nth-of-type(1)',
    '.jobs-unified-top-card__workplace-type',
    '.job-details-jobs-unified-top-card__primary-description',
    '.tvm__text--low-emphasis span:first-child',
    '.job-details-jobs-unified-top-card__primary-description-container span',
  ]);

  let location = locationRaw;
  if (location && location.includes('·')) {
    location = location.split('·')[0].trim();
  }

  if (!location) {
    const primaryDesc = getText([
      '.job-details-jobs-unified-top-card__primary-description',
      '.top-card-layout__first-subline',
    ]);
    if (primaryDesc) {
      location = primaryDesc.split('·')[0].trim();
    }
  }

  // Salary capture - LinkedIn shows salary in multiple possible locations
  let salary = '';

  // Try to find salary in parent containers that might have the complete range
  const salaryContainerSelectors = [
    '.job-details-jobs-unified-top-card__job-insight-view-model-secondary',
    '.job-details-jobs-unified-top-card__job-insight--container',
    '.jobs-unified-top-card__job-insight-view-model-container',
  ];

  for (const selector of salaryContainerSelectors) {
    const element = container.querySelector(selector);
    if (element) {
      const text = element.textContent?.trim() || '';
      if (
        (text.includes('$') || text.includes('£') || text.includes('€')) &&
        text.match(/\d+/)
      ) {
        // Use findSalaryInText to extract just the salary part
        const found = findSalaryInText(text);
        if (found) {
          salary = found;
          break;
        }
      }
    }
  }

  // Try specific compensation-related selectors
  if (!salary) {
    const salarySelectors = [
      '.job-details-jobs-unified-top-card__job-insight--highlight',
      '.job-details-jobs-unified-top-card__job-insight',
      '.jobs-unified-top-card__job-insight--highlight',
      '.jobs-unified-top-card__job-insight',
      '.compensation__salary',
      '[data-test-id="compensation-range"]',
    ];

    for (const selector of salarySelectors) {
      const elements = container.querySelectorAll(selector);
      for (const el of elements) {
        const text = el.textContent?.trim() || '';
        // Check if text contains currency and typical salary indicators
        if (
          (text.includes('$') || text.includes('£') || text.includes('€')) &&
          text.match(/\d+/)
        ) {
          // Check if parent has more complete info
          const parentText = el.parentElement?.textContent?.trim() || '';
          if (
            parentText.includes('-') ||
            parentText.includes('–') ||
            parentText.includes('—')
          ) {
            // Parent might have the full range, use findSalaryInText
            const found = findSalaryInText(parentText);
            if (found) {
              salary = found;
              break;
            }
          }
          salary = text;
          break;
        }
      }
      if (salary) break;
    }
  }

  // Fallback to searching all job insights
  if (!salary) {
    const insightEls = container.querySelectorAll(
      '.job-details-jobs-unified-top-card__job-insight, .jobs-unified-top-card__job-insight',
    );
    for (const el of insightEls) {
      const text = el.textContent?.trim() || '';
      if (text.includes('$') || text.includes('£') || text.includes('€')) {
        salary = text;
        break;
      }
    }
  }

  // Fallback to searching top card text if insight classes didn't work
  if (!salary) {
    const topCardText =
      container.querySelector('.jobs-unified-top-card')?.textContent || '';
    salary = findSalaryInText(topCardText);
  }

  // Final fallback: search entire container for salary patterns
  if (!salary) {
    const allText = container.textContent || '';
    const found = findSalaryInText(allText);
    if (found) salary = found;
  }

  const descriptionRaw = getText([
    '#job-details',
    '.jobs-description__content',
    '.jobs-box__html-content',
    '.show-more-less-html__markup',
  ]);

  const description = descriptionRaw.replace(/^About the job\s*/i, '').trim();

  // If salary still not found, try extracting from description (first 500 chars)
  if (!salary && description) {
    const descSnippet = description.substring(0, 500);
    const foundInDesc = findSalaryInText(descSnippet);
    if (foundInDesc) {
      salary = foundInDesc;
    }
  }

  return { jobTitle: title, company, location, description, salary };
};

/**
 * Indeed Specific Fallback
 */
const scrapeIndeed = (): Partial<ScrapedJobInfo> => {
  const title =
    document.querySelector('h1')?.textContent?.trim() ||
    document
      .querySelector('.jobsearch-JobInfoHeader-title')
      ?.textContent?.trim() ||
    '';

  const company =
    document
      .querySelector('div[data-company-name="true"]')
      ?.textContent?.trim() ||
    document
      .querySelector('.jobsearch-InlineCompanyRating div')
      ?.textContent?.trim() ||
    '';

  const location = document
    .querySelector('[data-testid="jobsearch-JobInfoHeader-companyLocation"]')
    ?.textContent?.trim();

  // Salary on Indeed
  let salary =
    document
      .querySelector('#salaryInfoAndJobType .salary-snippet-container')
      ?.textContent?.trim() ||
    document
      .querySelector('.jobsearch-JobMetadataHeader-item')
      ?.textContent?.trim() ||
    document
      .querySelector('[data-testid="jobsearch-JobInfoHeader-salary"]')
      ?.textContent?.trim() ||
    '';

  // Fallback to text scanning if specific selectors fail
  if (!salary) {
    const headerText =
      document.querySelector('.jobsearch-JobInfoHeader-snippet-container')
        ?.textContent || '';
    salary = findSalaryInText(headerText);
  }

  return { jobTitle: title, company, location, salary };
};

export const getScrapedInfo = (): ScrapedJobInfo => {
  const url = window.location.href;

  // 1. Try JSON-LD (Most reliable if present)
  const ldData = fromJsonLd();

  // 2. Try Site Specific (Overrides JSON-LD if it has better detail)
  let siteData: Partial<ScrapedJobInfo> = {};
  if (url.includes('linkedin.com')) {
    siteData = scrapeLinkedIn();
  } else if (url.includes('indeed.com')) {
    siteData = scrapeIndeed();
  }

  // 3. Try Meta tags
  const metaData = fromMetaTags();

  // Merge (Site Specific > JSON-LD > Meta)
  const result = {
    jobTitle: siteData.jobTitle || ldData?.jobTitle || metaData.jobTitle || '',
    company: siteData.company || ldData?.company || metaData.company || '',
    location: siteData.location || ldData?.location || '',
    description: siteData.description || ldData?.description || '',
    postUrl: window.location.href,
    salary: siteData.salary || ldData?.salary || '',
  };

  return result;
};
