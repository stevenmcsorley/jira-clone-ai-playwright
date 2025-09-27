/**
 * Issues Effect.ts React Hooks
 *
 * Enhanced hooks for issue management with optimistic updates and caching
 */

import { useMemo, useCallback } from 'react';
import { Effect } from 'effect';
import { useEffectHook, useAsyncEffect, useOptimisticUpdate, useBackgroundSync } from './useEffect';
import { fetchProjects, fetchIssuesByProject } from '../../services/effect/demo-service';
import type { ApiError } from '../../lib/effect-config';

// Types (using simplified types for now)
interface Issue {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  type: string;
  projectId: number;
  assigneeId?: number;
  reporterId: number;
  estimate?: number;
  labels: string[];
  position: number;
  epicId?: number;
  sprintId?: number;
  createdAt: string;
  updatedAt: string;
}

interface CreateIssueRequest {
  title: string;
  description?: string;
  status?: string;
  priority: string;
  type: string;
  projectId: number;
  assigneeId?: number;
  reporterId: number;
  estimate?: number;
  labels?: string[];
  epicId?: number;
  sprintId?: number;
}

interface UpdateIssueRequest extends Partial<CreateIssueRequest> {}

/**
 * Enhanced hook for fetching issues with caching and background sync
 */
export const useIssuesEffect = (projectId?: number) => {
  // Create the effect for fetching issues
  const fetchEffect = useMemo(() => {
    if (projectId === undefined) {
      return Effect.succeed([]);
    }
    return fetchIssuesByProject(projectId);
  }, [projectId]);

  // Main data fetching with caching
  const {
    data: issues,
    loading,
    error,
    refetch
  } = useEffectHook<Issue[]>(fetchEffect, {
    initialData: [],
    dependencies: [projectId],
    immediate: projectId !== undefined
  });

  // Background sync disabled - preventing continuous polling
  // const { lastSync, isSyncing } = useBackgroundSync(
  //   fetchEffect,
  //   60000, // Sync every 60 seconds
  //   projectId !== undefined && !loading
  // );
  const lastSync = null;
  const isSyncing = false;

  return {
    issues: issues || [],
    loading,
    error,
    refetch,
    lastSync,
    isSyncing
  };
};

/**
 * Hook for creating issues with optimistic updates
 */
export const useCreateIssueEffect = () => {
  const { optimisticData, isOptimistic, performOptimisticUpdate } = useOptimisticUpdate<Issue>();

  const createIssue = useCallback(async (issueData: CreateIssueRequest): Promise<Issue> => {
    // Create optimistic issue
    const optimisticIssue: Issue = {
      id: Date.now(), // Temporary ID
      title: issueData.title,
      description: issueData.description,
      status: issueData.status || 'todo',
      priority: issueData.priority,
      type: issueData.type,
      projectId: issueData.projectId,
      assigneeId: issueData.assigneeId,
      reporterId: issueData.reporterId,
      estimate: issueData.estimate,
      labels: issueData.labels || [],
      position: 0,
      epicId: issueData.epicId,
      sprintId: issueData.sprintId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Create the actual Effect for API call
    const createEffect = Effect.tryPromise({
      try: async () => {
        const response = await fetch('/api/issues', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(issueData)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return response.json();
      },
      catch: (error) => new Error(`Create failed: ${String(error)}`)
    }) as Effect.Effect<Issue, ApiError, never>;

    return performOptimisticUpdate(
      optimisticIssue,
      createEffect,
      (error) => {
        console.error('Failed to create issue, rolling back:', error);
      }
    );
  }, [performOptimisticUpdate]);

  return {
    createIssue,
    optimisticIssue: optimisticData,
    isOptimistic
  };
};

/**
 * Hook for updating issues with optimistic updates
 */
export const useUpdateIssueEffect = () => {
  const { optimisticData, isOptimistic, performOptimisticUpdate } = useOptimisticUpdate<Issue>();

  const updateIssue = useCallback(async (
    issueId: number,
    updates: UpdateIssueRequest,
    currentIssue?: Issue
  ): Promise<Issue> => {
    // Create optimistic issue if we have current data
    const optimisticIssue: Issue = currentIssue ? {
      ...currentIssue,
      ...updates,
      updatedAt: new Date().toISOString()
    } : null;

    // Create the actual Effect for API call
    const updateEffect = Effect.tryPromise({
      try: async () => {
        const response = await fetch(`/api/issues/${issueId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return response.json();
      },
      catch: (error) => new Error(`Update failed: ${String(error)}`)
    }) as Effect.Effect<Issue, ApiError, never>;

    // If we don't have current issue, just run the effect normally
    if (!optimisticIssue) {
      return Effect.runPromise(updateEffect);
    }

    return performOptimisticUpdate(
      optimisticIssue,
      updateEffect,
      (error) => {
        console.error('Failed to update issue, rolling back:', error);
      }
    );
  }, [performOptimisticUpdate]);

  return {
    updateIssue,
    optimisticIssue: optimisticData,
    isOptimistic
  };
};

/**
 * Specialized hook for optimistic issue status changes
 */
export const useOptimisticIssueStatus = () => {
  const { updateIssue, optimisticIssue, isOptimistic } = useUpdateIssueEffect();

  const updateStatus = useCallback(async (
    issueId: number,
    newStatus: string,
    currentIssue: Issue
  ): Promise<Issue> => {
    return updateIssue(issueId, { status: newStatus }, currentIssue);
  }, [updateIssue]);

  return {
    updateStatus,
    optimisticIssue,
    isOptimistic
  };
};

/**
 * Hook for Kanban-specific operations with optimistic updates
 */
export const useOptimisticKanban = () => {
  const { updateIssue } = useUpdateIssueEffect();

  const moveIssue = useCallback(async (
    issueId: number,
    newStatus: string,
    newPosition: number,
    currentIssue: Issue
  ): Promise<Issue> => {
    return updateIssue(
      issueId,
      {
        status: newStatus,
        position: newPosition,
      },
      currentIssue
    );
  }, [updateIssue]);

  const moveToProject = useCallback(async (
    issueId: number,
    newProjectId: number,
    currentIssue: Issue
  ): Promise<Issue> => {
    return updateIssue(
      issueId,
      {
        projectId: newProjectId,
        sprintId: null // Reset sprint when moving projects
      },
      currentIssue
    );
  }, [updateIssue]);

  return {
    moveIssue,
    moveToProject
  };
};

/**
 * Hook for batch issue operations
 */
export const useBatchIssueOperations = () => {
  const batchUpdate = useCallback(async (
    updates: Array<{ id: number; updates: UpdateIssueRequest }>
  ): Promise<Issue[]> => {
    const updateEffects = updates.map(({ id, updates: updateData }) =>
      Effect.tryPromise({
        try: async () => {
          const response = await fetch(`/api/issues/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          return response.json();
        },
        catch: (error) => new Error(`Batch update failed: ${String(error)}`)
      })
    );

    // Run all updates concurrently
    const results = await Promise.all(
      updateEffects.map(effect => Effect.runPromise(effect))
    );

    return results;
  }, []);

  return {
    batchUpdate
  };
};

/**
 * Hook for issue search with debouncing
 */
export const useIssueSearch = () => {
  const { execute, ...state } = useAsyncEffect((query: string, projectId?: number) =>
    Effect.tryPromise({
      try: async () => {
        const url = projectId
          ? `/api/issues/search?q=${encodeURIComponent(query)}&projectId=${projectId}`
          : `/api/issues/search?q=${encodeURIComponent(query)}`;

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return response.json();
      },
      catch: (error) => new Error(`Search failed: ${String(error)}`)
    }) as Effect.Effect<Issue[], ApiError, never>
  );

  return {
    ...state,
    search: execute
  };
};