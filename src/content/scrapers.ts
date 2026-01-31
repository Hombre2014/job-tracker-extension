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

  // Salary capture (LinkedIn often hides this in insights or specific spans)
  const salary = getText([
    '.job-details-jobs-unified-top-card__job-insight--highlight',
    '.job-details-jobs-unified-top-card__job-insight',
    '.jobs-unified-top-card__job-insight',
  ]);

  const descriptionRaw = getText([
    '#job-details',
    '.jobs-description__content',
    '.jobs-box__html-content',
    '.show-more-less-html__markup',
  ]);

  const description = descriptionRaw.replace(/^About the job\s*/i, '').trim();

  return { jobTitle: title, company, location, description, salary };
};

/**
 * Indeed Specific Fallback
 */
const scrapeIndeed = (): Partial<ScrapedJobInfo> => {
  return {
    jobTitle:
      document.querySelector('h1')?.textContent?.trim() ||
      document
        .querySelector('.jobsearch-JobInfoHeader-title')
        ?.textContent?.trim(),
    company:
      document
        .querySelector('div[data-company-name="true"]')
        ?.textContent?.trim() ||
      document
        .querySelector('.jobsearch-InlineCompanyRating div')
        ?.textContent?.trim(),
    location: document
      .querySelector('[data-testid="jobsearch-JobInfoHeader-companyLocation"]')
      ?.textContent?.trim(),
  };
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

  console.log('Job Tracker Extension: Scrape result:', result);
  return result;
};
