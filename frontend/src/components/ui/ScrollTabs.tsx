import React, { useRef, useEffect } from 'react';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface ScrollTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
  ariaLabel?: string;
}

export const ScrollTabs: React.FC<ScrollTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
  ariaLabel = 'Navigation Tabs',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll active tab into view when activeTab changes
  useEffect(() => {
    if (activeTabRef.current && containerRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeTab]);

  // Keyboard arrow navigation
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex = index;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextIndex = (index + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = tabs.length - 1;
    }

    const targetTab = tabs[nextIndex];
    if (nextIndex !== index && targetTab) {
      onChange(targetTab.id);
      const nextBtn = containerRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[nextIndex];
      nextBtn?.focus();
    }
  };

  return (
    <div className={`relative max-w-full ${className}`}>
      {/* Scrollable Container with pill background */}
      <div
        ref={containerRef}
        role="tablist"
        aria-label={ariaLabel}
        className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar scroll-smooth p-1 bg-surface-2 rounded-pill border border-border select-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {tabs.map((tab, idx) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              ref={isActive ? activeTabRef : null}
              role="tab"
              type="button"
              id={`tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-pill text-xs font-semibold whitespace-nowrap transition-all duration-150 touch-target shrink-0 ${
                isActive
                  ? 'bg-surface-dark text-white dark:bg-orange-500 dark:text-on-orange shadow-xs'
                  : 'text-text-muted hover:text-text hover:bg-surface/60'
              }`}
            >
              {tab.icon && <span className="w-3.5 h-3.5 shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-pill ${
                    isActive
                      ? 'bg-white/20 text-white dark:bg-black/20 dark:text-on-orange'
                      : 'bg-surface-2 border border-border text-text-muted'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
