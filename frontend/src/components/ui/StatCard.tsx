import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export interface StatDelta {
  direction: 'up' | 'down' | 'neutral';
  label: string;
}

export interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  delta?: StatDelta;
  hint?: string;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Clean floating white card displaying big confident numerals and metrics.
 */
export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  unit,
  delta,
  hint,
  children,
  className = '',
}) => {
  return (
    <div
      className={`p-5 rounded-card border border-border bg-surface shadow-floating flex flex-col space-y-3 transition-all ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-semibold text-text-muted tracking-wide uppercase">
          {label}
        </span>
        {delta && (
          <span
            className={`inline-flex items-center space-x-0.5 px-2 py-0.5 rounded-pill text-[11px] font-semibold ${
              delta.direction === 'up'
                ? 'bg-lime text-on-lime font-bold shadow-xs'
                : delta.direction === 'down'
                ? 'bg-danger/10 text-danger border border-danger/20'
                : 'bg-surface-2 text-text-muted'
            }`}
          >
            {delta.direction === 'up' && <ArrowUpRight className="w-3 h-3" />}
            {delta.direction === 'down' && <ArrowDownRight className="w-3 h-3" />}
            {delta.direction === 'neutral' && <Minus className="w-3 h-3" />}
            <span>{delta.label}</span>
          </span>
        )}
      </div>

      <div className="flex items-baseline space-x-1">
        <span className="text-3xl sm:text-4xl font-bold tracking-tight text-text font-tabular">
          {value}
        </span>
        {unit && (
          <span className="text-sm sm:text-base font-semibold text-text-muted self-start mt-1">
            {unit}
          </span>
        )}
      </div>

      {(hint || children) && (
        <div className="space-y-2">
          {hint && <p className="text-[11px] text-text-muted leading-relaxed">{hint}</p>}
          {children}
        </div>
      )}
    </div>
  );
};

