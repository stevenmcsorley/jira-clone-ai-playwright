/**
 * Projects Effect.ts React Hooks
 *
 * Enhanced hooks for project management with optimistic updates and caching
 */

import { useMemo, useCallback } from 'react';
import { Effect } from 'effect';
import { useEffectHook, useAsyncEffect, useOptimisticUpdate, useBackgroundSync } from './useEffect';
import { fetchProjects } from '../../services/effect/demo-service';
import type { ApiError } from '../../lib/effect-config';

// Types (using simplified types for now)
interface Project {
  id: number;
  name: string;
  key: string;
  description?: string;
  leadId: number;
  createdAt: string;
  updatedAt: string;
  lead?: {
    id: number;
    name: string;
    email: string;
  };
}

interface CreateProjectRequest {
  name: string;
  key: string;
  description?: string;
  leadId: number;
}

interface UpdateProjectRequest extends Partial<CreateProjectRequest> {}

/**
 * Enhanced hook for fetching projects with caching and background sync
 */
export const useProjectsEffect = () => {
  // Create the effect for fetching projects
  const fetchEffect = useMemo(() => fetchProjects(), []);

  // Main data fetching with caching
  const {
    data: projects,
    loading,
    error,
    refetch
  } = useEffectHook<Project[]>(fetchEffect, {
    initialData: [],
    immediate: true
  });

  // Background sync disabled - preventing continuous polling
  // const { lastSync, isSyncing } = useBackgroundSync(
  //   fetchEffect,
  //   120000, // Sync every 2 minutes
  //   !loading
  // );
  const lastSync = null;
  const isSyncing = false;

  return {
    projects: projects || [],
    loading,
    error,
    refetch,
    lastSync,
    isSyncing
  };
};

/**
 * Hook for creating projects with optimistic updates
 */
export const useCreateProjectEffect = () => {
  const { optimisticData, isOptimistic, performOptimisticUpdate } = useOptimisticUpdate<Project>();

  const createProject = useCallback(async (projectData: CreateProjectRequest): Promise<Project> => {
    // Create optimistic project
    const optimisticProject: Project = {
      id: Date.now(), // Temporary ID
      name: projectData.name,
      key: projectData.key,
      description: projectData.description,
      leadId: projectData.leadId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Create the actual Effect for API call
    const createEffect = Effect.tryPromise({
      try: async () => {
        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(projectData)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return response.json();
      },
      catch: (error) => new Error(`Create project failed: ${String(error)}`)
    }) as Effect.Effect<Project, ApiError, never>;

    return performOptimisticUpdate(
      optimisticProject,
      createEffect,
      (error) => {
        console.error('Failed to create project, rolling back:', error);
      }
    );
  }, [performOptimisticUpdate]);

  return {
    createProject,
    optimisticProject: optimisticData,
    isOptimistic
  };
};

/**
 * Hook for updating projects with optimistic updates
 */
export const useUpdateProjectEffect = () => {
  const { optimisticData, isOptimistic, performOptimisticUpdate } = useOptimisticUpdate<Project>();

  const updateProject = useCallback(async (
    projectId: number,
    updates: UpdateProjectRequest,
    currentProject?: Project
  ): Promise<Project> => {
    // Create optimistic project if we have current data
    const optimisticProject: Project = currentProject ? {
      ...currentProject,
      ...updates,
      updatedAt: new Date().toISOString()
    } : null;

    // Create the actual Effect for API call
    const updateEffect = Effect.tryPromise({
      try: async () => {
        const response = await fetch(`/api/projects/${projectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return response.json();
      },
      catch: (error) => new Error(`Update project failed: ${String(error)}`)
    }) as Effect.Effect<Project, ApiError, never>;

    // If we don't have current project, just run the effect normally
    if (!optimisticProject) {
      return Effect.runPromise(updateEffect);
    }

    return performOptimisticUpdate(
      optimisticProject,
      updateEffect,
      (error) => {
        console.error('Failed to update project, rolling back:', error);
      }
    );
  }, [performOptimisticUpdate]);

  return {
    updateProject,
    optimisticProject: optimisticData,
    isOptimistic
  };
};

/**
 * Hook for project statistics and analytics
 */
export const useProjectStatistics = (projectId: number) => {
  const statisticsEffect = useMemo(() => {
    return Effect.tryPromise({
      try: async () => {
        const response = await fetch(`/api/projects/${projectId}/statistics`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      },
      catch: (error) => new Error(`Failed to load statistics: ${String(error)}`)
    });
  }, [projectId]);

  const {
    data: statistics,
    loading,
    error,
    refetch
  } = useEffectHook(statisticsEffect, {
    dependencies: [projectId],
    immediate: !!projectId
  });

  return {
    statistics,
    loading,
    error,
    refetch
  };
};

/**
 * Hook for project members management
 */
export const useProjectMembers = (projectId: number) => {
  const membersEffect = useMemo(() => {
    return Effect.tryPromise({
      try: async () => {
        const response = await fetch(`/api/projects/${projectId}/members`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      },
      catch: (error) => new Error(`Failed to load members: ${String(error)}`)
    });
  }, [projectId]);

  const {
    data: members,
    loading,
    error,
    refetch
  } = useEffectHook(membersEffect, {
    dependencies: [projectId],
    immediate: !!projectId
  });

  const addMember = useCallback(async (email: string, role: string = 'member') => {
    const addEffect = Effect.tryPromise({
      try: async () => {
        const response = await fetch(`/api/projects/${projectId}/invite`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, role })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return response.json();
      },
      catch: (error) => new Error(`Failed to add member: ${String(error)}`)
    });

    const result = await Effect.runPromise(addEffect);
    refetch(); // Refresh members list
    return result;
  }, [projectId, refetch]);

  const removeMember = useCallback(async (userId: number) => {
    const removeEffect = Effect.tryPromise({
      try: async () => {
        const response = await fetch(`/api/projects/${projectId}/members/${userId}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return response.json();
      },
      catch: (error) => new Error(`Failed to remove member: ${String(error)}`)
    });

    const result = await Effect.runPromise(removeEffect);
    refetch(); // Refresh members list
    return result;
  }, [projectId, refetch]);

  return {
    members: members || [],
    loading,
    error,
    refetch,
    addMember,
    removeMember
  };
};

/**
 * Hook for project search functionality
 */
export const useProjectSearch = () => {
  const { execute, ...state } = useAsyncEffect((query: string) =>
    Effect.tryPromise({
      try: async () => {
        const response = await fetch(`/api/projects/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      },
      catch: (error) => new Error(`Project search failed: ${String(error)}`)
    }) as Effect.Effect<Project[], ApiError, never>
  );

  return {
    ...state,
    search: execute
  };
};

/**
 * Hook for project settings management
 */
export const useProjectSettings = (projectId: number) => {
  const settingsEffect = useMemo(() => {
    return Effect.tryPromise({
      try: async () => {
        const response = await fetch(`/api/projects/${projectId}/settings`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      },
      catch: (error) => new Error(`Failed to load settings: ${String(error)}`)
    });
  }, [projectId]);

  const {
    data: settings,
    loading,
    error,
    refetch
  } = useEffectHook(settingsEffect, {
    dependencies: [projectId],
    immediate: !!projectId
  });

  const updateSettings = useCallback(async (newSettings: Record<string, any>) => {
    const updateEffect = Effect.tryPromise({
      try: async () => {
        const response = await fetch(`/api/projects/${projectId}/settings`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSettings)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return response.json();
      },
      catch: (error) => new Error(`Failed to update settings: ${String(error)}`)
    });

    const result = await Effect.runPromise(updateEffect);
    refetch(); // Refresh settings
    return result;
  }, [projectId, refetch]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    refetch
  };
};

/**
 * Hook for project archival/deletion
 */
export const useProjectManagement = () => {
  const archiveProject = useCallback(async (projectId: number): Promise<void> => {
    const archiveEffect = Effect.tryPromise({
      try: async () => {
        const response = await fetch(`/api/projects/${projectId}/archive`, {
          method: 'PATCH'
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return response.json();
      },
      catch: (error) => new Error(`Failed to archive project: ${String(error)}`)
    });

    await Effect.runPromise(archiveEffect);
  }, []);

  const deleteProject = useCallback(async (projectId: number): Promise<void> => {
    const deleteEffect = Effect.tryPromise({
      try: async () => {
        const response = await fetch(`/api/projects/${projectId}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return response.json();
      },
      catch: (error) => new Error(`Failed to delete project: ${String(error)}`)
    });

    await Effect.runPromise(deleteEffect);
  }, []);

  return {
    archiveProject,
    deleteProject
  };
};