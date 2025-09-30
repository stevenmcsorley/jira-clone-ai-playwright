/**
 * React Hook for XState Timer Manager Integration
 *
 * Provides automatic time tracking with visual progress indicators
 */

import React, { useEffect, useCallback, useState } from 'react';
import { useMachine } from '@xstate/react';
import { timerManagerMachine, getTimerProgress } from '../machines/timer.machine';
import { TimeTrackingService } from '../services/api/time-tracking.service';
import { formatTimeInput, hoursToTimeInput } from '../utils/timeFormat';
import type { Issue } from '../types/domain.types';

// Hook for managing all timers in the application
export const useTimerManager = () => {
  const [state, send] = useMachine(timerManagerMachine);

  // Sync timer states with actual issue status on mount (fix stuck timers)
  useEffect(() => {
    const syncTimersWithIssueStatus = async () => {
      const activeTimers = Array.from(state.context.activeTimers.entries());

      for (const [issueId, timer] of activeTimers) {
        if (timer.status === 'running' || timer.status === 'paused') {
          try {
            const { IssuesService } = await import('../services/api/issues.service');
            const issue = await IssuesService.getById(issueId);

            // If issue is done but timer is still active, force complete it
            if (issue && issue.status === 'done' && timer.status !== 'completed') {
              console.log(`🔄 Found stuck timer for completed issue ${issueId}, fixing...`);
              send({
                type: 'ISSUE_STATUS_CHANGED',
                issueId,
                newStatus: 'done',
                estimate: issue.estimate
              });
            }
          } catch (error) {
            console.error(`Failed to sync timer for issue ${issueId}:`, error);
          }
        }
      }
    };

    // Run sync after a short delay to let the component mount
    const timeoutId = setTimeout(syncTimersWithIssueStatus, 1000);
    return () => clearTimeout(timeoutId);
  }, []); // Only run on mount

  // Save timer state before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Force save current timer state
      console.log('💾 Page unloading, saving timer state...');
      const activeTimers = state.context.activeTimers;
      if (activeTimers.size > 0) {
        const activeTimerArray = Array.from(activeTimers.entries())
          .filter(([_, timer]) => timer.status === 'running' || timer.status === 'paused')
          .map(([id, timer]) => [id, timer]);

        if (activeTimerArray.length > 0) {
          localStorage.setItem('jira-clone-active-timers', JSON.stringify(activeTimerArray));
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state.context.activeTimers]);

  // Handle issue status changes (called from kanban, issue detail, etc.)
  const handleIssueStatusChange = useCallback(
    (issueId: number, newStatus: string, estimate?: number) => {
      console.log(`🎰 Timer Manager: Issue ${issueId} status changed to ${newStatus}, estimate: ${estimate}`);
      send({
        type: 'ISSUE_STATUS_CHANGED',
        issueId,
        newStatus,
        estimate,
      });
    },
    [send]
  );

  // Force stop a timer (for admin/cleanup)
  const forceStopTimer = useCallback(
    (issueId: number) => {
      send({ type: 'FORCE_STOP_TIMER', issueId });
    },
    [send]
  );

  // Get only truly active timers (running or paused, not completed)
  const activeTimers = Array.from(state.context.activeTimers.entries()).filter(
    ([_, timer]) => timer.status === 'running' || timer.status === 'paused'
  );

  // Get active timers count
  const activeTimersCount = activeTimers.length;

  // Get list of active timer issue IDs
  const activeTimerIds = activeTimers.map(([issueId, _]) => issueId);

  return {
    handleIssueStatusChange,
    forceStopTimer,
    activeTimersCount,
    activeTimerIds,
    timerManagerState: state,
  };
};

// Hook for individual issue timer progress
export const useIssueTimer = (issue: Issue) => {
  const { handleIssueStatusChange, activeTimerIds, timerManagerState } = useTimerManager();

  // Check if this issue has an active timer
  const hasActiveTimer = activeTimerIds.includes(issue.id);

  // Get timer state directly from context
  const timerState = timerManagerState.context.activeTimers.get(issue.id);

  // Calculate progress indicators
  const progress = timerState
    ? getTimerProgress(timerState.totalElapsed, issue.estimate || 0)
    : null;

  // Trigger status change when issue status actually changes
  useEffect(() => {
    if (issue.status) {
      handleIssueStatusChange(issue.id, issue.status, issue.estimate);
    }
  }, [issue.id, issue.status, issue.estimate, handleIssueStatusChange]);

  return {
    hasActiveTimer,
    isRunning: timerState?.status === 'running',
    isPaused: timerState?.status === 'paused',
    progress,
    elapsedTime: timerState?.totalElapsed || 0,
    estimate: issue.estimate || 0,
    timerManagerState, // Expose state for progress bar
  };
};

// Hook for timer progress bar component
export const useTimerProgressBar = (issue: Issue) => {
  const { progress, hasActiveTimer, elapsedTime, timerManagerState } = useIssueTimer(issue);
  const [existingTimeSpent, setExistingTimeSpent] = React.useState<number>(0);
  const [lastUpdateTime, setLastUpdateTime] = React.useState<number>(0);

  // Get timer state for this issue
  const timerState = timerManagerState.context.activeTimers.get(issue.id);

  // Fetch existing time logs for this issue
  const fetchExistingTime = React.useCallback(async () => {
    try {
      const summary = await TimeTrackingService.getTimeTrackingSummary(issue.id);
      setExistingTimeSpent(summary.totalTimeSpent || 0);
      setLastUpdateTime(Date.now());
      console.log(`📊 Fetched existing time for issue ${issue.id}: ${summary.totalTimeSpent || 0} hours`);
    } catch (error) {
      console.error('Error fetching time summary:', error);
      setExistingTimeSpent(0);
    }
  }, [issue.id]);

  // Initial fetch and status change refetch
  React.useEffect(() => {
    fetchExistingTime();
  }, [issue.id, issue.status, fetchExistingTime]);

  // Refetch after timer completion (debounced to allow API to settle)
  React.useEffect(() => {
    if (timerState?.status === 'completed' && Date.now() - lastUpdateTime > 2000) {
      const timeoutId = setTimeout(() => {
        console.log(`🔄 Timer completed, refetching time summary for issue ${issue.id}`);
        fetchExistingTime();
      }, 3000); // Wait 3 seconds for API to settle

      return () => clearTimeout(timeoutId);
    }
  }, [timerState?.status, fetchExistingTime, lastUpdateTime, issue.id]);

  if (!issue.estimate || issue.estimate <= 0) return null;

  // Calculate total progress: existing logged time + current active session
  const totalElapsedMs = (existingTimeSpent * 1000 * 60 * 60) + elapsedTime;
  const finalProgress = getTimerProgress(totalElapsedMs, issue.estimate);

  return {
    ...finalProgress,
    hasActiveTimer,
    shouldShow: true,
    existingTimeSpent,
    currentSessionTime: elapsedTime / (1000 * 60 * 60), // convert to hours
  };
};

// Hook for active timer display in header
export const useActiveTimerDisplay = () => {
  const { activeTimerIds, timerManagerState } = useTimerManager();
  const [issueData, setIssueData] = useState<{issueId: number, projectKey: string} | null>(null);

  // Get the first active timer for header display
  const firstActiveId = activeTimerIds[0] || null;
  const timerState = firstActiveId ? timerManagerState.context.activeTimers.get(firstActiveId) : null;

  // Fetch issue and project data for the active timer
  useEffect(() => {
    if (!firstActiveId) {
      setIssueData(null);
      return;
    }

    let isMounted = true; // Prevent state updates if component unmounts

    const fetchIssueData = async () => {
      try {
        const { IssuesService } = await import('../services/api/issues.service');
        const issue = await IssuesService.getById(firstActiveId);

        if (isMounted && issue && issue.project) {
          setIssueData({
            issueId: firstActiveId,
            projectKey: issue.project.key
          });
        } else if (isMounted) {
          // Issue found but no project data
          setIssueData({
            issueId: firstActiveId,
            projectKey: 'JCD'
          });
        }
      } catch (error) {
        console.error('Error fetching issue data for timer display:', error);
        // Fallback to default JCD if issue fetch fails
        if (isMounted) {
          setIssueData({
            issueId: firstActiveId,
            projectKey: 'JCD'
          });
        }
      }
    };

    fetchIssueData().catch(console.error);

    return () => {
      isMounted = false;
    };
  }, [firstActiveId]);

  const formatElapsedTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return `0:${seconds.toString().padStart(2, '0')}`;
  };

  // Early return after hooks
  if (activeTimerIds.length === 0 || !timerState || !firstActiveId) {
    return null;
  }

  return {
    issueId: firstActiveId,
    projectKey: issueData?.projectKey || 'JCD', // Fallback to JCD while loading
    elapsedTime: formatElapsedTime(timerState.totalElapsed),
    isRunning: timerState.status === 'running',
    totalActiveTimers: activeTimerIds.length,
  };
};