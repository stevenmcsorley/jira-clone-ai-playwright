/**
 * Error Boundary for Timer Components
 *
 * Prevents timer errors from crashing the entire application
 */

import React, { Component, ReactNode } from 'react';

interface TimerErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface TimerErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorId: number;
}

export class TimerErrorBoundary extends Component<TimerErrorBoundaryProps, TimerErrorBoundaryState> {
  constructor(props: TimerErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorId: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<TimerErrorBoundaryState> {
    return { hasError: true, error, errorId: Date.now() };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Timer Error Boundary caught an error:', error, errorInfo);
  }

  componentDidUpdate(prevProps: TimerErrorBoundaryProps) {
    // Reset error boundary when children change (allows recovery)
    if (this.state.hasError && prevProps.children !== this.props.children) {
      this.setState({ hasError: false, error: undefined });
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorId: 0 });
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center gap-2 px-2 py-1 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
          <span>⚠️</span>
          <span>Timer error</span>
          <button
            onClick={this.handleRetry}
            className="ml-2 text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}