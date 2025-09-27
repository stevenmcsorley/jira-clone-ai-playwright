/**
 * Active Timer Display Component
 *
 * Shows currently running timer in the header with pause/stop controls
 */

import React from 'react';
import { useActiveTimerDisplay, useTimerManager } from '../../hooks/useTimerManager';
import { TimerErrorBoundary } from '../ErrorBoundary';

const ActiveTimerDisplayInner: React.FC = () => {
  const timerDisplay = useActiveTimerDisplay();
  const { forceStopTimer } = useTimerManager();

  if (!timerDisplay) return null;

  const { issueId, elapsedTime, isRunning, totalActiveTimers } = timerDisplay;

  const handleStopTimer = () => {
    forceStopTimer(issueId);
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 border-l-4 border-blue-500 text-blue-800 text-sm">
      {/* Timer icon */}
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
        <span className="font-medium">⏱️</span>
      </div>

      {/* Timer info */}
      <div className="flex items-center gap-2">
        <span className="font-mono font-bold text-lg">{elapsedTime}</span>
        <span className="text-blue-600">
          JCD-{issueId}
        </span>
        {totalActiveTimers > 1 && (
          <span className="text-xs bg-blue-200 px-2 py-1 rounded-full">
            +{totalActiveTimers - 1} more
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 ml-auto">
        {isRunning ? (
          <button
            onClick={handleStopTimer}
            className="flex items-center gap-1 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-md text-xs font-medium transition-colors"
            title="Stop timer and log time"
          >
            <span>⏹️</span>
            Stop
          </button>
        ) : (
          <span className="text-xs text-blue-600">Paused</span>
        )}

        <button
          onClick={handleStopTimer}
          className="text-blue-500 hover:text-blue-700 p-1"
          title="Close timer"
        >
          ✕
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