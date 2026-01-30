import { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';
import { config } from '../lib/config';
import { cn } from '../lib/utils';

interface CompanyLogoProps {
  domain: string;
  companyName: string;
  logoUrl?: string | null;
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
  logoUrl: manualLogoUrl,
  size = 'sm',
  className,
}: CompanyLogoProps) => {
  const [hasError, setHasError] = useState(false);
  const { width, height, iconSize } = sizeMap[size];

  // Extract domain from URL if needed
  const cleanDomain = domain
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0];

  // Reset error state when domain changes
  useEffect(() => {
    setHasError(false);
  }, [cleanDomain]);

  const logoUrl = manualLogoUrl || `https://cdn.brandfetch.io/${cleanDomain}?c=${config.brandfetch.clientId}`;

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

  return (
    <div
      className={cn('relative overflow-hidden rounded flex items-center justify-center', className)}
      style={{ width, height }}
    >
      <img
        src={logoUrl}
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
