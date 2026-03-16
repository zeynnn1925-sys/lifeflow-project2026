import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

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
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = this.state.error?.message || 'An unexpected error occurred.';
      try {
        const parsedError = JSON.parse(errorMessage);
        if (parsedError && parsedError.error) {
          errorMessage = parsedError.error;
        }
      } catch (e) {
        // Not a JSON string, use as is
      }

      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm">
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mb-6">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Something went wrong</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-md">
            The application encountered an unexpected error. Don't worry, your data is safe.
          </p>
          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 mb-8 w-full max-w-lg overflow-auto text-left">
            <code className="text-xs text-rose-600 font-mono">
              {errorMessage}
            </code>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-6 py-3 bg-deep-space-blue text-white rounded-xl font-bold hover:bg-deep-space-blue/90 transition-all shadow-lg shadow-deep-space-blue/20"
          >
            <RefreshCcw className="w-4 h-4" />
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
