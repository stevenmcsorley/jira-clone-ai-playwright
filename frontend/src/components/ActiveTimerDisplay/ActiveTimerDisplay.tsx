/**
 * Active Timer Display Component
 *
 * Shows currently running timer in the header with pause/stop controls
 */

import React from 'react';
import { Square, X } from 'lucide-react';
import { useActiveTimerDisplay, useTimerManager } from '../../hooks/useTimerManager';
import { TimerErrorBoundary } from '../ErrorBoundary';

const ActiveTimerDisplayInner: React.FC = () => {
  const timerDisplay = useActiveTimerDisplay();
  const { forceStopTimer } = useTimerManager();

  if (!timerDisplay) return null;

  const { issueId, projectKey, elapsedTime, isRunning, totalActiveTimers } = timerDisplay;

  const handleStopTimer = () => {
    forceStopTimer(issueId);
  };

  return (
    <div className="flex items-center gap-3 border-b border-gray-200 bg-gray-100 px-4 py-1.5 text-sm text-gray-700" role="status" data-testid="active-timer">
      <span className={`size-2 rounded-full ${isRunning ? 'animate-pulse bg-blue-600' : 'bg-gray-400'}`} aria-hidden="true" />
      <span className="font-mono text-base font-semibold tabular-nums text-gray-900">{elapsedTime}</span>
      <span className="text-gray-600">{projectKey}-{issueId}</span>
      {totalActiveTimers > 1 && <span className="text-xs text-gray-500">+{totalActiveTimers - 1} more</span>}

      <div className="ml-auto flex items-center gap-1">
        {isRunning ? (
          <button
            onClick={handleStopTimer}
            className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-gray-300 px-3 text-xs font-medium text-gray-800 hover:bg-gray-200"
            title="Stop timer and log time"
          >
            <Square className="size-3 fill-current" strokeWidth={1.5} aria-hidden="true" />
            Stop
          </button>
        ) : (
          <span className="text-xs text-gray-500">Paused</span>
        )}
        <button onClick={handleStopTimer} className="inline-flex size-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-200 hover:text-gray-900" title="Close timer" aria-label="Close timer">
          <X className="size-4" strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

export const ActiveTimerDisplay: React.FC = () => {
  return (
    <TimerErrorBoundary>
      <ActiveTimerDisplayInner />
    </TimerErrorBoundary>
  );
};