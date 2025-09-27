/**
 * Kanban Board XState Machine
 *
 * Manages the state of the Kanban board with optimistic updates,
 * error handling, and real-time synchronization.
 */

import { setup, assign, fromPromise } from 'xstate';
import { Effect } from 'effect';
import type { Issue, IssueStatus } from '../types/domain.types';
import { useOptimisticIssueStatus } from '../hooks/effect/useIssuesEffect';
import { IssuesService } from '../services/api/issues.service';

// Kanban-specific context
export interface KanbanContext {
  issues: Issue[];
  draggedIssue: Issue | null;
  currentUpdateIssueId?: number; // Track which issue is being updated
  optimisticUpdates: Map<number, Issue>; // Track optimistic changes
  projectId: number; // Add projectId to context
  error?: string;
  loading?: boolean;
  lastSync?: Date;
  syncInProgress?: boolean;
  conflicts: Issue[]; // Issues with conflicts from other users
}

// Kanban events
export type KanbanEvents =
  | { type: 'LOAD_ISSUES'; issues: Issue[] }
  | { type: 'DRAG_START'; issue: Issue }
  | { type: 'DRAG_END' }
  | { type: 'DROP_ISSUE'; targetStatus: IssueStatus; targetIndex?: number }
  | { type: 'OPTIMISTIC_UPDATE'; issueId: number; updates: Partial<Issue> }
  | { type: 'API_SUCCESS'; issueId: number; updatedIssue: Issue }
  | { type: 'API_FAILURE'; issueId: number; error: string }
  | { type: 'SYNC_START' }
  | { type: 'SYNC_SUCCESS'; issues: Issue[] }
  | { type: 'SYNC_FAILURE'; error: string }
  | { type: 'RESOLVE_CONFLICT'; issueId: number; resolution: 'local' | 'remote' }
  | { type: 'RETRY_FAILED_OPERATION'; issueId: number }
  | { type: 'RESET_ERROR' };

// Issue update operation for tracking
interface PendingOperation {
  issueId: number;
  updates: Partial<Issue>;
  timestamp: Date;
  retryCount: number;
}

const MAX_RETRY_ATTEMPTS = 3;
const SYNC_INTERVAL = 60000; // 60 seconds

export const kanbanMachine = setup({
  types: {
    context: {} as KanbanContext,
    events: {} as KanbanEvents,
  },
  guards: {
    hasError: ({ context }) => !!context.error,
    isLoading: ({ context }) => !!context.loading,
    hasDraggedIssue: ({ context }) => !!context.draggedIssue,
    hasOptimisticUpdates: ({ context }) => context.optimisticUpdates.size > 0,
    hasConflicts: ({ context }) => context.conflicts.length > 0,
    canRetry: (_, params: { operation: PendingOperation }) =>
      params.operation.retryCount < MAX_RETRY_ATTEMPTS,
  },
  actions: {
    // Issue management
    setIssues: assign({
      issues: (_, params: { issues: Issue[] }) => params.issues,
      lastSync: () => new Date(),
    }),

    // Drag and drop actions
    startDrag: assign({
      draggedIssue: (_, params: { issue: Issue }) => params.issue,
    }),

    endDrag: assign({
      draggedIssue: null,
    }),

    // Optimistic update actions
    applyOptimisticUpdate: assign({
      issues: ({ context }, params: { issueId: number; updates: Partial<Issue> }) => {
        return context.issues.map(issue =>
          issue.id === params.issueId
            ? { ...issue, ...params.updates }
            : issue
        );
      },
      optimisticUpdates: ({ context }, params: { issueId: number; updates: Partial<Issue> }) => {
        const originalIssue = context.issues.find(i => i.id === params.issueId);
        if (originalIssue) {
          const newMap = new Map(context.optimisticUpdates);
          newMap.set(params.issueId, originalIssue);
          return newMap;
        }
        return context.optimisticUpdates;
      },
    }),

    // API success/failure handling
    confirmOptimisticUpdate: assign({
      optimisticUpdates: ({ context }, params: { issueId: number; updatedIssue: Issue }) => {
        const newMap = new Map(context.optimisticUpdates);
        newMap.delete(params.issueId);
        return newMap;
      },
      issues: ({ context }, params: { issueId: number; updatedIssue: Issue }) => {
        return context.issues.map(issue =>
          issue.id === params.issueId ? params.updatedIssue : issue
        );
      },
    }),

    rollbackOptimisticUpdate: assign({
      issues: ({ context }, params: { issueId: number }) => {
        const originalIssue = context.optimisticUpdates.get(params.issueId);
        if (originalIssue) {
          return context.issues.map(issue =>
            issue.id === params.issueId ? originalIssue : issue
          );
        }
        return context.issues;
      },
      optimisticUpdates: ({ context }, params: { issueId: number }) => {
        const newMap = new Map(context.optimisticUpdates);
        newMap.delete(params.issueId);
        return newMap;
      },
    }),

    // Error handling
    setError: assign({
      error: (_, params: { error: string }) => params.error,
      loading: false,
    }),

    clearError: assign({
      error: undefined,
    }),

    // Loading states
    setLoading: assign({
      loading: (_, params: { loading: boolean }) => params.loading,
    }),

    setSyncInProgress: assign({
      syncInProgress: (_, params: { syncing: boolean }) => params.syncing,
    }),

    // Conflict resolution
    detectConflicts: assign({
      conflicts: ({ context }, params: { remoteIssues: Issue[] }) => {
        const conflicts: Issue[] = [];

        // Check for conflicts between local optimistic updates and remote changes
        context.optimisticUpdates.forEach((originalIssue, issueId) => {
          const currentLocalIssue = context.issues.find(i => i.id === issueId);
          const remoteIssue = params.remoteIssues.find(i => i.id === issueId);

          if (currentLocalIssue && remoteIssue &&
              new Date(remoteIssue.updatedAt) > new Date(originalIssue.updatedAt)) {
            conflicts.push(remoteIssue);
          }
        });

        return conflicts;
      },
    }),

    resolveConflict: assign({
      conflicts: ({ context }, params: { issueId: number; resolution: 'local' | 'remote' }) => {
        return context.conflicts.filter(issue => issue.id !== params.issueId);
      },
      issues: ({ context }, params: { issueId: number; resolution: 'local' | 'remote' }) => {
        if (params.resolution === 'remote') {
          const conflictIssue = context.conflicts.find(i => i.id === params.issueId);
          if (conflictIssue) {
            return context.issues.map(issue =>
              issue.id === params.issueId ? conflictIssue : issue
            );
          }
        }
        return context.issues;
      },
    }),
  },
  actors: {
    // Update issue via API
    updateIssueActor: fromPromise(async ({ input }: {
      input: { issueId: number; updates: Partial<Issue> }
    }) => {
      const effect = Effect.tryPromise({
        try: async () => {
          return await IssuesService.update(input.issueId, input.updates);
        },
        catch: (error) => new Error(`Failed to update issue: ${String(error)}`)
      });

      return Effect.runPromise(effect);
    }),

    // Sync with server
    syncIssuesActor: fromPromise(async ({ input }: {
      input: { projectId: number }
    }) => {
      const effect = Effect.tryPromise({
        try: async () => {
          return await IssuesService.getByProject(input.projectId);
        },
        catch: (error) => new Error(`Failed to sync issues: ${String(error)}`)
      });

      return Effect.runPromise(effect);
    }),

    // Bulk reorder issues
    reorderIssuesActor: fromPromise(async ({ input }: {
      input: { positionUpdates: Array<{ id: number; position: number; status: IssueStatus }> }
    }) => {
      const effect = Effect.tryPromise({
        try: async () => {
          const response = await fetch('/api/issues/reorder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input.positionUpdates)
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          return response.json();
        },
        catch: (error) => new Error(`Failed to reorder issues: ${String(error)}`)
      });

      return Effect.runPromise(effect);
    }),
  },
}).createMachine({
  id: 'kanban',
  initial: 'idle',
  context: {
    issues: [],
    draggedIssue: null,
    currentUpdateIssueId: undefined,
    optimisticUpdates: new Map(),
    conflicts: [],
    projectId: 1, // Default value, should be overridden
  },
  states: {
    idle: {
      on: {
        LOAD_ISSUES: {
          actions: [
            { type: 'setIssues', params: ({ event }) => ({ issues: event.issues }) }
          ],
        },
        DRAG_START: {
          target: 'dragging',
          actions: [
            { type: 'startDrag', params: ({ event }) => ({ issue: event.issue }) }
          ],
        },
        SYNC_START: {
          target: 'syncing',
        },
        RESET_ERROR: {
          actions: ['clearError'],
        },
      },
    },

    dragging: {
      on: {
        DRAG_END: {
          target: 'idle',
          actions: ['endDrag'],
        },
        DROP_ISSUE: {
          target: 'updatingIssue',
          actions: [
            {
              type: 'applyOptimisticUpdate',
              params: ({ event, context }) => ({
                issueId: context.draggedIssue?.id || 0,
                updates: {
                  status: event.targetStatus,
                  updatedAt: new Date().toISOString()
                }
              })
            },
            assign({
              currentUpdateIssueId: ({ context }) => context.draggedIssue?.id
            }),
            'endDrag'
          ],
        },
      },
    },

    updatingIssue: {
      // Don't use invoke - handle API calls externally
      entry: [
        { type: 'setLoading', params: { loading: true } }
      ],
      on: {
        API_SUCCESS: {
          target: 'idle',
          actions: [
            {
              type: 'confirmOptimisticUpdate',
              params: ({ event }) => ({
                issueId: event.issueId,
                updatedIssue: event.updatedIssue
              })
            },
            { type: 'setLoading', params: { loading: false } },
            assign({
              currentUpdateIssueId: undefined
            })
          ],
        },
        API_FAILURE: {
          target: 'idle',
          actions: [
            {
              type: 'rollbackOptimisticUpdate',
              params: ({ event }) => ({ issueId: event.issueId })
            },
            {
              type: 'setError',
              params: ({ event }) => ({ error: event.error })
            },
            { type: 'setLoading', params: { loading: false } },
            assign({
              currentUpdateIssueId: undefined
            })
          ],
        },
      },
    },

    syncing: {
      entry: [
        { type: 'setSyncInProgress', params: { syncing: true } }
      ],
      // Temporarily disable sync actor to prevent issues from being cleared
      // invoke: {
      //   src: 'syncIssuesActor',
      //   input: ({ context }) => ({
      //     projectId: context.projectId
      //   }),
      //   onDone: {
      //     target: 'idle',
      //     actions: [
      //       { type: 'setSyncInProgress', params: { syncing: false } },
      //       {
      //         type: 'detectConflicts',
      //         params: ({ event }) => ({ remoteIssues: event.output })
      //       },
      //       {
      //         type: 'setIssues',
      //         params: ({ event }) => ({ issues: event.output })
      //       }
      //     ],
      //   },
      //   onError: {
      //     target: 'idle',
      //     actions: [
      //       { type: 'setSyncInProgress', params: { syncing: false } },
      //       {
      //         type: 'setError',
      //         params: ({ event }) => ({
      //           error: event.error instanceof Error ? event.error.message : 'Sync failed'
      //         })
      //       }
      //     ],
      //   },
      // },
      after: {
        1000: {
          target: 'idle',
          actions: [
            { type: 'setSyncInProgress', params: { syncing: false } }
          ]
        }
      },
      on: {
        SYNC_SUCCESS: {
          target: 'idle',
          actions: [
            { type: 'setSyncInProgress', params: { syncing: false } },
            {
              type: 'setIssues',
              params: ({ event }) => ({ issues: event.issues })
            }
          ],
        },
        SYNC_FAILURE: {
          target: 'idle',
          actions: [
            { type: 'setSyncInProgress', params: { syncing: false } },
            {
              type: 'setError',
              params: ({ event }) => ({ error: event.error })
            }
          ],
        },
      },
    },

    error: {
      on: {
        RETRY_FAILED_OPERATION: {
          target: 'updatingIssue',
        },
        RESET_ERROR: {
          target: 'idle',
          actions: ['clearError'],
        },
      },
    },
  },

  // Global transitions available from any state
  on: {
    OPTIMISTIC_UPDATE: {
      actions: [
        {
          type: 'applyOptimisticUpdate',
          params: ({ event }) => ({
            issueId: event.issueId,
            updates: event.updates
          })
        }
      ],
    },
    RESOLVE_CONFLICT: {
      actions: [
        {
          type: 'resolveConflict',
          params: ({ event }) => ({
            issueId: event.issueId,
            resolution: event.resolution
          })
        }
      ],
    },
  },
});

// Utility functions for working with the machine
export const createKanbanActor = (initialIssues: Issue[] = [], projectId: number = 1) => {
  return kanbanMachine.provide({
    context: {
      issues: initialIssues,
      draggedIssue: null,
      currentUpdateIssueId: undefined,
      optimisticUpdates: new Map(),
      conflicts: [],
      projectId,
    }
  });
};

export type KanbanActor = ReturnType<typeof createKanbanActor>;