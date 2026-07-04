/**
 * Kanban Machine Hook
 *
 * React hook that drives the XState Kanban machine with plain data fetching
 * and optimistic updates via IssuesService.
 */

import { useEffect, useMemo } from 'react';
import { useMachine } from '@xstate/react';
import { kanbanMachine } from '../machines/kanbanMachine';
import { useProjectIssues } from './useProjectIssues';
import { IssuesService } from '../services/api/issues.service';
import type { Issue, IssueStatus } from '../types/domain.types';

interface UseKanbanMachineOptions {
  projectId: number;
  initialIssues?: Issue[];
  enableSync?: boolean;
  syncInterval?: number;
}

export const useKanbanMachine = ({
  projectId,
  initialIssues = [],
  enableSync = true,
  syncInterval = 60000
}: UseKanbanMachineOptions) => {
  // Initialize XState machine
  // NOTE: XState v5 removed the `context` option from useMachine/createActor
  // (a v4-era pattern); it was already ignored at runtime — the machine starts
  // with its own initial context and issues are fed in via LOAD_ISSUES below.
  // The cast keeps the legacy call shape without changing behavior.
  const [state, send] = useMachine(kanbanMachine, {
    context: {
      issues: initialIssues,
      draggedIssue: null,
      currentUpdateIssueId: undefined,
      optimisticUpdates: new Map(),
      conflicts: [],
      projectId,
    }
  } as unknown as Parameters<typeof useMachine<typeof kanbanMachine>>[1]);

  // Plain data fetching
  const {
    issues: effectIssues,
    loading: effectLoading,
    error: effectError,
    refetch
  } = useProjectIssues(projectId);

  // Background sync handled by the XState machine internally
  const lastSync = null;
  const isSyncing = false;

  // Sync Effect.ts data with XState machine
  useEffect(() => {
    if (effectIssues && effectIssues.length > 0) {
      send({
        type: 'LOAD_ISSUES',
        issues: effectIssues
      });
    }
  }, [effectIssues, send]);

  // Handle sync updates - disabled since XState handles its own sync
  // useEffect(() => {
  //   if (isSyncing) {
  //     send({ type: 'SYNC_START' });
  //   }
  // }, [isSyncing, send]);

  // Handle Effect.ts errors
  useEffect(() => {
    if (effectError) {
      send({
        type: 'SYNC_FAILURE',
        error: effectError.message
      });
    }
  }, [effectError, send]);

  // Kanban-specific actions
  const actions = useMemo(() => ({
    // Drag and drop operations
    startDrag: (issue: Issue) => {
      send({
        type: 'DRAG_START',
        issue
      });
    },

    endDrag: () => {
      send({ type: 'DRAG_END' });
    },

    dropIssue: async (targetStatus: IssueStatus, targetIndex?: number) => {
      const draggedIssue = state.context.draggedIssue;
      if (!draggedIssue) return;

      // Send drop event to state machine (handles optimistic update)
      send({
        type: 'DROP_ISSUE',
        targetStatus,
        targetIndex
      });

      try {
        const updatedIssue = await IssuesService.update(draggedIssue.id, {
          status: targetStatus
        });

        // Confirm success in state machine
        send({
          type: 'API_SUCCESS',
          issueId: draggedIssue.id,
          updatedIssue
        });
      } catch (error) {
        // Handle failure in state machine
        send({
          type: 'API_FAILURE',
          issueId: draggedIssue.id,
          error: error instanceof Error ? error.message : 'Update failed'
        });
      }
    },

    // Manual sync trigger
    syncNow: () => {
      send({ type: 'SYNC_START' });
      refetch();
    },

    // Optimistic updates
    applyOptimisticUpdate: (issueId: number, updates: Partial<Issue>) => {
      send({
        type: 'OPTIMISTIC_UPDATE',
        issueId,
        updates
      });
    },

    // Conflict resolution
    resolveConflict: (issueId: number, resolution: 'local' | 'remote') => {
      send({
        type: 'RESOLVE_CONFLICT',
        issueId,
        resolution
      });
    },

    // Error handling
    retryFailedOperation: (issueId: number) => {
      send({
        type: 'RETRY_FAILED_OPERATION',
        issueId
      });
    },

    clearError: () => {
      send({ type: 'RESET_ERROR' });
    },

    // Bulk operations
    reorderIssues: async (positionUpdates: Array<{
      id: number;
      position: number;
      status: IssueStatus;
    }>) => {
      try {
        const response = await fetch('/api/issues/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(positionUpdates)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        // Refresh data after successful reorder
        refetch();
      } catch (error) {
        send({
          type: 'SYNC_FAILURE',
          error: error instanceof Error ? error.message : 'Reorder failed'
        });
      }
    }
  }), [state.context.draggedIssue, send, refetch]);

  // Enhanced state selectors
  const selectors = useMemo(() => ({
    // Issue organization
    issuesByStatus: {
      todo: state.context.issues.filter(i => i.status === 'todo'),
      in_progress: state.context.issues.filter(i => i.status === 'in_progress'),
      code_review: state.context.issues.filter(i => i.status === 'code_review'),
      done: state.context.issues.filter(i => i.status === 'done'),
    },

    // Drag state
    draggedIssue: state.context.draggedIssue,
    isDragging: state.matches('dragging'),

    // Loading and sync states
    isLoading: state.context.loading || effectLoading,
    isUpdating: state.matches('updatingIssue'),
    isSyncing: state.context.syncInProgress || isSyncing,

    // Error states
    error: state.context.error || effectError?.message,
    hasError: !!(state.context.error || effectError),

    // Optimistic updates
    optimisticUpdates: state.context.optimisticUpdates,
    hasOptimisticUpdates: state.context.optimisticUpdates.size > 0,

    // Conflicts
    conflicts: state.context.conflicts,
    hasConflicts: state.context.conflicts.length > 0,

    // Sync info
    lastSync: lastSync || state.context.lastSync,

    // State machine inspection
    currentState: state.value,
    canTransition: (event: string) => state.can({ type: event } as any),

    // Issue utilities
    getIssue: (id: number) => state.context.issues.find(i => i.id === id),
    isOptimistic: (id: number) => state.context.optimisticUpdates.has(id),

    // Column stats
    columnStats: {
      todo: {
        count: state.context.issues.filter(i => i.status === 'todo').length,
        optimistic: Array.from(state.context.optimisticUpdates.entries())
          .filter(([_, issue]) => issue.status === 'todo').length
      },
      in_progress: {
        count: state.context.issues.filter(i => i.status === 'in_progress').length,
        optimistic: Array.from(state.context.optimisticUpdates.entries())
          .filter(([_, issue]) => issue.status === 'in_progress').length
      },
      code_review: {
        count: state.context.issues.filter(i => i.status === 'code_review').length,
        optimistic: Array.from(state.context.optimisticUpdates.entries())
          .filter(([_, issue]) => issue.status === 'code_review').length
      },
      done: {
        count: state.context.issues.filter(i => i.status === 'done').length,
        optimistic: Array.from(state.context.optimisticUpdates.entries())
          .filter(([_, issue]) => issue.status === 'done').length
      },
    }
  }), [state, effectLoading, effectError, isSyncing, lastSync]);

  return {
    // State
    ...selectors,

    // Actions
    ...actions,

    // XState machine reference for advanced usage
    machine: {
      state,
      send,
      currentState: state.value,
      context: state.context
    }
  };
};