import React from 'react';
import { Search, X } from 'lucide-react';

export interface SearchPillProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
}

/**
 * Fully rounded pill search input with magnifying icon and clear button.
 */
export const SearchPill: React.FC<SearchPillProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  ariaLabel = 'Search',
  className = '',
}) => {
  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <Search className="w-3.5 h-3.5 text-text-muted absolute left-3.5 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="w-full rounded-pill bg-surface border border-border text-text placeholder:text-text-muted/70 text-xs pl-9 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium hover:border-text-muted/50 transition-colors"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2.5 p-0.5 rounded-full text-text-muted hover:text-text focus:outline-none"
          aria-label="Clear search"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};
