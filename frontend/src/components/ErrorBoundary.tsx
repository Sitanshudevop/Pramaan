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
          <div className="max-w-md w-full p-6 rounded-card border border-danger/30 bg-surface shadow-sm space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-danger/10 text-danger flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-text">An unexpected error occurred</h1>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Pramaan encountered an issue rendering this view. Your saved reviews and data in SQLite remain intact.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded bg-surface-muted border border-border text-left font-mono text-[11px] text-danger overflow-x-auto max-h-32">
                {this.state.error.message}
              </div>
            )}

            <div className="flex items-center justify-center space-x-2 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="px-3 py-1.5 rounded-btn bg-accent text-white text-xs font-medium hover:bg-accent/90 transition-colors flex items-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-focus"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload page</span>
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="px-3 py-1.5 rounded-btn border border-border bg-surface text-text text-xs font-medium hover:bg-surface-2 transition-colors flex items-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-focus"
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
