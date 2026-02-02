import { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';

import { cn } from '../lib/utils';

interface CompanyLogoProps {
  domain: string;
  companyName: string;
  logoUrl?: string | null; // Keep for compatibility but won't use
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: { width: 24, height: 24, iconSize: 16 },
  md: { width: 40, height: 40, iconSize: 24 },
  lg: { width: 64, height: 64, iconSize: 40 },
};

export const CompanyLogo = ({
  domain,
  companyName,
  size = 'sm',
  className,
}: CompanyLogoProps) => {
  const [hasError, setHasError] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { width, height, iconSize } = sizeMap[size];

  // Extract domain from URL if needed
  const cleanDomain = domain
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0];

  // Fetch logo via background script
  useEffect(() => {
    if (!cleanDomain) {
      setIsLoading(false);
      return;
    }

    setHasError(false);
    setLogoDataUrl(null);
    setIsLoading(true);

    chrome.runtime.sendMessage(
      { action: 'fetchLogo', domain: cleanDomain },
      (response) => {
        setIsLoading(false);
        if (response?.success && response.dataUrl) {
          setLogoDataUrl(response.dataUrl);
        } else {
          setHasError(true);
        }
      },
    );
  }, [cleanDomain]);

  if (hasError || !cleanDomain) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded bg-slate-100',
          className,
        )}
        style={{ width, height }}
        title={companyName}
      >
        <Building2 size={iconSize} className="text-slate-400" />
      </div>
    );
  }

  if (isLoading || !logoDataUrl) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded bg-slate-100',
          className,
        )}
        style={{ width, height }}
        title={companyName}
      />
    );
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded flex items-center justify-center',
        className,
      )}
      style={{ width, height }}
    >
      <img
        src={logoDataUrl}
        alt={`${companyName} logo`}
        width={width}
        height={height}
        className="object-contain"
        onError={() => setHasError(true)}
      />
    </div>
  );
};

export default CompanyLogo;
