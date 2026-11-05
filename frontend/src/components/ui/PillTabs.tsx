import React, { useRef } from 'react';

export interface PillTabItem {
  id: string;
  label: string;
  count?: number;
}

export interface PillTabsProps {
  tabs: PillTabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * Tab row inside a rounded pill container with arrow-key keyboard navigation.
 * Active tab is a solid pill (black in light mode, off-white in dark mode).
 */
export const PillTabs: React.FC<PillTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
  size = 'md',
}) => {
  const tabListRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = (index + 1) % tabs.length;
      const nextTab = tabs[nextIndex];
      if (nextTab) onChange(nextTab.id);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = (index - 1 + tabs.length) % tabs.length;
      const prevTab = tabs[prevIndex];
      if (prevTab) onChange(prevTab.id);
    }
  };

  const padClass = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-xs';

  return (
    <div
      ref={tabListRef}
      role="tablist"
      aria-label="Content views"
      className={`inline-flex items-center p-1 rounded-pill bg-surface-2 ${className}`}
    >
      {tabs.map((tab, idx) => {
        const isActive = tab.id === activeTab;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={`rounded-pill transition-all font-medium flex items-center space-x-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${padClass} ${
              isActive
                ? 'bg-text text-bg shadow-sm font-semibold'
                : 'text-text-muted hover:text-text hover:bg-surface/50'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-pill font-tabular ${
                  isActive ? 'bg-bg text-text opacity-90' : 'bg-surface text-text-muted'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

