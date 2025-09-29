/**
 * Bulk Operations State Machine
 *
 * Manages multi-select operations on issues including validation,
 * batch processing, and undo/redo functionality.
 */

import { setup, assign, fromPromise } from 'xstate';

// Types
export interface BulkOperation {
  type: 'assign' | 'status' | 'labels' | 'priority' | 'sprint' | 'estimate' | 'component' | 'version';
  field: string;
  value: any;
  previousValues?: Record<number, any>; // For undo functionality
}

export interface IssueSelection {
  id: number;
  selected: boolean;
  title: string;
  status: string;
  priority: string;
  assigneeId?: number;
  labels: string[];
  estimate?: number;
  sprintId?: number;
}

export interface BulkOperationResult {
  successCount: number;
  failureCount: number;
  errors: Array<{ issueId: number; error: string }>;
  affectedIssues: number[];
}

export interface ValidationError {
  type: 'permission' | 'conflict' | 'validation';
  message: string;
  affectedIssues: number[];
}

// Context for the bulk operations machine
export interface BulkOperationsContext {
  // Selection state
  availableIssues: IssueSelection[];
  selectedIssues: Set<number>;
  selectAllChecked: boolean;
  selectionMode: 'manual' | 'filter' | 'all';

  // Operation state
  currentOperation?: BulkOperation;
  operationProgress: number;
  operationResults?: BulkOperationResult;
  validationErrors: ValidationError[];

  // History for undo/redo
  operationHistory: Array<{
    operation: BulkOperation;
    timestamp: Date;
    results: BulkOperationResult;
  }>;
  historyIndex: number;

  // UI state
  showConfirmDialog: boolean;
  showProgress: boolean;
  isLoading: boolean;
  error?: string;

  // Batch processing
  batchSize: number;
  currentBatch: number;
  totalBatches: number;
}

// Events
export type BulkOperationsEvents =
  | { type: 'LOAD_ISSUES'; issues: IssueSelection[] }
  | { type: 'TOGGLE_ISSUE_SELECTION'; issueId: number }
  | { type: 'SELECT_ALL' }
  | { type: 'SELECT_NONE' }
  | { type: 'SELECT_FILTERED'; filter: (issue: IssueSelection) => boolean }
  | { type: 'SET_BULK_OPERATION'; operation: BulkOperation }
  | { type: 'VALIDATE_OPERATION' }
  | { type: 'VALIDATION_COMPLETE'; errors: ValidationError[] }
  | { type: 'CONFIRM_OPERATION' }
  | { type: 'CANCEL_OPERATION' }
  | { type: 'START_OPERATION' }
  | { type: 'BATCH_PROGRESS'; progress: number; currentBatch: number }
  | { type: 'OPERATION_COMPLETE'; results: BulkOperationResult }
  | { type: 'OPERATION_FAILED'; error: string }
  | { type: 'UNDO_LAST_OPERATION' }
  | { type: 'REDO_OPERATION' }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'RESET_SELECTION' }
  | { type: 'ERROR'; error: string }
  | { type: 'RETRY' };

// Machine setup
export const bulkOperationsMachine = setup({
  types: {
    context: {} as BulkOperationsContext,
    events: {} as BulkOperationsEvents,
    input: {} as { batchSize?: number },
  },

  guards: {
    hasSelectedIssues: ({ context }) => context.selectedIssues.size > 0,
    hasValidOperation: ({ context }) => !!context.currentOperation,
    hasValidationErrors: ({ context }) => context.validationErrors.length > 0,
    canUndo: ({ context }) => context.historyIndex > 0,
    canRedo: ({ context }) => context.historyIndex < context.operationHistory.length,
    isLargeOperation: ({ context }) => context.selectedIssues.size > 20,
    allIssuesSelected: ({ context }) =>
      context.selectedIssues.size === context.availableIssues.length,
    noIssuesSelected: ({ context }) => context.selectedIssues.size === 0,
  },

  actions: {
    // Issue loading and selection actions
    loadIssues: assign({
      availableIssues: ({ event }, params: { issues: IssueSelection[] }) => params.issues,
      selectedIssues: new Set<number>(),
      selectAllChecked: false,
    }),

    toggleIssueSelection: assign({
      selectedIssues: ({ context }, params: { issueId: number }) => {
        const newSelection = new Set(context.selectedIssues);
        if (newSelection.has(params.issueId)) {
          newSelection.delete(params.issueId);
        } else {
          newSelection.add(params.issueId);
        }
        return newSelection;
      },
      selectAllChecked: ({ context }, params: { issueId: number }) => {
        const newSelection = new Set(context.selectedIssues);
        if (newSelection.has(params.issueId)) {
          newSelection.delete(params.issueId);
        } else {
          newSelection.add(params.issueId);
        }
        return newSelection.size === context.availableIssues.length;
      },
    }),

    selectAllIssues: assign({
      selectedIssues: ({ context }) => new Set(context.availableIssues.map(issue => issue.id)),
      selectAllChecked: true,
      selectionMode: 'all',
    }),

    selectNoIssues: assign({
      selectedIssues: new Set<number>(),
      selectAllChecked: false,
      selectionMode: 'manual',
    }),

    selectFilteredIssues: assign({
      selectedIssues: ({ context }, params: { filter: (issue: IssueSelection) => boolean }) => {
        const filteredIds = context.availableIssues
          .filter(params.filter)
          .map(issue => issue.id);
        return new Set(filteredIds);
      },
      selectionMode: 'filter',
    }),

    // Operation setup actions
    setBulkOperation: assign({
      currentOperation: ({ event }, params: { operation: BulkOperation }) => params.operation,
      validationErrors: [],
    }),

    clearOperation: assign({
      currentOperation: undefined,
      validationErrors: [],
      showConfirmDialog: false,
    }),

    // Validation actions
    setValidationErrors: assign({
      validationErrors: ({ event }, params: { errors: ValidationError[] }) => params.errors,
    }),

    clearValidationErrors: assign({
      validationErrors: [],
    }),

    // Progress and results actions
    updateProgress: assign({
      operationProgress: ({ event }, params: { progress: number }) => params.progress,
      currentBatch: ({ event }, params: { currentBatch: number }) => params.currentBatch,
    }),

    setOperationResults: assign({
      operationResults: ({ event }, params: { results: BulkOperationResult }) => params.results,
      operationProgress: 100,
    }),

    // History management actions
    addToHistory: assign({
      operationHistory: ({ context }, params: { operation: BulkOperation; results: BulkOperationResult }) => {
        const newEntry = {
          operation: params.operation,
          timestamp: new Date(),
          results: params.results,
        };

        // Truncate history at current index and add new entry
        const truncatedHistory = context.operationHistory.slice(0, context.historyIndex);
        return [...truncatedHistory, newEntry];
      },
      historyIndex: ({ context }) => context.historyIndex + 1,
    }),

    moveHistoryBackward: assign({
      historyIndex: ({ context }) => Math.max(0, context.historyIndex - 1),
    }),

    moveHistoryForward: assign({
      historyIndex: ({ context }) => Math.min(context.operationHistory.length, context.historyIndex + 1),
    }),

    clearHistory: assign({
      operationHistory: [],
      historyIndex: 0,
    }),

    // UI state actions
    showConfirmDialog: assign({ showConfirmDialog: true }),
    hideConfirmDialog: assign({ showConfirmDialog: false }),
    showProgress: assign({ showProgress: true }),
    hideProgress: assign({ showProgress: false }),
    setLoading: assign({ isLoading: true }),
    clearLoading: assign({ isLoading: false }),

    // Error handling
    setError: assign({
      error: ({ event }, params: { error: string }) => params.error,
      isLoading: false,
      showProgress: false,
    }),

    clearError: assign({ error: undefined }),

    // Calculate batch info
    calculateBatches: assign({
      totalBatches: ({ context }) =>
        Math.ceil(context.selectedIssues.size / context.batchSize),
      currentBatch: 0,
    }),

    // Apply optimistic updates to UI
    applyOptimisticUpdates: assign({
      availableIssues: ({ context }) => {
        if (!context.currentOperation) return context.availableIssues;

        return context.availableIssues.map(issue => {
          if (!context.selectedIssues.has(issue.id)) return issue;

          // Apply the operation optimistically
          const updatedIssue = { ...issue };
          switch (context.currentOperation.type) {
            case 'status':
              updatedIssue.status = context.currentOperation.value;
              break;
            case 'priority':
              updatedIssue.priority = context.currentOperation.value;
              break;
            case 'assign':
              updatedIssue.assigneeId = context.currentOperation.value;
              break;
            case 'labels':
              if (context.currentOperation.field === 'add') {
                updatedIssue.labels = [...new Set([...issue.labels, context.currentOperation.value])];
              } else if (context.currentOperation.field === 'remove') {
                updatedIssue.labels = issue.labels.filter(label => label !== context.currentOperation.value);
              } else {
                updatedIssue.labels = [context.currentOperation.value];
              }
              break;
            case 'estimate':
              updatedIssue.estimate = context.currentOperation.value;
              break;
            case 'sprint':
              updatedIssue.sprintId = context.currentOperation.value;
              break;
          }
          return updatedIssue;
        });
      },
    }),

    // Rollback optimistic updates on failure
    rollbackOptimisticUpdates: assign({
      availableIssues: ({ context }) => {
        // This would restore the original state before optimistic updates
        // Implementation depends on how we store the original state
        return context.availableIssues;
      },
    }),
  },

  actors: {
    // Validate bulk operation
    validateOperation: fromPromise(async ({ input }: {
      input: { operation: BulkOperation; selectedIssues: number[] }
    }) => {
      // Simulate validation - in real implementation this would call API
      const errors: ValidationError[] = [];

      // Example validation rules
      if (input.operation.type === 'assign' && !input.operation.value) {
        errors.push({
          type: 'validation',
          message: 'Assignee is required',
          affectedIssues: input.selectedIssues,
        });
      }

      if (input.selectedIssues.length > 100) {
        errors.push({
          type: 'validation',
          message: 'Cannot operate on more than 100 issues at once',
          affectedIssues: input.selectedIssues,
        });
      }

      return errors;
    }),

    // Execute bulk operation
    executeBulkOperation: fromPromise(async ({ input }: {
      input: {
        operation: BulkOperation;
        selectedIssues: number[];
        batchSize: number;
        onProgress: (progress: number, currentBatch: number) => void;
      }
    }) => {
      const { operation, selectedIssues, batchSize, onProgress } = input;
      const totalBatches = Math.ceil(selectedIssues.length / batchSize);

      let successCount = 0;
      let failureCount = 0;
      const errors: Array<{ issueId: number; error: string }> = [];

      // Process in batches
      for (let i = 0; i < totalBatches; i++) {
        const batch = selectedIssues.slice(i * batchSize, (i + 1) * batchSize);

        try {
          // Simulate batch API call
          const response = await fetch('/api/issues/bulk-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              issueIds: batch,
              operation: operation,
            }),
          });

          if (response.ok) {
            const result = await response.json();
            successCount += result.successCount || batch.length;
            if (result.errors) {
              errors.push(...result.errors);
              failureCount += result.errors.length;
            }
          } else {
            // Handle batch failure
            batch.forEach(issueId => {
              errors.push({ issueId, error: 'Batch operation failed' });
            });
            failureCount += batch.length;
          }
        } catch (error) {
          // Handle network or other errors
          batch.forEach(issueId => {
            errors.push({ issueId, error: String(error) });
          });
          failureCount += batch.length;
        }

        // Report progress
        const progress = Math.round(((i + 1) / totalBatches) * 100);
        onProgress(progress, i + 1);

        // Small delay between batches to prevent overwhelming the server
        if (i < totalBatches - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return {
        successCount,
        failureCount,
        errors,
        affectedIssues: selectedIssues.filter(id =>
          !errors.some(error => error.issueId === id)
        ),
      };
    }),

    // Undo operation
    undoOperation: fromPromise(async ({ input }: {
      input: { operation: BulkOperation; affectedIssues: number[] }
    }) => {
      // Implementation would reverse the operation
      // This is a simplified version
      return { success: true };
    }),
  },
}).createMachine({
  id: 'bulkOperations',
  initial: 'idle',

  context: ({ input }) => ({
    availableIssues: [],
    selectedIssues: new Set(),
    selectAllChecked: false,
    selectionMode: 'manual' as const,
    validationErrors: [],
    operationHistory: [],
    historyIndex: 0,
    showConfirmDialog: false,
    showProgress: false,
    isLoading: false,
    operationProgress: 0,
    batchSize: input.batchSize || 25,
    currentBatch: 0,
    totalBatches: 0,
  }),

  states: {
    idle: {
      on: {
        LOAD_ISSUES: {
          actions: { type: 'loadIssues', params: ({ event }) => ({ issues: event.issues }) },
        },
        TOGGLE_ISSUE_SELECTION: {
          actions: { type: 'toggleIssueSelection', params: ({ event }) => ({ issueId: event.issueId }) },
        },
        SELECT_ALL: {
          actions: 'selectAllIssues',
        },
        SELECT_NONE: {
          actions: 'selectNoIssues',
        },
        SELECT_FILTERED: {
          actions: { type: 'selectFilteredIssues', params: ({ event }) => ({ filter: event.filter }) },
        },
        SET_BULK_OPERATION: [
          {
            guard: 'hasSelectedIssues',
            target: 'validating',
            actions: { type: 'setBulkOperation', params: ({ event }) => ({ operation: event.operation }) },
          },
        ],
        UNDO_LAST_OPERATION: [
          {
            guard: 'canUndo',
            target: 'undoing',
          },
        ],
        REDO_OPERATION: [
          {
            guard: 'canRedo',
            target: 'redoing',
          },
        ],
      },
    },

    validating: {
      entry: 'setLoading',
      invoke: {
        src: 'validateOperation',
        input: ({ context }) => ({
          operation: context.currentOperation!,
          selectedIssues: Array.from(context.selectedIssues),
        }),
        onDone: [
          {
            guard: ({ event }) => event.output.length === 0,
            target: 'confirmed',
            actions: [
              'clearLoading',
              'clearValidationErrors',
            ],
          },
          {
            target: 'validation_failed',
            actions: [
              'clearLoading',
              { type: 'setValidationErrors', params: ({ event }) => ({ errors: event.output }) },
            ],
          },
        ],
        onError: {
          target: 'error',
          actions: { type: 'setError', params: ({ event }) => ({ error: event.error.message }) },
        },
      },
    },

    validation_failed: {
      on: {
        SET_BULK_OPERATION: {
          target: 'validating',
          actions: { type: 'setBulkOperation', params: ({ event }) => ({ operation: event.operation }) },
        },
        CANCEL_OPERATION: {
          target: 'idle',
          actions: 'clearOperation',
        },
      },
    },

    confirmed: {
      entry: ['showConfirmDialog'],
      on: {
        CONFIRM_OPERATION: [
          {
            guard: 'isLargeOperation',
            target: 'executing_batched',
          },
          {
            target: 'executing',
          },
        ],
        CANCEL_OPERATION: {
          target: 'idle',
          actions: ['hideConfirmDialog', 'clearOperation'],
        },
      },
    },

    executing: {
      entry: ['hideConfirmDialog', 'showProgress', 'applyOptimisticUpdates', 'calculateBatches'],
      invoke: {
        src: 'executeBulkOperation',
        input: ({ context }) => ({
          operation: context.currentOperation!,
          selectedIssues: Array.from(context.selectedIssues),
          batchSize: context.batchSize,
          onProgress: (progress: number, currentBatch: number) => {
            // This would send progress events to the machine
          },
        }),
        onDone: {
          target: 'completed',
          actions: [
            'hideProgress',
            { type: 'setOperationResults', params: ({ event }) => ({ results: event.output }) },
            {
              type: 'addToHistory',
              params: ({ context, event }) => ({
                operation: context.currentOperation!,
                results: event.output
              })
            },
            'selectNoIssues',
          ],
        },
        onError: {
          target: 'error',
          actions: [
            'hideProgress',
            'rollbackOptimisticUpdates',
            { type: 'setError', params: ({ event }) => ({ error: event.error.message }) },
          ],
        },
      },

      on: {
        BATCH_PROGRESS: {
          actions: {
            type: 'updateProgress',
            params: ({ event }) => ({
              progress: event.progress,
              currentBatch: event.currentBatch
            })
          },
        },
      },
    },

    executing_batched: {
      // Similar to executing but with different UI treatment for large operations
      entry: ['hideConfirmDialog', 'showProgress', 'applyOptimisticUpdates', 'calculateBatches'],
      invoke: {
        src: 'executeBulkOperation',
        input: ({ context }) => ({
          operation: context.currentOperation!,
          selectedIssues: Array.from(context.selectedIssues),
          batchSize: context.batchSize,
          onProgress: (progress: number, currentBatch: number) => {
            // Send progress events
          },
        }),
        onDone: {
          target: 'completed',
          actions: [
            'hideProgress',
            { type: 'setOperationResults', params: ({ event }) => ({ results: event.output }) },
            {
              type: 'addToHistory',
              params: ({ context, event }) => ({
                operation: context.currentOperation!,
                results: event.output
              })
            },
            'selectNoIssues',
          ],
        },
        onError: {
          target: 'error',
          actions: [
            'hideProgress',
            'rollbackOptimisticUpdates',
            { type: 'setError', params: ({ event }) => ({ error: event.error.message }) },
          ],
        },
      },
    },

    completed: {
      after: {
        3000: 'idle', // Auto-return to idle after 3 seconds
      },
      on: {
        RESET_SELECTION: {
          target: 'idle',
          actions: 'clearOperation',
        },
      },
    },

    undoing: {
      entry: 'setLoading',
      invoke: {
        src: 'undoOperation',
        input: ({ context }) => {
          const lastOperation = context.operationHistory[context.historyIndex - 1];
          return {
            operation: lastOperation.operation,
            affectedIssues: lastOperation.results.affectedIssues,
          };
        },
        onDone: {
          target: 'idle',
          actions: ['clearLoading', 'moveHistoryBackward'],
        },
        onError: {
          target: 'error',
          actions: { type: 'setError', params: ({ event }) => ({ error: event.error.message }) },
        },
      },
    },

    redoing: {
      // Similar to undoing but moves forward in history
      entry: 'setLoading',
      invoke: {
        src: 'executeBulkOperation',
        input: ({ context }) => {
          const nextOperation = context.operationHistory[context.historyIndex];
          return {
            operation: nextOperation.operation,
            selectedIssues: nextOperation.results.affectedIssues,
            batchSize: context.batchSize,
            onProgress: () => {},
          };
        },
        onDone: {
          target: 'idle',
          actions: ['clearLoading', 'moveHistoryForward'],
        },
        onError: {
          target: 'error',
          actions: { type: 'setError', params: ({ event }) => ({ error: event.error.message }) },
        },
      },
    },

    error: {
      on: {
        RETRY: {
          target: 'idle',
          actions: 'clearError',
        },
        RESET_SELECTION: {
          target: 'idle',
          actions: ['clearError', 'clearOperation', 'selectNoIssues'],
        },
      },
    },
  },

  on: {
    ERROR: {
      target: '.error',
      actions: { type: 'setError', params: ({ event }) => ({ error: event.error }) },
    },
  },
});

// Helper function to create machine with custom batch size
export function createBulkOperationsMachine(batchSize: number = 25) {
  return bulkOperationsMachine.provide({
    input: { batchSize },
  });
}