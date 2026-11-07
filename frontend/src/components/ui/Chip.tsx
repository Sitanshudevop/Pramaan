import React from 'react';

export type ChipVariant =
  | 'neutral'
  | 'accent'
  | 'success'
  | 'outline'
  | 'dark'
  | 'danger'
  | 'blocker'
  | 'major'
  | 'minor'
  | 'info';

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: ChipVariant;
  icon?: React.ReactNode;
  dot?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * Clean rounded pill chip for metadata, tags, and status badges.
 * Meets WCAG 2.2 AA contrast standards in both light and dark themes.
 */
export const Chip: React.FC<ChipProps> = ({
  children,
  variant = 'neutral',
  icon,
  dot,
  className = '',
  size = 'md',
  onClick,
  ...rest
}) => {
  // A3 requirement: Minimum 12px font size, semibold
  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-xs';

  const variantClasses: Record<ChipVariant, string> = {
    neutral: 'bg-surface-2 text-text font-semibold',
    accent: 'bg-orange-500/16 text-orange-text dark:bg-orange-500/25 dark:text-orange-300 font-semibold',
    success: 'bg-lime text-on-lime font-bold shadow-xs',
    outline: 'bg-surface-2 text-text font-semibold',
    dark: 'bg-surface-dark text-white font-semibold',
    danger: 'bg-surface-dark text-white dark:bg-[#251A18] dark:text-[#FF8F80] border border-danger/30 font-semibold',
    blocker: 'bg-surface-dark text-white dark:bg-[#251A18] dark:text-white border border-danger/50 font-semibold shadow-xs',
    major: 'bg-orange-500/16 text-orange-text dark:bg-orange-500/25 dark:text-orange-300 font-semibold',
    minor: 'bg-surface-2 text-text font-semibold',
    info: 'bg-surface-2 text-text-muted font-semibold',
  };

  const isBlocker = variant === 'blocker';

  const clickableClasses = onClick
    ? 'cursor-pointer hover:opacity-90 active:scale-[0.98] select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500'
    : '';

  return (
    <span
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick(e as unknown as React.MouseEvent<HTMLSpanElement>);
              }
            }
          : undefined
      }
      className={`inline-flex items-center space-x-1.5 rounded-pill tracking-tight transition-colors ${sizeClasses} ${variantClasses[variant]} ${clickableClasses} ${className}`}
      {...rest}
    >
      {isBlocker && (
        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0 inline-block" aria-hidden="true" />
      )}
      {dot && !isBlocker && (
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80 shrink-0" aria-hidden="true" />
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};


