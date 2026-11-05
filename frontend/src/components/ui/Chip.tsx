import React from 'react';

export type ChipVariant = 'neutral' | 'accent' | 'success' | 'outline' | 'dark' | 'danger';

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
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs';

  const variantClasses = {
    neutral: 'bg-surface-2 text-text-muted font-medium',
    accent: 'bg-orange-500/12 text-orange-text font-medium',
    success: 'bg-lime text-on-lime font-semibold',
    outline: 'bg-surface-2 text-text font-medium',
    dark: 'bg-surface-dark text-text font-medium',
    danger: 'bg-danger/10 text-danger font-medium',
  }[variant];

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
      className={`inline-flex items-center space-x-1.5 rounded-pill tracking-tight transition-colors ${sizeClasses} ${variantClasses} ${clickableClasses} ${className}`}
      {...rest}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            variant === 'success'
              ? 'bg-on-lime'
              : variant === 'accent'
              ? 'bg-orange-500'
              : variant === 'danger'
              ? 'bg-danger'
              : 'bg-current opacity-70'
          }`}
          aria-hidden="true"
        />
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};

