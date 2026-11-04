import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg flex items-center justify-center p-4">
          <div className="max-w-md w-full p-8 rounded-card border border-border bg-surface shadow-floating space-y-5 text-center">
            <div className="w-12 h-12 rounded-full bg-danger/10 text-danger flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-text">An unexpected error occurred</h1>
              <p className="text-xs text-text-muted mt-1.5 leading-relaxed">
                Pramaan encountered an issue rendering this view. Your saved reviews and data in SQLite remain intact.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-inner bg-surface-2 border border-border text-left font-mono text-[11px] text-danger overflow-x-auto max-h-32">
                {this.state.error.message}
              </div>
            )}

            <div className="flex items-center justify-center space-x-2 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="px-4 py-2 rounded-pill bg-surface-dark text-white dark:bg-orange-500 dark:text-on-orange text-xs font-semibold hover:opacity-90 transition-opacity flex items-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload page</span>
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="px-4 py-2 rounded-pill border border-border bg-surface text-text text-xs font-medium hover:bg-surface-2 transition-colors flex items-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <Home className="w-3.5 h-3.5 text-text-muted" />
                <span>Return home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
