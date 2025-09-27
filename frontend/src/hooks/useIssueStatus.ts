/**
 * Issue Status Hook
 *
 * React hook that integrates the Issue Status State Machine with React components.
 * Provides optimistic updates, error handling, and business logic validation
 * for issue status transitions.
 */

import { useMachine } from '@xstate/react';
import { issueStatusMachine } from '../machines/issue-status.machine';
import { inspectMachine } from '../lib/xstate-inspector';
import { Issue, IssueStatus } from '../types/domain.types';

export interface UseIssueStatusOptions {
  issue: Issue;
  onStatusChange?: (issueId: number, newStatus: IssueStatus) => Promise<void>;
}

export const useIssueStatus = ({ issue, onStatusChange }: UseIssueStatusOptions) => {
  // Connect machine to inspector in development
  const machine = inspectMachine(issueStatusMachine);

  const [state, send] = useMachine(machine, {
    input: { issue },
    // Override the API actor with real implementation
    actors: {
      updateIssueAPI: ({ context }) => {
        const newStatus = context.optimisticStatus!;

        if (onStatusChange) {
          return onStatusChange(context.issue.id, newStatus)
            .then(() => newStatus)
            .catch((error) => {
              throw new Error(error.message || 'Failed to update issue status');
            });
        }

        // Fallback for when no onStatusChange is provided
        return Promise.resolve(newStatus);
      },
    },
  });

  const currentStatus = state.context.optimisticStatus || state.context.issue.status;

  return {
    // Current state
    status: currentStatus,
    previousStatus: state.context.previousStatus,
    isLoading: state.context.isLoading,
    error: state.context.error,

    // Available actions based on current state
    canStartWork: state.can({ type: 'START_WORK' }),
    canSubmitForReview: state.can({ type: 'SUBMIT_FOR_REVIEW' }),
    canApprove: state.can({ type: 'APPROVE' }),
    canRequestChanges: state.can({ type: 'REQUEST_CHANGES' }),
    canComplete: state.can({ type: 'COMPLETE' }),
    canReopen: state.can({ type: 'REOPEN' }),
    canMoveToBacklog: state.can({ type: 'MOVE_TO_BACKLOG' }),

    // Action dispatchers
    startWork: () => send({ type: 'START_WORK' }),
    submitForReview: () => send({ type: 'SUBMIT_FOR_REVIEW' }),
    approve: () => send({ type: 'APPROVE' }),
    requestChanges: (feedback?: string) => send({ type: 'REQUEST_CHANGES', feedback }),
    complete: () => send({ type: 'COMPLETE' }),
    reopen: (reason?: string) => send({ type: 'REOPEN', reason }),
    moveToBacklog: () => send({ type: 'MOVE_TO_BACKLOG' }),
    retry: () => send({ type: 'RETRY' }),
    cancelOptimistic: () => send({ type: 'CANCEL_OPTIMISTIC' }),

    // State information for UI
    isInState: (stateName: string) => state.matches(stateName),
    isTransitioning: state.matches(/^updating/),
    hasError: !!state.context.error,

    // Debug information
    currentState: state.value,
    context: state.context,
  };
};

/**
 * Get available actions for an issue status as static data
 * Useful for rendering UI elements without initializing the full state machine
 */
export const getAvailableActions = (issue: Issue) => {
  const actions = {
    todo: ['START_WORK', 'COMPLETE'],
    in_progress: ['SUBMIT_FOR_REVIEW', 'COMPLETE', 'MOVE_TO_BACKLOG'],
    code_review: ['APPROVE', 'REQUEST_CHANGES'],
    done: ['REOPEN'],
  };

  const baseActions = actions[issue.status] || [];

  // Apply business rules
  const filteredActions = baseActions.filter(action => {
    switch (action) {
      case 'START_WORK':
        return !!issue.assigneeId;
      case 'COMPLETE':
        // Allow direct completion for simple tasks from todo
        return issue.status === 'todo'
          ? issue.type === 'task' && (issue.estimate || 0) <= 1
          : true;
      default:
        return true;
    }
  });

  return filteredActions;
};

/**
 * Get user-friendly status display information
 */
export const getStatusDisplay = (status: IssueStatus) => {
  const displays = {
    todo: {
      label: 'To Do',
      color: 'gray',
      icon: '⭕',
      description: 'Ready to start'
    },
    in_progress: {
      label: 'In Progress',
      color: 'blue',
      icon: '🔄',
      description: 'Currently being worked on'
    },
    code_review: {
      label: 'Code Review',
      color: 'yellow',
      icon: '👀',
      description: 'Under review'
    },
    done: {
      label: 'Done',
      color: 'green',
      icon: '✅',
      description: 'Completed'
    },
  };

  return displays[status];
};