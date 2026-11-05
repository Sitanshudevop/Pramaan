import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface PillSelectOption {
  value: string;
  label: string;
}

export interface PillSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (val: string) => void;
  options: PillSelectOption[];
  ariaLabel?: string;
  className?: string;
  icon?: React.ReactNode;
}

/**
 * Fully rounded pill dropdown select control.
 */
export const PillSelect: React.FC<PillSelectProps> = ({
  value,
  onChange,
  options,
  ariaLabel,
  className = '',
  icon,
  disabled,
  ...rest
}) => {
  return (
    <div className={`relative inline-flex items-center ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      {icon && (
        <span className="absolute left-3 pointer-events-none text-text-muted z-10">{icon}</span>
      )}
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        className={`appearance-none rounded-pill bg-surface border border-border text-text text-xs py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer font-medium hover:border-text-muted/50 transition-colors disabled:cursor-not-allowed ${
          icon ? 'pl-8 pr-7' : 'pl-3.5 pr-7'
        }`}
        {...rest}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-surface text-text">
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="w-3.5 h-3.5 text-text-muted absolute right-2.5 pointer-events-none" />
    </div>
  );
};

