import React from 'react';

export interface ProgressPillProps {
  value: number; // 0 to 100
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Single lime-green pill with percentage indicator and subtle track.
 * Used for progress and completion tracking.
 */
export const ProgressPill: React.FC<ProgressPillProps> = ({
  value,
  label,
  size = 'md',
  className = '',
}) => {
  const clamped = Math.min(Math.max(Math.round(value), 0), 100);

  return (
    <div
      className={`inline-flex items-center space-x-2 rounded-pill bg-surface-2 border border-border px-3 py-1 text-xs ${className}`}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label || 'Progress percentage'}
    >
      {label && <span className="text-text-muted font-medium text-[11px]">{label}</span>}

      {/* Pill with lime fill */}
      <div className="flex items-center space-x-1.5">
        <div
          className={`h-2 rounded-pill bg-border/80 overflow-hidden relative ${
            size === 'sm' ? 'w-12' : 'w-16'
          }`}
        >
          <div
            className="h-full bg-lime rounded-pill transition-all duration-300"
            style={{ width: `${clamped}%` }}
          />
        </div>
        <span className="font-tabular font-bold text-text text-[11px] bg-lime text-on-lime px-1.5 py-0.2 rounded-pill">
          {clamped}%
        </span>
      </div>
    </div>
  );
};

