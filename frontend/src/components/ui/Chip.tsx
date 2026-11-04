import React from 'react';

export type ChipVariant = 'neutral' | 'accent' | 'success' | 'outline' | 'dark' | 'danger';

export interface ChipProps {
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
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs';

  const variantClasses = {
    neutral: 'bg-surface-2 text-text-muted border border-border/60',
    accent: 'bg-orange-500/10 text-orange-text border border-orange-500/30 font-medium',
    success: 'bg-lime text-on-lime font-semibold',
    outline: 'bg-transparent text-text border border-border hover:border-text-muted/60',
    dark: 'bg-surface-dark text-[#F4F1EC] border border-white/10 font-medium',
    danger: 'bg-danger/10 text-danger border border-danger/30 font-medium',
  }[variant];

  return (
    <span
      className={`inline-flex items-center space-x-1.5 rounded-pill tracking-tight transition-colors ${sizeClasses} ${variantClasses} ${className}`}
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
