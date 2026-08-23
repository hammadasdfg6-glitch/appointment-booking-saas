import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

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
    console.error('Uncaught error in application:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-canvas dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-danger-50 dark:bg-danger-950/40 text-danger-500 flex items-center justify-center mb-5">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-h1 font-bold text-slate-900 dark:text-slate-100">
            Something went wrong
          </h1>
          <p className="text-body text-slate-500 dark:text-slate-400 mt-2 max-w-md">
            An unexpected error occurred in the application. Please try reloading the page.
          </p>
          {this.state.error && (
            <div className="mt-4 p-3 rounded-lg bg-slate-100 dark:bg-slate-900 text-caption font-mono text-slate-600 dark:text-slate-400 max-w-md overflow-x-auto text-left">
              {this.state.error.message}
            </div>
          )}
          <div className="mt-6 flex gap-3">
            <Button
              variant="primary"
              onClick={this.handleReload}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Reload Page
            </Button>
            <Button variant="secondary" onClick={() => (window.location.href = '/')}>
              Return to Home
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
