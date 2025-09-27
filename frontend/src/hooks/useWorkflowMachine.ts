/**
 * React Hook for XState Workflow Machine Integration
 *
 * Provides a simple interface for using the enhanced workflow engine
 * in React components with optimistic updates and error handling.
 */

import { useMachine } from '@xstate/react';
import { useCallback, useEffect } from 'react';
import { issueStatusMachine, WorkflowConfig } from '../machines/issue-status.machine';
import { Issue, IssueStatus } from '../types/domain.types';

interface UseWorkflowMachineOptions {
  issue: Issue;
  workflowConfig?: WorkflowConfig;
  onStatusChange?: (issue: Issue, newStatus: IssueStatus) => void;
  onError?: (error: string) => void;
}

export const useWorkflowMachine = ({
  issue,
  workflowConfig,
  onStatusChange,
  onError,
}: UseWorkflowMachineOptions) => {
  const [state, send] = useMachine(issueStatusMachine, {
    input: { issue, workflowConfig },
  });

  const { context } = state;

  // Workflow actions
  const startWork = useCallback(() => {
    send({ type: 'START_WORK' });
  }, [send]);

  const submitForReview = useCallback(() => {
    send({ type: 'SUBMIT_FOR_REVIEW' });
  }, [send]);

  const approve = useCallback(() => {
    send({ type: 'APPROVE' });
  }, [send]);

  const requestChanges = useCallback((feedback?: string) => {
    send({ type: 'REQUEST_CHANGES', feedback });
  }, [send]);

  const complete = useCallback(() => {
    send({ type: 'COMPLETE' });
  }, [send]);

  const reopen = useCallback((reason?: string) => {
    send({ type: 'REOPEN', reason });
  }, [send]);

  const moveToBacklog = useCallback(() => {
    send({ type: 'MOVE_TO_BACKLOG' });
  }, [send]);

  const retry = useCallback(() => {
    send({ type: 'RETRY' });
  }, [send]);

  const cancelOptimistic = useCallback(() => {
    send({ type: 'CANCEL_OPTIMISTIC' });
  }, [send]);

  // Side effects
  useEffect(() => {
    if (state.matches('error') && context.error && onError) {
      onError(context.error);
    }
  }, [state, context.error, onError]);

  useEffect(() => {
    if (state.matches(['todo', 'inProgress', 'codeReview', 'done']) && context.issue && onStatusChange) {
      onStatusChange(context.issue, context.issue.status);
    }
  }, [state, context.issue, onStatusChange]);

  // Helper functions
  const canPerformAction = useCallback((action: string): boolean => {
    switch (action) {
      case 'START_WORK':
        return state.matches('todo') &&
               (workflowConfig?.requireAssigneeForStart ? !!issue.assigneeId : true);
      case 'SUBMIT_FOR_REVIEW':
        return state.matches('inProgress') &&
               (workflowConfig?.requireDescriptionForReview ? !!issue.description?.trim() : true);
      case 'APPROVE':
        return state.matches('codeReview');
      case 'REQUEST_CHANGES':
        return state.matches('codeReview');
      case 'COMPLETE':
        return state.matches('inProgress') || state.matches('codeReview');
      case 'REOPEN':
        return state.matches('done') && (workflowConfig?.allowReopenFromDone ?? true);
      case 'MOVE_TO_BACKLOG':
        return state.matches('inProgress');
      default:
        return false;
    }
  }, [state, workflowConfig, issue.assigneeId, issue.description]);

  const getValidTransitions = useCallback((): IssueStatus[] => {
    return context.validTransitions || [];
  }, [context.validTransitions]);

  const getCurrentDisplayStatus = useCallback((): IssueStatus => {
    return context.optimisticStatus || context.issue.status;
  }, [context.optimisticStatus, context.issue.status]);

  return {
    // State
    currentStatus: getCurrentDisplayStatus(),
    isLoading: context.isLoading,
    error: context.error,
    validTransitions: getValidTransitions(),
    workflowConfig: context.workflowConfig,

    // Actions
    startWork,
    submitForReview,
    approve,
    requestChanges,
    complete,
    reopen,
    moveToBacklog,
    retry,
    cancelOptimistic,

    // Helpers
    canPerformAction,

    // State checks
    canStartWork: canPerformAction('START_WORK'),
    canSubmitForReview: canPerformAction('SUBMIT_FOR_REVIEW'),
    canApprove: canPerformAction('APPROVE'),
    canComplete: canPerformAction('COMPLETE'),
    canReopen: canPerformAction('REOPEN'),
    canMoveToBacklog: canPerformAction('MOVE_TO_BACKLOG'),

    // Raw state for advanced usage
    state,
    send,
  };
};