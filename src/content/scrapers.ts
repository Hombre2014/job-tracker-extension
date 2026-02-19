/**
 * Universal Scraper for Job Boards
 * Tries Schema.org, OpenGraph, and site-specific fallback logic.
 */

/**
 * Currency codes supported by salary patterns
 */
const CURRENCY_CODE_REGEX = /\b(?:USD|EUR|GBP|CHF|CAD|AUD|JPY|CNY)\b/i;

/**
 * Sanitize HTML to remove XSS vectors while preserving formatting
 */
const sanitizeHTML = (html: string): string => {
  return html
    .replace(/<script[^>]*>.*?<\/script>/gis, '') // Remove script tags
    .replace(/<iframe[^>]*>.*?<\/iframe>/gis, '') // Remove iframes
    .replace(/<object[^>]*>.*?<\/object>/gis, '') // Remove objects
    .replace(/<embed[^>]*>/gi, '') // Remove embeds
    .replace(/<form[^>]*>.*?<\/form>/gis, '') // Remove forms
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
    .replace(/on\w+\s*=\s*[^\s>]*/gi, '') // Remove unquoted event handlers
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .trim();
};

/**
 * Validate if a string is actually a salary (not job type like "Full-time")
 */
const isValidSalary = (str: string): boolean => {
  if (!str) return false;

  // Must contain currency symbol or numbers
  const hasCurrency = /[€$£¥]/.test(str);
  const hasNumbers = /\d/.test(str);

  // Reject common job type terms
  const jobTypeTerms =
    /^(full-time|part-time|contract|temporary|permanent|intern|internship|freelance|remote|hybrid|on-site)$/i;
  if (jobTypeTerms.test(str.trim())) {
    return false;
  }

  return hasCurrency || hasNumbers;
};

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

  /**
   * Check if extracted salary is promotional/invalid
   */
  const isPromotionalSalary = (salary: string): boolean => {
    if (!salary) return false;

    // Exclude zero-value salaries (€0, $0, £0, ¥0, €0/yr, $0.00, etc.)
    if (
      salary.match(
        /^[€$£¥]\s?0+(?:[.,]0+)?(?:\s*\/?\s*(?:yr|year|hour|hr|mo|month|per\s+\w+))?$/i,
      )
    )
      return true;

    // Exclude promotional phrases
    const promotionalPatterns = [
      /try\s+premium.*[€$£¥]\s?0/i,
      /premium\s+for\s+[€$£¥]\s?0/i,
      /free\s+trial.*[€$£¥]\s?0/i,
      /sign\s+up.*[€$£¥]\s?0/i,
    ];

    return promotionalPatterns.some((pattern) => pattern.test(salary));
  };

  // Pattern 1: Look for "Salary:" or "Compensation:" prefix
  const salaryPrefixRegex =
    /(?:salary|compensation|pay|rate)\s*:?\s*([^\n]+)/gi;
  const prefixMatch = salaryPrefixRegex.exec(text);
  if (prefixMatch && prefixMatch[1]) {
    const potentialSalary = prefixMatch[1];
    // Check for currency symbols OR currency codes
    if (
      potentialSalary.match(/[€$£¥]|\b(?:USD|EUR|GBP|CHF|CAD|AUD|JPY|CNY)\b/i)
    ) {
      let salaryText = potentialSalary.trim();
      // Split on common delimiters and labels that shouldn't be part of salary
      salaryText = salaryText
        .split(
          /\||·|•|Remote|Full-time|Part-time|Contract|Location:|About|Requirements|Experience|We are|We're|Join|The Company|Apply/i,
        )[0]
        .trim();

      if (!isPromotionalSalary(salaryText)) {
        return salaryText;
      }
    }
  }

  // Pattern 2: Look for salary ranges
  // Supports: €400 daily - €450 daily, $50k/year - $70k/year, ¥70,000 - ¥90,000, etc.
  const rangeRegex =
    /([€$£¥]\s?\d{1,3}(?:[.,]\d{3})*[kK]?(?:\s?\/?\s?(?:daily|day|weekly|week|monthly|month|yearly|year|hourly|hour|hr|yr|mo))?)\s*[-–—]\s*([€$£¥]\s?\d{1,3}(?:[.,]\d{3})*[kK]?(?:\s?\/?\s?(?:daily|day|weekly|week|monthly|month|yearly|year|hourly|hour|hr|yr|mo))?)/i;
  const rangeMatch = rangeRegex.exec(text);
  if (rangeMatch) {
    const salaryText = rangeMatch[0].trim();
    if (!isPromotionalSalary(salaryText)) {
      return salaryText;
    }
  }

  // Pattern 3: Look for single salary values
  // Supports: Up to €450 per day, $50k/year, €60,000 yearly, ¥50,000 per month, etc.
  const singleSalaryRegex =
    /(?:up to\s+)?([€$£¥]\s?\d{1,3}(?:[.,]\d{3})*[kK]?)\s*(?:(?:\/?\s?(?:daily|day|weekly|week|monthly|month|yearly|year|hourly|hour|hr|yr|mo))|(?:per\s+(?:day|week|month|year|hour))|(?:gross\/year)|gross|net)?/i;
  const singleMatch = singleSalaryRegex.exec(text);
  if (singleMatch) {
    const salaryText = singleMatch[0].trim();
    if (!isPromotionalSalary(salaryText)) {
      return salaryText;
    }
  }

  // Pattern 4: Currency code with single value (70,000 EUR or EUR 70,000)
  // Supports: Rate 70,000 EUR per year, Compensation 50000 USD yearly, etc.
  const currencyCodeRegex =
    /(?:salary|compensation|pay|rate)\s*:?\s*((?:up to\s+)?\d{1,3}(?:[.,]\d{3})*\s*(?:EUR|USD|GBP|CHF|CAD|AUD|JPY|CNY)\b(?:\s*(?:per|\/)\s*(?:day|week|month|year|hour|daily|weekly|monthly|yearly|hourly|hr|yr|mo))?)/i;
  const codeMatch = currencyCodeRegex.exec(text);
  if (codeMatch) {
    return codeMatch[1].trim();
  }

  // Pattern 5: Currency code BEFORE range (USD 0-65 per hour, EUR 50-70 per hour)
  // Supports: USD 400-450 daily, EUR 50-70 per day, etc.
  const currencyCodeRangeRegex =
    /\b(USD|EUR|GBP|CHF|CAD|AUD|JPY|CNY)\s+(\d{1,3}(?:[.,]\d{3})*(?:\.\d{2})?)\s*[-–—]\s*(\d{1,3}(?:[.,]\d{3})*(?:\.\d{2})?)\s*(?:per\s+(?:day|week|month|year|hour)|\/?\s*(?:daily|day|weekly|week|monthly|month|yearly|year|hourly|hour|hr|yr|mo))?/i;
  const codeRangeMatch = currencyCodeRangeRegex.exec(text);
  if (codeRangeMatch) {
    return codeRangeMatch[0].trim();
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
            const min = val.minValue || val.value;
            const max = val.maxValue;
            const currency = jobData.baseSalary.currency || '$';
            salary = max
              ? `${currency}${min} - ${currency}${max}`
              : `${currency}${min}`;
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
    'h1.top-card-layout__title', // Single job view
    'h1.t-24.t-bold.inline', // Single job view - specific class combo
    'h1.t-24', // Generic single job view
    'h2.t-24', // LinkedIn often uses h2 for titles in collections view
    'h1.topcard__title', // Older LinkedIn layout
  ]);

  const company = getText([
    '.job-details-jobs-unified-top-card__company-name',
    '.jobs-unified-top-card__company-name',
    '.jobs-unified-top-card__company-name a',
    '.job-details-jobs-unified-top-card__primary-description a:nth-of-type(1)',
    '.topcard__org-name-link',
    '.top-card-layout__card a.app-aware-link', // Single job view company link
    'a[data-test-app-aware-link][href*="/company/"]', // Single job view - company link with data attribute
    'a.topcard__org-name-link',
    'a[href*="/company/"]',
  ]);

  const locationRaw = getText([
    '.job-details-jobs-unified-top-card__bullet',
    '.jobs-unified-top-card__bullet',
    '.job-details-jobs-unified-top-card__primary-description span:nth-of-type(1)',
    '.top-card-layout__first-subline span:nth-of-type(1)', // Single job view
    '.top-card-layout__second-subline', // Alternative single job view
    '.jobs-unified-top-card__workplace-type',
    '.job-details-jobs-unified-top-card__primary-description',
    '.tvm__text--low-emphasis span:first-child',
    '.job-details-jobs-unified-top-card__primary-description-container span',
    '.topcard__flavor--bullet', // Older layout
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

  // Try to find salary in parent containers
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
        (text.includes('$') ||
          text.includes('£') ||
          text.includes('€') ||
          text.includes('¥') ||
          CURRENCY_CODE_REGEX.test(text)) &&
        text.match(/\d+/)
      ) {
        salary = findSalaryInText(text);
        if (salary) break;
      }
    }
  }

  // Try specific compensation-related selectors
  if (!salary) {
    const salarySelectors = [
      '.tvm__text.tvm__text--low-emphasis',
      '.artdeco-button .tvm__text',
      '.job-details-jobs-unified-top-card__job-insight--highlight',
      '.job-details-jobs-unified-top-card__job-insight',
      '.jobs-unified-top-card__job-insight--highlight',
      '.jobs-unified-top-card__job-insight',
      '.compensation__salary',
      '[data-test-id="compensation-range"]',
      '.top-card-layout__card .mt2', // Single job view insights
      '.top-card-layout__insight', // Single job view
    ];

    for (const selector of salarySelectors) {
      const elements = container.querySelectorAll(selector);
      for (const el of elements) {
        const text = el.textContent?.trim() || '';
        if (
          (text.includes('$') ||
            text.includes('£') ||
            text.includes('€') ||
            text.includes('¥') ||
            CURRENCY_CODE_REGEX.test(text)) &&
          text.match(/\d+/)
        ) {
          salary = findSalaryInText(text);
          if (salary) break;
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
      if (
        text.includes('$') ||
        text.includes('£') ||
        text.includes('€') ||
        text.includes('¥') ||
        CURRENCY_CODE_REGEX.test(text)
      ) {
        salary = findSalaryInText(text);
        if (salary) break;
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

  // Get HTML formatted description instead of plain text
  const getHTML = (selectors: string[]): string => {
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.innerHTML) return el.innerHTML;
    }
    return '';
  };

  const descriptionRaw = getHTML([
    '#job-details',
    '.jobs-description__content',
    '.jobs-box__html-content',
    '.show-more-less-html__markup',
    '.description__text', // Single job view
    'article.jobs-description__container', // Single job view - full article
  ]);

  // Clean up the HTML description
  const description = sanitizeHTML(descriptionRaw)
    .replace(/^<[^>]*>About the job<\/[^>]*>/i, '') // Remove 'About the job' header
    .trim();

  // If salary still not found, try extracting from description
  // IMPORTANT: Extract plain text from HTML before searching for salary patterns
  if (!salary && description) {
    // Create a temporary element to extract text content from HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = description;
    const plainTextDescription = tempDiv.textContent || tempDiv.innerText || '';

    // Search plain text (not HTML) for salary patterns
    // Try first 1500 characters, then full text if needed
    const descSnippet = plainTextDescription.substring(0, 1500);
    const foundInDesc = findSalaryInText(descSnippet);
    if (foundInDesc) {
      salary = foundInDesc;
    } else {
      // If still not found, search the entire plain text description as final fallback
      const foundInFullDesc = findSalaryInText(plainTextDescription);
      if (foundInFullDesc) {
        salary = foundInFullDesc;
      }
    }
  }

  // If location still not found, try extracting from description
  // LinkedIn sometimes puts location info inside the job description for single job view
  if (!location && description) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = description;
    const plainTextDescription = tempDiv.textContent || tempDiv.innerText || '';

    // Look for "Location:" pattern in description
    const locationMatch = /(?:location|where)\s*:\s*([^\n<]+)/i.exec(
      plainTextDescription,
    );
    if (locationMatch && locationMatch[1]) {
      let extractedLocation = locationMatch[1].trim();
      // Clean up - remove common trailing patterns
      extractedLocation = extractedLocation
        .split(/Compensation:|Role:|Salary:|Requirements:|Qualifications:/i)[0]
        .trim();
      if (extractedLocation.length > 0 && extractedLocation.length < 100) {
        location = extractedLocation;
      }
    }
  }

  return { jobTitle: title, company, location, description, salary };
};

/**
 * Indeed Specific Fallback
 */
const scrapeIndeed = (): Partial<ScrapedJobInfo> => {
  // Job Title - Try multiple selectors for Indeed's job title
  let title =
    document
      .querySelector('.jobsearch-JobInfoHeader-title span[title]')
      ?.getAttribute('title') ||
    document
      .querySelector('.jobsearch-JobInfoHeader-title span')
      ?.textContent?.trim() ||
    document
      .querySelector('.jobsearch-JobInfoHeader-title')
      ?.textContent?.trim() ||
    document.querySelector('h1.icl-u-xs-mb--xs')?.textContent?.trim() ||
    '';

  // Clean up title - remove common suffixes that aren't part of the actual job title
  if (title) {
    // Remove "- job post" suffix
    title = title.replace(/\s*-\s*job post\s*$/i, '').trim();

    // Remove search query patterns like "jobs in [location]"
    if (title.includes(' jobs in ') || title.includes(' job in ')) {
      // Try to find the actual job title in the card header
      const jobCard = document.querySelector(
        '.jobsearch-JobComponent-description',
      );
      if (jobCard) {
        const headerTitle =
          document
            .querySelector('h2.jobTitle span[title]')
            ?.getAttribute('title') ||
          document.querySelector('h2.jobTitle')?.textContent?.trim();
        if (headerTitle && !headerTitle.includes(' jobs in ')) {
          title = headerTitle.replace(/\s*-\s*job post\s*$/i, '').trim();
        }
      }
    }
  }

  const company =
    document
      .querySelector('div[data-company-name="true"]')
      ?.textContent?.trim() ||
    document
      .querySelector('.jobsearch-InlineCompanyRating div')
      ?.textContent?.trim() ||
    '';

  // Location - Enhanced selectors for different Indeed layouts
  let location = '';

  // Try direct selectors first
  const locationSelectors = [
    '[data-testid="jobsearch-JobInfoHeader-companyLocation"]',
    'div[data-testid="inlineHeader-companyLocation"]',
    '.jobsearch-JobInfoHeader-subtitle > div:last-child',
    '.jobsearch-CompanyInfoContainer > div:last-child',
  ];

  for (const selector of locationSelectors) {
    const element = document.querySelector(selector);
    if (element?.textContent?.trim()) {
      location = element.textContent.trim();
      break;
    }
  }

  // If no direct match, try extracting from header text with pattern matching
  if (!location) {
    const headerElement = document.querySelector('.jobsearch-JobInfoHeader');
    if (headerElement) {
      const headerText = headerElement.textContent || '';

      // Pattern 1: Remote variations (must come first to capture remote correctly)
      // Matches: "Remote", "Remote in USA", "Berlin, Germany (Remote)", "EU, Remote", etc.
      const remoteMatch = headerText.match(
        /\b((?:[A-Za-z\s]+,?\s*)?(?:Remote|Hybrid|Work from home)(?:\s+in\s+[A-Za-z\s,]+)?)\b/i,
      );
      if (remoteMatch) {
        location = remoteMatch[1].trim();
      }

      // Pattern 2: City, State ZIP (US format)
      if (!location) {
        const usLocationMatch = headerText.match(
          /([A-Za-z\s]+,\s*[A-Z]{2}\s*\d{5})/,
        );
        if (usLocationMatch) {
          location = usLocationMatch[1].trim();
        }
      }

      // Pattern 3: City, State (without ZIP)
      if (!location) {
        const stateLocationMatch = headerText.match(
          /([A-Za-z\s]+,\s*[A-Z]{2})(?:\s|$)/,
        );
        if (stateLocationMatch) {
          location = stateLocationMatch[1].trim();
        }
      }

      // Pattern 4: City, Country (international format)
      if (!location) {
        const intlLocationMatch = headerText.match(
          /([A-Za-z\s]+,\s*[A-Za-z\s]+)(?:\s|$)/,
        );
        if (intlLocationMatch) {
          const candidate = intlLocationMatch[1].trim();
          // Make sure it's not company name or job title
          if (!candidate.includes(company) && candidate.length < 50) {
            location = candidate;
          }
        }
      }
    }
  }

  // Salary on Indeed - Enhanced selectors
  let salary =
    document
      .querySelector('#salaryInfoAndJobType .salary-snippet-container')
      ?.textContent?.trim() ||
    document.querySelector('#salaryInfoAndJobType')?.textContent?.trim() ||
    document
      .querySelector('.jobsearch-JobMetadataHeader-item')
      ?.textContent?.trim() ||
    document
      .querySelector('[data-testid="jobsearch-JobInfoHeader-salary"]')
      ?.textContent?.trim() ||
    '';

  // Try to find salary in the snippet below company/location
  if (!salary) {
    const snippetContainer = document.querySelector(
      '.jobsearch-JobInfoHeader-subtitle',
    );
    if (snippetContainer) {
      const snippetText = snippetContainer.textContent || '';
      const foundSalary = findSalaryInText(snippetText);
      if (foundSalary) {
        salary = foundSalary;
      }
    }
  }

  // Fallback to text scanning if specific selectors fail
  if (!salary) {
    const headerText =
      document.querySelector('.jobsearch-JobInfoHeader')?.textContent || '';
    salary = findSalaryInText(headerText);
  }

  // Validate salary - reject if it's actually a job type term
  if (salary && !isValidSalary(salary)) {
    salary = '';
  }

  // Job Description - Extract HTML formatted description
  let description =
    document.querySelector('#jobDescriptionText')?.innerHTML ||
    document.querySelector('.jobsearch-JobComponent-description')?.innerHTML ||
    document.querySelector('[id*="jobDescription"]')?.innerHTML ||
    '';

  // Clean up the HTML description if found
  if (description) {
    description = sanitizeHTML(description)
      .replace(/^<[^>]*>Full job description<\/[^>]*>/i, '') // Remove 'Full job description' heading
      .trim();
  }

  return { jobTitle: title, company, location, salary, description };
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
