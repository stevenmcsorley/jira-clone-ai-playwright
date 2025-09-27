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
}

export class TimerErrorBoundary extends Component<TimerErrorBoundaryProps, TimerErrorBoundaryState> {
  constructor(props: TimerErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): TimerErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Timer Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center gap-2 px-2 py-1 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
          <span>⚠️</span>
          <span>Timer error</span>
        </div>
      );
    }

    return this.props.children;
  }
}