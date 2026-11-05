import React, { useState } from 'react';

export interface BarChartItem {
  label: string;
  value: number;
}

export interface BarChartProps {
  data: BarChartItem[];
  max?: number;
  height?: number;
  className?: string;
  unit?: string;
}

/**
 * Calm bar chart with vertical orange gradient bars fading toward the base.
 * Includes hover tooltips and an accessible visually hidden data table.
 */
export const BarChart: React.FC<BarChartProps> = ({
  data,
  max,
  height = 140,
  className = '',
  unit = '',
}) => {
  const [activeItem, setActiveItem] = useState<BarChartItem | null>(null);

  const calculatedMax = max ?? Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Visually hidden accessible data table */}
      <table className="sr-only">
        <caption>Chart data for {data.map((d) => d.label).join(', ')}</caption>
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d, i) => (
            <tr key={i}>
              <td>{d.label}</td>
              <td>{d.value} {unit}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Visual Chart Bars */}
      <div
        className="flex items-end justify-between gap-2 pt-6 relative"
        style={{ height }}
        aria-hidden="true"
      >
        {data.map((item, index) => {
          const heightPercent = Math.min(Math.max((item.value / calculatedMax) * 100, 8), 100);
          const isHovered = activeItem?.label === item.label;

          return (
            <div
              key={index}
              className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
              onMouseEnter={() => setActiveItem(item)}
              onMouseLeave={() => setActiveItem(null)}
              onFocus={() => setActiveItem(item)}
              onBlur={() => setActiveItem(null)}
              tabIndex={0}
              role="presentation"
            >
              {/* Tooltip on hover/focus */}
              {isHovered && (
                <div className="absolute -top-7 px-2 py-0.5 rounded-pill bg-surface-dark text-[#F4F1EC] text-[10px] font-semibold whitespace-nowrap z-20 shadow-md">
                  {item.value} {unit}
                </div>
              )}

              {/* Bar with gradient fading to base */}
              <div
                className={`w-full max-w-[32px] rounded-t-lg rounded-b-sm transition-all duration-300 ${
                  isHovered ? 'scale-y-[1.03] brightness-110 shadow-sm' : 'opacity-90'
                }`}
                style={{
                  height: `${heightPercent}%`,
                  background: 'var(--grad-bar)',
                }}
              />

              {/* Label */}
              <span className="text-[10px] font-medium text-text-muted mt-2 truncate w-full text-center">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

