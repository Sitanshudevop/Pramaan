import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'info' | 'success' | 'error' | 'warning';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  action?: ToastAction;
  duration?: number;
}

interface ToastContextType {
  showToast: (
    message: string,
    type?: ToastType,
    action?: ToastAction,
    duration?: number
  ) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (
      message: string,
      type: ToastType = 'info',
      action?: ToastAction,
      duration: number = 5000
    ) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newToast: ToastItem = { id, message, type, action, duration };
      setToasts((prev) => [...prev.slice(-4), newToast]); // Keep at most 5 toasts

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    [dismissToast]
  );

  // Central listener for all mutating API errors across the entire app
  useEffect(() => {
    const handleApiError = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string; status?: number }>;
      if (customEvent.detail && customEvent.detail.message) {
        showToast(customEvent.detail.message, 'error');
      }
    };

    window.addEventListener('pramaan-api-error', handleApiError);
    return () => {
      window.removeEventListener('pramaan-api-error', handleApiError);
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      {/* Toast Region */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-3 sm:px-0"
      >
        {toasts.map((toast) => {
          const isError = toast.type === 'error';
          const isSuccess = toast.type === 'success';
          const isWarning = toast.type === 'warning';

          return (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto flex items-start space-x-3 p-3.5 rounded-card border shadow-floating bg-surface text-text text-xs transition-all animate-in fade-in slide-in-from-bottom-2 ${
                isError
                  ? 'border-danger/40 bg-surface dark:bg-surface-2'
                  : isSuccess
                  ? 'border-success/40 bg-surface dark:bg-surface-2'
                  : isWarning
                  ? 'border-warning/40 bg-surface dark:bg-surface-2'
                  : 'border-orange-500/40 bg-surface dark:bg-surface-2'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {isError && <AlertCircle className="w-4 h-4 text-danger" />}
                {isSuccess && <CheckCircle2 className="w-4 h-4 text-success" />}
                {isWarning && <AlertTriangle className="w-4 h-4 text-warning" />}
                {!isError && !isSuccess && !isWarning && (
                  <Info className="w-4 h-4 text-orange-text" />
                )}
              </div>

              <div className="flex-1 min-w-0 pr-1">
                <p className="font-medium leading-relaxed break-words">{toast.message}</p>
                {toast.action && (
                  <button
                    type="button"
                    onClick={() => {
                      toast.action?.onClick();
                      dismissToast(toast.id);
                    }}
                    className="mt-2 inline-flex items-center text-[11px] font-semibold text-orange-text hover:underline focus:outline-none"
                  >
                    {toast.action.label}
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="shrink-0 p-1 rounded-pill text-text-muted hover:text-text hover:bg-surface-2 focus:outline-none focus:ring-1 focus:ring-orange-500"
                aria-label="Close notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
};
