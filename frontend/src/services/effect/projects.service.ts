/**
 * Projects Service with Effect.ts
 *
 * Enhanced project management with caching, optimistic updates, and robust error handling
 */

import { Effect, pipe } from 'effect';
import {
  get,
  post,
  patch,
  del,
  withOptimisticUpdate,
  cachedRequest,
  logRequest
} from './enhanced-api.service';
import {
  ProjectSchema,
  ProjectsArraySchema,
  CreateProjectRequestSchema,
  UpdateProjectRequestSchema,
  DeleteResponseSchema,
  type Project,
  type CreateProjectRequest,
  type UpdateProjectRequest
} from './schemas';
import type { ApiError } from '../../lib/effect-config';

// Cache configuration
const PROJECTS_CACHE_TTL = 60000; // 1 minute (projects change less frequently)
const PROJECT_DETAIL_CACHE_TTL = 120000; // 2 minutes

export class EffectProjectsService {
  /**
   * Get all projects with caching
   */
  static getAll = (): Effect.Effect<Project[], ApiError, never> =>
    pipe(
      cachedRequest(
        'projects:all',
        PROJECTS_CACHE_TTL,
        get('/projects', ProjectsArraySchema)
      ),
      logRequest('getAll')
    );

  /**
   * Get project by ID with caching
   */
  static getById = (id: number): Effect.Effect<Project, ApiError, never> =>
    pipe(
      cachedRequest(
        `project:${id}`,
        PROJECT_DETAIL_CACHE_TTL,
        get(`/projects/${id}`, ProjectSchema)
      ),
      logRequest(`getById(${id})`)
    );

  /**
   * Create new project with optimistic updates
   */
  static create = (data: CreateProjectRequest): Effect.Effect<Project, ApiError, never> => {
    // Create optimistic project for immediate UI feedback
    const optimisticProject: Project = {
      id: Date.now(), // Temporary ID
      name: data.name,
      key: data.key,
      description: data.description || null,
      leadId: data.leadId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const actualOperation = pipe(
      post('/projects', data, ProjectSchema),
      Effect.tap(() => Effect.sync(() => {
        // Clear projects cache when new project is created
        this.clearAllProjectsCache();
      })),
      logRequest('create')
    );

    return withOptimisticUpdate({
      optimisticValue: optimisticProject,
      actualOperation,
      onRollback: (error, optimistic) => {
        console.error('Failed to create project, rolling back:', error);
        // Emit event to remove optimistic project from UI
      },
      onSuccess: (actual, optimistic) => {
        console.log('Project created successfully:', actual);
      }
    });
  };

  /**
   * Update project
   */
  static update = (
    id: number,
    data: UpdateProjectRequest
  ): Effect.Effect<Project, ApiError, never> =>
    pipe(
      patch(`/projects/${id}`, data, ProjectSchema),
      Effect.tap(() => Effect.sync(() => {
        // Clear caches when project is updated
        this.clearProjectCache(id);
        this.clearAllProjectsCache();
      })),
      logRequest(`update(${id})`)
    );

  /**
   * Update project with optimistic updates
   */
  static updateOptimistic = (
    id: number,
    data: UpdateProjectRequest,
    currentProject?: Project
  ): Effect.Effect<Project, ApiError, never> => {
    if (currentProject) {
      const optimisticProject: Project = {
        ...currentProject,
        ...data,
        updatedAt: new Date(),
      };

      const actualOperation = pipe(
        this.update(id, data),
        logRequest(`updateOptimistic(${id})`)
      );

      return withOptimisticUpdate({
        optimisticValue: optimisticProject,
        actualOperation,
        onRollback: (error, optimistic) => {
          console.error('Failed to update project, rolling back:', error);
          // Emit event to revert project in UI
        },
        onSuccess: (actual) => {
          console.log('Project successfully updated:', actual);
        }
      });
    }

    // Fallback to regular update
    return this.update(id, data);
  };

  /**
   * Delete project
   */
  static delete = (id: number): Effect.Effect<void, ApiError, never> =>
    pipe(
      del(`/projects/${id}`, DeleteResponseSchema),
      Effect.tap(() => Effect.sync(() => {
        // Clear all related caches
        this.clearProjectCache(id);
        this.clearAllProjectsCache();
      })),
      logRequest(`delete(${id})`)
    );

  /**
   * Get projects by lead
   */
  static getByLead = (leadId: number): Effect.Effect<Project[], ApiError, never> =>
    pipe(
      cachedRequest(
        `projects:lead:${leadId}`,
        PROJECTS_CACHE_TTL,
        get(`/projects?leadId=${leadId}`, ProjectsArraySchema)
      ),
      logRequest(`getByLead(${leadId})`)
    );

  /**
   * Search projects
   */
  static search = (query: string): Effect.Effect<Project[], ApiError, never> =>
    pipe(
      get(`/projects/search?q=${encodeURIComponent(query)}`, ProjectsArraySchema),
      logRequest(`search("${query}")`)
    );

  /**
   * Get project statistics (example of complex data fetching)
   */
  static getStatistics = (id: number): Effect.Effect<{
    project: Project;
    issueCount: number;
    completedIssues: number;
    activeIssues: number;
  }, ApiError, never> =>
    pipe(
      Effect.all([
        this.getById(id),
        // These would be separate API calls in real implementation
        get(`/projects/${id}/statistics`, ProjectsArraySchema) // Assuming this returns stats
      ]),
      Effect.map(([project, stats]) => ({
        project,
        issueCount: (stats as any)?.issueCount || 0,
        completedIssues: (stats as any)?.completedIssues || 0,
        activeIssues: (stats as any)?.activeIssues || 0,
      })),
      logRequest(`getStatistics(${id})`)
    );

  /**
   * Batch operations for multiple projects
   */
  static batchUpdate = (
    updates: Array<{ id: number; data: UpdateProjectRequest }>
  ): Effect.Effect<Project[], ApiError, never> => {
    const updateEffects = updates.map(({ id, data }) =>
      this.update(id, data)
    );

    return Effect.all(updateEffects, {
      concurrency: 'unbounded'
    });
  };

  /**
   * Archive project (soft delete alternative)
   */
  static archive = (
    id: number,
    currentProject?: Project
  ): Effect.Effect<Project, ApiError, never> => {
    const archiveData = { archived: true };

    if (currentProject) {
      const optimisticProject: Project = {
        ...currentProject,
        // archived: true, // This would require adding archived field to schema
        updatedAt: new Date(),
      };

      const actualOperation = pipe(
        patch(`/projects/${id}/archive`, {}, ProjectSchema),
        Effect.tap(() => Effect.sync(() => {
          this.clearProjectCache(id);
          this.clearAllProjectsCache();
        })),
        logRequest(`archive(${id})`)
      );

      return withOptimisticUpdate({
        optimisticValue: optimisticProject,
        actualOperation,
        onRollback: (error) => {
          console.error('Failed to archive project, rolling back:', error);
        },
        onSuccess: (actual) => {
          console.log('Project successfully archived:', actual);
        }
      });
    }

    return pipe(
      patch(`/projects/${id}/archive`, {}, ProjectSchema),
      logRequest(`archive(${id})`)
    );
  };

  /**
   * Get project members (if this endpoint exists)
   */
  static getMembers = (id: number): Effect.Effect<any[], ApiError, never> =>
    pipe(
      cachedRequest(
        `project:${id}:members`,
        PROJECTS_CACHE_TTL,
        get(`/projects/${id}/members`, ProjectsArraySchema) // Would need UserArraySchema
      ),
      logRequest(`getMembers(${id})`)
    );

  /**
   * Cache management helpers
   */
  private static clearAllProjectsCache(): void {
    console.log('Clearing all projects cache');
    // In real implementation, you'd have proper cache invalidation
  }

  private static clearProjectCache(id: number): void {
    console.log(`Clearing cache for project ${id}`);
  }

  /**
   * Bulk operations support
   */
  static bulkDelete = (ids: number[]): Effect.Effect<void[], ApiError, never> => {
    const deleteEffects = ids.map(id => this.delete(id));
    return Effect.all(deleteEffects, { concurrency: 3 }); // Limit concurrency
  };

  /**
   * Export project data (example of complex operation)
   */
  static exportData = (
    id: number,
    format: 'json' | 'csv' = 'json'
  ): Effect.Effect<Blob, ApiError, never> =>
    pipe(
      Effect.tryPromise({
        try: () => fetch(`/api/projects/${id}/export?format=${format}`),
        catch: (error) => new Error(`Export failed: ${String(error)}`)
      }),
      Effect.flatMap(response =>
        Effect.tryPromise({
          try: () => response.blob(),
          catch: (error) => new Error(`Failed to get export data: ${String(error)}`)
        })
      ),
      logRequest(`exportData(${id}, ${format})`)
    ) as Effect.Effect<Blob, ApiError, never>;
}