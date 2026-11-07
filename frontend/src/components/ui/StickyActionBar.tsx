import React from 'react';

export interface StickyActionBarProps {
  children: React.ReactNode;
  className?: string;
}

export const StickyActionBar: React.FC<StickyActionBarProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`fixed bottom-0 inset-x-0 z-30 p-3 sm:p-4 bg-surface/95 backdrop-blur-md border-t border-border shadow-floating pb-safe sm:static sm:z-auto sm:p-0 sm:bg-transparent sm:backdrop-blur-none sm:border-0 sm:shadow-none sm:pb-0 ${className}`}
    >
      <div className="max-w-app mx-auto flex items-center justify-between gap-3">
        {children}
      </div>
    </div>
  );
};
