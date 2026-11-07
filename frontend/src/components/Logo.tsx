import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true, className = '' }) => {
  const markDimensions = {
    sm: 'w-5 h-5',      // 20px
    md: 'w-7 h-7',      // 28px
    lg: 'w-9 h-9',      // 36px
  }[size];

  const textStyles = {
    sm: 'text-sm font-semibold tracking-tight',
    md: 'text-base font-semibold tracking-tight',
    lg: 'text-xl font-bold tracking-tight',
  }[size];

  return (
    <Link
      to="/"
      className={`inline-flex items-center space-x-2.5 group select-none ${className}`}
      aria-label="Pramaan home"
    >
      <img
        src="/logo-mark.svg"
        alt=""
        aria-hidden="true"
        className={`${markDimensions} shrink-0 rounded-[8px] shadow-xs group-hover:scale-105 transition-transform duration-150`}
      />
      {showText && (
        <span className={`${textStyles} text-text transition-colors`}>
          Pramaan
        </span>
      )}
    </Link>
  );
};

