/**
 * Bulk Operations Effect.ts React Hooks
 *
 * Enhanced hooks for bulk operations with optimistic updates, batching, and undo functionality
 */

import { useMemo, useCallback } from 'react';
import { Effect } from 'effect';
import { useEffectHook, useAsyncEffect, useOptimisticUpdate } from './useEffect';
import type { ApiError } from '../../lib/effect-config';

// Types
export interface BulkOperation {
  type: 'assign' | 'status' | 'labels' | 'priority' | 'sprint' | 'estimate' | 'component' | 'version';
  field: string;
  value: any;
  previousValues?: Record<number, any>;
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

export interface BulkUpdateRequest {
  issueIds: number[];
  operation: BulkOperation;
}

/**
 * Hook for performing bulk operations with optimistic updates
 */
export const useBulkOperationsEffect = () => {
  const { optimisticData, isOptimistic, performOptimisticUpdate } = useOptimisticUpdate<BulkOperationResult>();

  const executeBulkOperation = useCallback(async (
    issueIds: number[],
    operation: BulkOperation,
    onProgress?: (progress: number, currentBatch: number, totalBatches: number) => void
  ): Promise<BulkOperationResult> => {
    // Create optimistic result
    const optimisticResult: BulkOperationResult = {
      successCount: issueIds.length,
      failureCount: 0,
      errors: [],
      affectedIssues: issueIds,
    };

    // Determine batch size based on operation type and issue count
    const batchSize = getBatchSize(operation.type, issueIds.length);
    const totalBatches = Math.ceil(issueIds.length / batchSize);

    const bulkEffect = Effect.gen(function* () {
      let totalSuccessCount = 0;
      let totalFailureCount = 0;
      const allErrors: Array<{ issueId: number; error: string }> = [];

      // Process in batches
      for (let i = 0; i < totalBatches; i++) {
        const batch = issueIds.slice(i * batchSize, (i + 1) * batchSize);

        try {
          const response = yield* Effect.tryPromise({
            try: async () => {
              const response = await fetch('/api/issues/bulk-update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  issueIds: batch,
                  operation: operation,
                }),
              });

              if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
              }

              return response.json();
            },
            catch: (error) => new Error(`Batch ${i + 1} failed: ${String(error)}`)
          });

          totalSuccessCount += response.successCount || 0;
          totalFailureCount += response.failureCount || 0;
          if (response.errors) {
            allErrors.push(...response.errors);
          }

        } catch (error) {
          // If entire batch fails, mark all issues in batch as failed
          batch.forEach(issueId => {
            allErrors.push({
              issueId,
              error: error instanceof Error ? error.message : 'Batch operation failed'
            });
          });
          totalFailureCount += batch.length;
        }

        // Report progress
        if (onProgress) {
          const progress = Math.round(((i + 1) / totalBatches) * 100);
          onProgress(progress, i + 1, totalBatches);
        }

        // Add small delay between batches to prevent overwhelming the server
        if (i < totalBatches - 1) {
          yield* Effect.delay('100 millis');
        }
      }

      const result: BulkOperationResult = {
        successCount: totalSuccessCount,
        failureCount: totalFailureCount,
        errors: allErrors,
        affectedIssues: issueIds.filter(id =>
          !allErrors.some(error => error.issueId === id)
        ),
      };

      return result;
    });

    return performOptimisticUpdate(
      optimisticResult,
      bulkEffect,
      (error) => {
        console.error('Bulk operation failed, rolling back optimistic updates:', error);
      }
    );
  }, [performOptimisticUpdate]);

  return {
    executeBulkOperation,
    optimisticResult: optimisticData,
    isOptimistic
  };
};

/**
 * Hook for validating bulk operations before execution
 */
export const useBulkOperationValidationEffect = () => {
  const { execute: validateOperation, ...state } = useAsyncEffect((
    issueIds: number[],
    operation: BulkOperation
  ) => {
    return Effect.tryPromise({
      try: async () => {
        // Client-side validation
        const errors: ValidationError[] = [];

        // Check for empty selection
        if (issueIds.length === 0) {
          errors.push({
            type: 'validation',
            message: 'No issues selected',
            affectedIssues: [],
          });
        }

        // Check for maximum batch size
        if (issueIds.length > 100) {
          errors.push({
            type: 'validation',
            message: 'Cannot operate on more than 100 issues at once',
            affectedIssues: issueIds,
          });
        }

        // Validate operation-specific requirements
        switch (operation.type) {
          case 'assign':
            if (!operation.value && operation.value !== null) {
              errors.push({
                type: 'validation',
                message: 'Assignee is required for assignment operation',
                affectedIssues: issueIds,
              });
            }
            break;

          case 'status':
            const validStatuses = ['todo', 'in_progress', 'code_review', 'done'];
            if (!validStatuses.includes(operation.value)) {
              errors.push({
                type: 'validation',
                message: `Invalid status: ${operation.value}`,
                affectedIssues: issueIds,
              });
            }
            break;

          case 'priority':
            const validPriorities = ['low', 'medium', 'high', 'urgent'];
            if (!validPriorities.includes(operation.value)) {
              errors.push({
                type: 'validation',
                message: `Invalid priority: ${operation.value}`,
                affectedIssues: issueIds,
              });
            }
            break;

          case 'estimate':
            if (operation.value !== null && (isNaN(operation.value) || operation.value < 0)) {
              errors.push({
                type: 'validation',
                message: 'Estimate must be a non-negative number',
                affectedIssues: issueIds,
              });
            }
            break;

          case 'labels':
            if (operation.field === 'add' || operation.field === 'remove') {
              if (!operation.value || typeof operation.value !== 'string') {
                errors.push({
                  type: 'validation',
                  message: 'Label value is required',
                  affectedIssues: issueIds,
                });
              }
            }
            break;
        }

        return errors;
      },
      catch: (error) => new Error(`Validation failed: ${String(error)}`)
    }) as Effect.Effect<ValidationError[], ApiError, never>;
  });

  return {
    validateOperation,
    validationErrors: state.data || [],
    isValidating: state.loading,
    validationError: state.error,
  };
};

/**
 * Hook for managing bulk operation history and undo/redo functionality
 */
export const useBulkOperationHistoryEffect = () => {
  // In a real implementation, this would be stored in localStorage or a backend service
  const { execute: undoOperation, ...undoState } = useAsyncEffect((
    operation: BulkOperation,
    affectedIssues: number[]
  ) => {
    return Effect.tryPromise({
      try: async () => {
        // Create reverse operation
        const reverseOperation = createReverseOperation(operation, affectedIssues);

        if (!reverseOperation) {
          throw new Error('Cannot create reverse operation for this operation type');
        }

        // Execute the reverse operation
        const response = await fetch('/api/issues/bulk-update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            issueIds: affectedIssues,
            operation: reverseOperation,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
      },
      catch: (error) => new Error(`Undo operation failed: ${String(error)}`)
    }) as Effect.Effect<BulkOperationResult, ApiError, never>;
  });

  return {
    undoOperation,
    isUndoing: undoState.loading,
    undoError: undoState.error,
    undoResult: undoState.data,
  };
};

/**
 * Hook for bulk selection operations
 */
export const useBulkSelectionEffect = () => {
  const selectByFilter = useCallback((
    issues: any[],
    filter: {
      status?: string[];
      priority?: string[];
      assigneeId?: number[];
      type?: string[];
      labels?: string[];
    }
  ): number[] => {
    return issues
      .filter(issue => {
        // Check status filter
        if (filter.status && !filter.status.includes(issue.status)) {
          return false;
        }

        // Check priority filter
        if (filter.priority && !filter.priority.includes(issue.priority)) {
          return false;
        }

        // Check assignee filter
        if (filter.assigneeId && !filter.assigneeId.includes(issue.assigneeId)) {
          return false;
        }

        // Check type filter
        if (filter.type && !filter.type.includes(issue.type)) {
          return false;
        }

        // Check labels filter
        if (filter.labels && !filter.labels.some(label => issue.labels.includes(label))) {
          return false;
        }

        return true;
      })
      .map(issue => issue.id);
  }, []);

  const selectByQuery = useCallback((
    issues: any[],
    query: string
  ): number[] => {
    const searchTerms = query.toLowerCase().split(' ');

    return issues
      .filter(issue => {
        const searchText = `${issue.title} ${issue.description || ''} ${issue.labels.join(' ')}`.toLowerCase();
        return searchTerms.every(term => searchText.includes(term));
      })
      .map(issue => issue.id);
  }, []);

  return {
    selectByFilter,
    selectByQuery,
  };
};

// Helper functions
function getBatchSize(operationType: string, totalCount: number): number {
  // Determine optimal batch size based on operation type and total count
  if (totalCount <= 10) return totalCount; // Small operations don't need batching

  switch (operationType) {
    case 'status':
    case 'priority':
    case 'assign':
      return Math.min(50, Math.max(10, Math.floor(totalCount / 4))); // Fast operations
    case 'labels':
      return Math.min(25, Math.max(5, Math.floor(totalCount / 8))); // Medium operations
    case 'estimate':
    case 'sprint':
      return Math.min(20, Math.max(5, Math.floor(totalCount / 10))); // Slower operations
    default:
      return Math.min(25, Math.max(10, Math.floor(totalCount / 6))); // Default
  }
}

function createReverseOperation(
  operation: BulkOperation,
  affectedIssues: number[]
): BulkOperation | null {
  // This would need to be enhanced to properly store and restore previous values
  // For now, we'll handle simple cases

  switch (operation.type) {
    case 'assign':
      return {
        type: 'assign',
        field: operation.field,
        value: null, // Unassign - would need to store previous assignees for proper undo
      };

    case 'labels':
      if (operation.field === 'add') {
        return {
          type: 'labels',
          field: 'remove',
          value: operation.value,
        };
      } else if (operation.field === 'remove') {
        return {
          type: 'labels',
          field: 'add',
          value: operation.value,
        };
      }
      break;

    // Other operation types would need their own reverse logic
    default:
      return null;
  }

  return null;
}