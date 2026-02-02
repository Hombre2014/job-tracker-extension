import { Check, Loader2, Building2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { CompanyLogo } from './CompanyLogo';
import { useCompanyAutocomplete } from '../hooks/useCompanyAutocomplete';
import { type CompanySuggestion } from '../lib/services';
import { cn } from '../lib/utils';

export interface CompanyAutocompleteProps {
  value: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onCompanySelect: (company: CompanySuggestion) => void;
  selectedCompany?: CompanySuggestion | null;
}

export const CompanyAutocomplete = (props: CompanyAutocompleteProps) => {
  const {
    value,
    onChange,
    className,
    onCompanySelect,
    disabled = false,
    placeholder = 'Search for a company...',
    selectedCompany = null,
  } = props;
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [userInteracted, setUserInteracted] = useState(false);

  const { suggestions, isLoading, error } = useCompanyAutocomplete(value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setUserInteracted(true);
    setIsOpen(true);
    setSelectedIndex(-1);
  };

  const handleSelectCompany = (company: CompanySuggestion) => {
    onChange(company.name);
    onCompanySelect(company);
    setIsOpen(false);
    setSelectedIndex(-1);
    setUserInteracted(false);
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev,
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectCompany(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (userInteracted && suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all',
            selectedCompany?.domain ? 'pr-10' : '',
          )}
        />
        {selectedCompany?.domain && !isOpen && !isLoading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
            <CompanyLogo
              domain={selectedCompany.domain}
              companyName={selectedCompany.name}
              logoUrl={selectedCompany.logo}
              size="sm"
            />
          </span>
        )}
        {!selectedCompany?.domain && !isOpen && !isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300">
            <Building2 size={16} strokeWidth={2.5} />
          </div>
        )}
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          </div>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-100 bg-white shadow-xl max-h-55 overflow-y-auto">
          <ul className="py-1">
            {suggestions.map((company, index) => (
              <li key={`${company.domain}-${index}`}>
                <button
                  type="button"
                  onClick={() => handleSelectCompany(company)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 w-full text-left cursor-pointer transition-colors outline-none',
                    'hover:bg-slate-50',
                    selectedIndex === index && 'bg-blue-50 text-blue-700',
                  )}
                >
                  <CompanyLogo
                    domain={company.domain}
                    companyName={company.name}
                    logoUrl={company.logo}
                    size="sm"
                  />
                  <div className="flex-1 overflow-hidden">
                    <div className="font-semibold text-[13px] truncate">
                      {company.name}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate font-medium">
                      {company.domain}
                    </div>
                  </div>
                  {selectedIndex === index && (
                    <Check className="h-3.5 w-3.5 text-blue-600" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isOpen &&
        !isLoading &&
        value.length >= 2 &&
        suggestions.length === 0 &&
        !error && (
          <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-100 bg-white shadow-xl">
            <div className="px-3 py-4 text-center text-xs text-slate-400 font-medium">
              No companies found
            </div>
          </div>
        )}
    </div>
  );
};

export default CompanyAutocomplete;
