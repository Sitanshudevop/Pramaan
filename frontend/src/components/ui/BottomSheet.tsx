import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  ariaLabel?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  ariaLabel,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus trap inside sheet
    const focusableSelector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusable = sheetRef.current?.querySelectorAll<HTMLElement>(focusableSelector);
    if (focusable && focusable.length > 0 && focusable[0]) {
      focusable[0].focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'Tab') {
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!first || !last) return;

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Swipe down to close
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches && e.touches[0]) {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.changedTouches && e.changedTouches[0]) {
      const deltaY = e.changedTouches[0].clientY - touchStartY.current;
      if (deltaY > 60) {
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Scrim backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet Content */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title || ariaLabel || 'Bottom Sheet Dialog'}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative z-10 w-full max-h-[85dvh] bg-surface border-t border-border rounded-t-[24px] shadow-2xl flex flex-col overflow-hidden pb-safe animate-in slide-in-from-bottom duration-200"
      >
        {/* Drag handle */}
        <div className="pt-3 pb-1 flex justify-center cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1.5 bg-border rounded-pill" />
        </div>

        {/* Optional Header */}
        {title && (
          <div className="px-4 py-2 flex items-center justify-between border-b border-border/70">
            <h2 className="text-sm font-bold text-text truncate">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 -mr-1 rounded-pill text-text-muted hover:text-text hover:bg-surface-2 transition-colors touch-target flex items-center justify-center"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Scrollable content */}
        <div className="p-4 overflow-y-auto flex-1 overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
};
