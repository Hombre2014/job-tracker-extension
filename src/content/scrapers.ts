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
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (const script of scripts) {
    try {
      const data = JSON.parse(script.textContent || '');
      // Look for JobPosting type
      const jobData = Array.isArray(data) ? data.find(d => d['@type'] === 'JobPosting') : 
                      (data['@type'] === 'JobPosting' ? data : null);
      
      if (jobData) {
        return {
          jobTitle: jobData.title,
          company: jobData.hiringOrganization?.name || jobData.hiringOrganization,
          location: typeof jobData.jobLocation?.address === 'string' ? 
                    jobData.jobLocation.address : 
                    (jobData.jobLocation?.address?.addressLocality || ''),
          description: jobData.description?.replace(/<[^>]*>?/gm, ''), // Simple HTML strip
          postUrl: window.location.href,
        };
      }
    } catch (e) {
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
    document.querySelector(`meta[property="${name}"]`)?.getAttribute('content') ||
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
  return {
    jobTitle: document.querySelector('.job-details-jobs-unified-top-card__job-title')?.textContent?.trim() || 
              document.querySelector('h1')?.textContent?.trim(),
    company: document.querySelector('.job-details-jobs-unified-top-card__company-name')?.textContent?.trim() || 
             document.querySelector('.jobs-unified-top-card__company-name')?.textContent?.trim(),
    location: document.querySelector('.job-details-jobs-unified-top-card__bullet')?.textContent?.trim(),
  };
};

/**
 * Indeed Specific Fallback
 */
const scrapeIndeed = (): Partial<ScrapedJobInfo> => {
  return {
    jobTitle: document.querySelector('h1')?.textContent?.trim() || 
              document.querySelector('.jobsearch-JobInfoHeader-title')?.textContent?.trim(),
    company: document.querySelector('div[data-company-name="true"]')?.textContent?.trim() || 
             document.querySelector('.jobsearch-InlineCompanyRating div')?.textContent?.trim(),
    location: document.querySelector('[data-testid="jobsearch-JobInfoHeader-companyLocation"]')?.textContent?.trim(),
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

  // Merge (JSON-LD > Site Specific > Meta)
  return {
    jobTitle: siteData.jobTitle || ldData?.jobTitle || metaData.jobTitle || '',
    company: siteData.company || ldData?.company || metaData.company || '',
    location: siteData.location || ldData?.location || '',
    description: ldData?.description || '',
    postUrl: window.location.href,
    salary: ldData?.salary || '',
  };
};
