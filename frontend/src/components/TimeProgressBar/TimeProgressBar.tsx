/**
 * Time Progress Bar Component
 *
 * Shows visual progress of time spent vs estimated time on task cards
 * Color-coded to indicate if work is under/over estimated time
 */

import React from 'react';
import { useTimerProgressBar } from '../../hooks/useTimerManager';
import { TimerErrorBoundary } from '../ErrorBoundary';
import { formatTimeInput, hoursToTimeInput } from '../../utils/timeFormat';
import type { Issue } from '../../types/domain.types';

interface TimeProgressBarProps {
  issue: Issue;
  className?: string;
}

const TimeProgressBarInner: React.FC<TimeProgressBarProps> = ({
  issue,
  className = ''
}) => {
  const progressData = useTimerProgressBar(issue);

  if (!progressData?.shouldShow) return null;

  const {
    percentage,
    color,
    elapsedHours,
    remainingHours,
    hasActiveTimer,
  } = progressData;

  // Color mapping for progress bar
  const colorClasses = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };

  const backgroundColorClasses = {
    green: 'bg-green-100',
    yellow: 'bg-yellow-100',
    red: 'bg-red-100',
  };

  // Format time display using utility function
  const formatHours = (hours: number): string => {
    return formatTimeInput(hoursToTimeInput(hours));
  };

  const progressWidth = Math.min(percentage, 100);
  const overflowWidth = Math.max(0, percentage - 100);

  return (
    <div className={`relative ${className}`}>
      {/* Progress bar */}
      <div className={`h-2 ${backgroundColorClasses[color]} rounded-full relative overflow-visible`}>
        {/* Base progress (0-100%) - always shows on green background */}
        <div
          className={`h-full bg-green-500 transition-all duration-300 rounded-full`}
          style={{ width: `${Math.min(progressWidth, 100)}%` }}
        />

        {/* Overtime progress bar (over 100%) - shows as red striped overlay */}
        {overflowWidth > 0 && (
          <div
            className="absolute top-0 left-0 h-full rounded-full transition-all duration-300"
            style={{
              width: `${Math.min(100 + overflowWidth, 200)}%`,
              background: `linear-gradient(90deg,
                rgba(34, 197, 94, 1) 0%,
                rgba(34, 197, 94, 1) ${100 / (1 + overflowWidth / 100)}%,
                rgba(239, 68, 68, 0.8) ${100 / (1 + overflowWidth / 100)}%,
                rgba(239, 68, 68, 0.8) 100%)`,
              backgroundImage: overflowWidth > 10 ? 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.3) 3px, rgba(255,255,255,0.3) 6px)' : 'none'
            }}
          />
        )}

        {/* Active timer pulse animation */}
        {hasActiveTimer && (
          <div
            className="absolute top-0 left-0 h-full rounded-full animate-pulse"
            style={{
              width: `${Math.min(percentage, 200)}%`,
              background: percentage > 100
                ? 'rgba(239, 68, 68, 0.3)'
                : 'rgba(34, 197, 94, 0.3)'
            }}
          />
        )}

        {/* Overtime warning indicator */}
        {percentage > 150 && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-white" />
        )}
      </div>

      {/* Time display */}
      <div className="flex justify-between items-center mt-1 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <span className={`font-medium ${color === 'red' ? 'text-red-600' : 'text-gray-700'}`}>
            {formatHours(elapsedHours)}
          </span>
          <span>/</span>
          <span>{formatHours(issue.estimate || 0)}</span>
          {hasActiveTimer && (
            <span className="flex items-center gap-1 text-blue-600">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-xs">active</span>
            </span>
          )}
        </div>

        <div className="text-right">
          {percentage > 100 ? (
            <span className="text-red-600 font-medium">
              +{formatHours(elapsedHours - (issue.estimate || 0))} over
            </span>
          ) : (
            <span className="text-gray-500">
              {formatHours(remainingHours)} left
            </span>
          )}
        </div>
      </div>

      {/* Tooltip with detailed info */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
        <div className={`${percentage > 100 ? 'text-red-300' : 'text-green-300'}`}>
          Time Progress: {Math.round(percentage)}%
          {percentage > 100 && ` (${Math.round(percentage - 100)}% over)`}
        </div>
        <div>Spent: {formatHours(elapsedHours)} / Estimated: {formatHours(issue.estimate || 0)}</div>
        {percentage > 100 && (
          <div className="text-red-300">
            ⚠️ Over by {formatHours(elapsedHours - (issue.estimate || 0))}
          </div>
        )}
        {hasActiveTimer && <div className="text-blue-300">⏱️ Timer running</div>}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
      </div>
    </div>
  );
};

export const TimeProgressBar: React.FC<TimeProgressBarProps> = (props) => {
  return (
    <TimerErrorBoundary>
      <TimeProgressBarInner {...props} />
    </TimerErrorBoundary>
  );
};

// Minimal progress indicator for smaller cards
const TimeProgressIndicatorInner: React.FC<{ issue: Issue }> = ({ issue }) => {
  const progressData = useTimerProgressBar(issue);

  if (!progressData?.shouldShow) return null;

  const { percentage, color, elapsedHours, hasActiveTimer } = progressData;

  const colorClasses = {
    green: 'border-green-500',
    yellow: 'border-yellow-500',
    red: 'border-red-500',
  };

  const baseProgress = Math.min(percentage, 100);
  const overtimeProgress = Math.max(0, percentage - 100);

  return (
    <div
      className={`absolute bottom-0 left-0 right-0 h-1 bg-gray-200 ${hasActiveTimer ? 'animate-pulse' : ''} overflow-visible`}
    >
      {/* Base progress (0-100%) */}
      <div
        className={`h-full ${colorClasses[color].replace('border-', 'bg-')} transition-all duration-300`}
        style={{ width: `${baseProgress}%` }}
      />

      {/* Overtime indicator (over 100%) */}
      {overtimeProgress > 0 && (
        <div
          className="absolute top-0 left-0 h-full bg-red-500 transition-all duration-300"
          style={{
            width: `${Math.min(overtimeProgress, 100)}%`,
            background: 'repeating-linear-gradient(45deg, #ef4444, #ef4444 4px, #dc2626 4px, #dc2626 8px)'
          }}
        />
      )}

      {/* Extreme overtime warning (over 200%) */}
      {percentage > 200 && (
        <div className="absolute top-0 right-0 w-2 h-full bg-red-600 animate-pulse" />
      )}
    </div>
  );
};

export const TimeProgressIndicator: React.FC<{ issue: Issue }> = ({ issue }) => {
  return (
    <TimerErrorBoundary fallback={null}>
      <TimeProgressIndicatorInner issue={issue} />
    </TimerErrorBoundary>
  );
};