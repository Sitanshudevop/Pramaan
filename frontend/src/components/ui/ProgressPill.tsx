import React from 'react';

export interface ProgressPillProps {
  step?: number;
  totalSteps?: number;
  value?: number; // legacy fallback
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Factual lifecycle progress pill with guaranteed high-contrast styling.
 * Uses --on-lime (#14110F) for text on lime fill, and --text outside.
 */
export const ProgressPill: React.FC<ProgressPillProps> = ({
  step,
  totalSteps = 7,
  value,
  label,
  size = 'md',
  className = '',
}) => {
  const currentStep =
    step ?? (value !== undefined ? Math.max(1, Math.min(Math.round((value / 100) * totalSteps), totalSteps)) : 1);
  const percent = Math.min(Math.max(Math.round((currentStep / totalSteps) * 100), 0), 100);

  return (
    <div
      className={`inline-flex items-center space-x-2.5 rounded-pill bg-surface-2 border border-border px-3 py-1 text-xs select-none ${className}`}
      role="progressbar"
      aria-valuenow={currentStep}
      aria-valuemin={1}
      aria-valuemax={totalSteps}
      aria-label={label ? `${label} - Step ${currentStep} of ${totalSteps}` : `Step ${currentStep} of ${totalSteps}`}
    >
      {/* Step badge with guaranteed high-contrast on-lime (12.3:1 ratio) */}
      <span className="font-tabular font-bold text-[11px] bg-lime text-on-lime px-2 py-0.5 rounded-pill shadow-xs">
        Step {currentStep} of {totalSteps}
      </span>

      {/* Pill with lime fill on subtle track */}
      <div
        className={`h-2 rounded-pill bg-border overflow-hidden relative ${
          size === 'sm' ? 'w-12' : 'w-16'
        }`}
      >
        <div
          className="h-full bg-lime rounded-pill transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Status name with full text contrast */}
      {label && <span className="font-semibold text-text text-[11px]">{label}</span>}
    </div>
  );
};


