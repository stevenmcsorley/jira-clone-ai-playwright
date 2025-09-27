/**
 * WatchButton Component
 *
 * Toggle button for watching/unwatching issues with optimistic updates
 * and real-time notification management.
 */

import React, { useState } from 'react';
import { Issue } from '../../types/domain.types';

interface WatchButtonProps {
  issue: Issue;
  isWatching: boolean;
  onToggleWatch: (issueId: number, shouldWatch: boolean) => Promise<void>;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'button' | 'text';
}

export const WatchButton: React.FC<WatchButtonProps> = ({
  issue,
  isWatching,
  onToggleWatch,
  disabled = false,
  size = 'md',
  variant = 'button',
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [optimisticState, setOptimisticState] = useState<boolean | null>(null);

  const currentState = optimisticState !== null ? optimisticState : isWatching;

  const handleToggle = async () => {
    if (disabled || isLoading) return;

    const newState = !currentState;
    setOptimisticState(newState);
    setIsLoading(true);

    try {
      await onToggleWatch(issue.id, newState);
      setOptimisticState(null); // Clear optimistic state on success
    } catch (error) {
      // Rollback optimistic update on error
      setOptimisticState(null);
      console.error('Failed to toggle watch status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'px-2 py-1 text-xs';
      case 'lg': return 'px-4 py-3 text-base';
      default: return 'px-3 py-2 text-sm';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 'w-3 h-3';
      case 'lg': return 'w-5 h-5';
      default: return 'w-4 h-4';
    }
  };

  const WatchIcon = ({ watching }: { watching: boolean }) => (
    <svg
      className={`${getIconSize()} ${watching ? 'text-blue-600' : 'text-gray-400'}`}
      fill={watching ? 'currentColor' : 'none'}
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={watching ? 0 : 2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={watching ? 0 : 2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  );

  const LoadingIcon = () => (
    <svg className={`${getIconSize()} animate-spin text-gray-400`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );

  if (variant === 'text') {
    return (
      <button
        onClick={handleToggle}
        disabled={disabled || isLoading}
        className={`
          inline-flex items-center space-x-1 text-sm font-medium transition-colors
          ${currentState
            ? 'text-blue-600 hover:text-blue-800'
            : 'text-gray-500 hover:text-gray-700'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        title={currentState ? 'Stop watching this issue' : 'Watch this issue for updates'}
      >
        {isLoading ? <LoadingIcon /> : <WatchIcon watching={currentState} />}
        <span>{currentState ? 'Watching' : 'Watch'}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={disabled || isLoading}
      className={`
        inline-flex items-center space-x-2 border rounded-md font-medium transition-all duration-200
        ${getSizeClasses()}
        ${currentState
          ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
        }
        ${disabled || isLoading
          ? 'opacity-50 cursor-not-allowed'
          : 'cursor-pointer hover:shadow-sm'
        }
      `}
      title={currentState ? 'Stop watching this issue' : 'Watch this issue for updates'}
    >
      {isLoading ? <LoadingIcon /> : <WatchIcon watching={currentState} />}
      <span>{currentState ? 'Watching' : 'Watch'}</span>

      {/* Optimistic update indicator */}
      {optimisticState !== null && (
        <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse" />
      )}
    </button>
  );
};