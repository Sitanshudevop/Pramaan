import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface AccordionItemProps {
  id: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
  className?: string;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({
  id,
  title,
  subtitle,
  badge,
  children,
  defaultOpen = false,
  isOpen: controlledOpen,
  onToggle,
  className = '',
}) => {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isExpanded = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalOpen(!internalOpen);
    }
  };

  return (
    <div className={`border border-border rounded-card bg-surface overflow-hidden ${className}`}>
      <h3>
        <button
          type="button"
          id={`accordion-btn-${id}`}
          aria-expanded={isExpanded}
          aria-controls={`accordion-panel-${id}`}
          onClick={handleToggle}
          className="w-full text-left p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-surface-2 transition-colors touch-target select-none min-w-0"
        >
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <span className="font-semibold text-text text-sm truncate">{title}</span>
              {badge}
            </div>
            {subtitle && (
              <p className="text-xs text-text-muted mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
          <ChevronDown
            className={`w-4 h-4 text-text-muted transition-transform duration-200 shrink-0 ${
              isExpanded ? 'rotate-180 text-orange-text' : ''
            }`}
          />
        </button>
      </h3>

      <div
        id={`accordion-panel-${id}`}
        role="region"
        aria-labelledby={`accordion-btn-${id}`}
        hidden={!isExpanded}
        className={`border-t border-border/60 p-3.5 sm:p-4 bg-surface-2/40 text-xs text-text ${
          isExpanded ? 'block' : 'hidden'
        }`}
      >
        {children}
      </div>
    </div>
  );
};

export interface AccordionProps {
  children: React.ReactNode;
  className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({ children, className = '' }) => {
  return <div className={`space-y-2.5 ${className}`}>{children}</div>;
};
