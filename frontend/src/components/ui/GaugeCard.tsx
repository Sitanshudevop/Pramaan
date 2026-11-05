import React from 'react';

export interface GaugeCardProps {
  value: number;
  max?: number;
  label: string;
  caption?: string;
  unit?: string;
  className?: string;
}

/**
 * Dark feature card with SVG burnt-orange gradient circular gauge arc and dotted outer ring.
 */
export const GaugeCard: React.FC<GaugeCardProps> = ({
  value,
  max = 100,
  label,
  caption,
  unit = '%',
  className = '',
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  // SVG Gauge calculations (semi-circle / 240 deg arc)
  const radius = 54;
  const strokeWidth = 9;
  const circumference = 2 * Math.PI * radius;
  // Use a 240-degree arc (dasharray: 2/3 of circumference)
  const arcLength = circumference * 0.72;
  const strokeDashoffset = arcLength - (arcLength * percentage) / 100;

  return (
    <div
      className={`p-5 rounded-card bg-surface-dark border border-white/10 text-[#F4F1EC] flex flex-col items-center justify-between shadow-2xl relative overflow-hidden ${className}`}
      role="img"
      aria-label={`${label}: ${value} of ${max}${unit}`}
    >
      {/* Decorative gradient corner glow */}
      <div
        className="absolute -top-12 -right-12 w-36 h-36 rounded-full pointer-events-none opacity-20"
        style={{
          background: 'radial-gradient(circle, var(--orange-500) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="w-full text-center">
        <span className="text-[11px] font-semibold tracking-wider text-orange-300 uppercase">
          {label}
        </span>
      </div>

      <div className="relative my-3 flex items-center justify-center">
        <svg width="150" height="110" viewBox="0 0 150 110" className="overflow-visible">
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFB27F" />
              <stop offset="50%" stopColor="#FF8A4C" />
              <stop offset="100%" stopColor="#F26B2A" />
            </linearGradient>
          </defs>

          {/* Dotted outer decorative ring */}
          <circle
            cx="75"
            cy="75"
            r="66"
            fill="none"
            stroke="rgba(255, 201, 163, 0.2)"
            strokeWidth="1.5"
            strokeDasharray="2 6"
            strokeLinecap="round"
          />

          {/* Background faint track */}
          <circle
            cx="75"
            cy="75"
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset="0"
            strokeLinecap="round"
            transform="rotate(140 75 75)"
          />

          {/* Active orange gradient arc */}
          <circle
            cx="75"
            cy="75"
            r={radius}
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(140 75 75)"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Centered Big Value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-5">
          <div className="flex items-baseline space-x-0.5">
            <span className="text-3xl font-extrabold tracking-tight font-tabular text-[#F4F1EC]">
              {Math.round(value)}
            </span>
            <span className="text-xs font-bold text-orange-300">{unit}</span>
          </div>
        </div>
      </div>

      {caption && (
        <div className="text-center">
          <p className="text-[11px] text-[#A39B91] leading-relaxed max-w-[200px]">{caption}</p>
        </div>
      )}
    </div>
  );
};

