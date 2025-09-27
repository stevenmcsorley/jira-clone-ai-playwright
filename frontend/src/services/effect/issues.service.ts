/**
 * Issues Service with Effect.ts
 *
 * Migrated from traditional Promise-based service to Effect.ts with enhanced features
 */

import { Effect, pipe } from 'effect';
import * as Schema from 'effect/Schema';
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
  IssueSchema,
  IssuesArraySchema,
  CreateIssueRequestSchema,
  UpdateIssueRequestSchema,
  DeleteResponseSchema,
  type Issue,
  type CreateIssueRequest,
  type UpdateIssueRequest
} from './schemas';
import type { ApiError } from '../../lib/effect-config';

// Cache configuration
const ISSUES_CACHE_TTL = 30000; // 30 seconds
const ISSUE_DETAIL_CACHE_TTL = 60000; // 1 minute

export class EffectIssuesService {
  /**
   * Get all issues with caching
   */
  static getAll = (): Effect.Effect<Issue[], ApiError, never> =>
    pipe(
      cachedRequest(
        'issues:all',
        ISSUES_CACHE_TTL,
        get('/issues', IssuesArraySchema)
      ),
      logRequest('getAll')
    );

  /**
   * Get issues by project with caching
   */
  static getByProject = (projectId: number): Effect.Effect<Issue[], ApiError, never> =>
    pipe(
      cachedRequest(
        `issues:project:${projectId}`,
        ISSUES_CACHE_TTL,
        get(`/issues?projectId=${projectId}`, IssuesArraySchema)
      ),
      logRequest(`getByProject(${projectId})`)
    );

  /**
   * Get issue by ID with caching
   */
  static getById = (id: number): Effect.Effect<Issue, ApiError, never> =>
    pipe(
      cachedRequest(
        `issue:${id}`,
        ISSUE_DETAIL_CACHE_TTL,
        get(`/issues/${id}`, IssueSchema)
      ),
      logRequest(`getById(${id})`)
    );

  /**
   * Create new issue with optimistic updates
   */
  static create = (data: CreateIssueRequest): Effect.Effect<Issue, ApiError, never> => {
    // Create optimistic issue for immediate UI feedback
    const optimisticIssue: Issue = {
      id: Date.now(), // Temporary ID
      title: data.title,
      description: data.description || null,
      status: data.status || 'todo',
      priority: data.priority,
      type: data.type,
      projectId: data.projectId,
      assigneeId: data.assigneeId || null,
      reporterId: data.reporterId,
      estimate: data.estimate || null,
      labels: data.labels || [],
      position: 0,
      epicId: data.epicId || null,
      sprintId: data.sprintId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const actualOperation = pipe(
      post('/issues', data, IssueSchema),
      logRequest('create')
    );

    return withOptimisticUpdate({
      optimisticValue: optimisticIssue,
      actualOperation,
      onRollback: (error, optimistic) => {
        console.error('Failed to create issue, rolling back:', error);
        // Here you could emit an event to remove the optimistic issue from UI
      },
      onSuccess: (actual, optimistic) => {
        console.log('Issue created successfully:', actual);
        // Clear related caches
        this.clearCache(data.projectId);
      }
    });
  };

  /**
   * Update issue with optimistic updates
   */
  static update = (
    id: number,
    data: UpdateIssueRequest
  ): Effect.Effect<Issue, ApiError, never> => {
    const actualOperation = pipe(
      patch(`/issues/${id}`, data, IssueSchema),
      Effect.tap(() => Effect.sync(() => {
        // Clear caches when issue is updated
        this.clearCacheForIssue(id);
        if (data.projectId) {
          this.clearCache(data.projectId);
        }
      })),
      logRequest(`update(${id})`)
    );

    // For updates, we might want to get the current issue first for optimistic value
    return actualOperation;
  };

  /**
   * Update issue with optimistic status change (common operation)
   */
  static updateStatus = (
    id: number,
    newStatus: Issue['status'],
    currentIssue?: Issue
  ): Effect.Effect<Issue, ApiError, never> => {
    if (currentIssue) {
      // Use optimistic update with current issue data
      const optimisticIssue: Issue = {
        ...currentIssue,
        status: newStatus,
        updatedAt: new Date(),
      };

      const actualOperation = pipe(
        patch(`/issues/${id}`, { status: newStatus }, IssueSchema),
        Effect.tap(() => Effect.sync(() => {
          this.clearCacheForIssue(id);
          this.clearCache(currentIssue.projectId);
        })),
        logRequest(`updateStatus(${id}, ${newStatus})`)
      );

      return withOptimisticUpdate({
        optimisticValue: optimisticIssue,
        actualOperation,
        onRollback: (error, optimistic) => {
          console.error(`Failed to update issue status to ${newStatus}, rolling back:`, error);
          // Emit event to revert status in UI
        },
        onSuccess: (actual) => {
          console.log(`Issue status successfully updated to ${newStatus}:`, actual);
        }
      });
    }

    // Fallback to regular update if no current issue provided
    return this.update(id, { status: newStatus });
  };

  /**
   * Delete issue
   */
  static delete = (id: number): Effect.Effect<void, ApiError, never> =>
    pipe(
      del(`/issues/${id}`, DeleteResponseSchema),
      Effect.tap(() => Effect.sync(() => {
        // Clear all related caches
        this.clearCacheForIssue(id);
      })),
      logRequest(`delete(${id})`)
    );

  /**
   * Batch update multiple issues
   */
  static batchUpdate = (
    updates: Array<{ id: number; data: UpdateIssueRequest }>
  ): Effect.Effect<Issue[], ApiError, never> => {
    const updateEffects = updates.map(({ id, data }) =>
      this.update(id, data)
    );

    return Effect.all(updateEffects, {
      concurrency: 'unbounded'
    });
  };

  /**
   * Move issue to different project (complex operation)
   */
  static moveToProject = (
    issueId: number,
    newProjectId: number,
    currentIssue?: Issue
  ): Effect.Effect<Issue, ApiError, never> => {
    const updateData: UpdateIssueRequest = {
      projectId: newProjectId,
      // Reset sprint when moving to different project
      sprintId: null
    };

    if (currentIssue) {
      const optimisticIssue: Issue = {
        ...currentIssue,
        projectId: newProjectId,
        sprintId: null,
        updatedAt: new Date(),
      };

      const actualOperation = pipe(
        this.update(issueId, updateData),
        Effect.tap(() => Effect.sync(() => {
          // Clear caches for both old and new projects
          this.clearCache(currentIssue.projectId);
          this.clearCache(newProjectId);
        }))
      );

      return withOptimisticUpdate({
        optimisticValue: optimisticIssue,
        actualOperation,
        onRollback: (error) => {
          console.error('Failed to move issue to new project, rolling back:', error);
        },
        onSuccess: (actual) => {
          console.log('Issue successfully moved to new project:', actual);
        }
      });
    }

    return this.update(issueId, updateData);
  };

  /**
   * Cache management
   */
  private static clearCache(projectId: number): void {
    // In a real implementation, you'd have a proper cache invalidation system
    // This is a simplified version
    console.log(`Clearing cache for project ${projectId}`);
  }

  private static clearCacheForIssue(issueId: number): void {
    console.log(`Clearing cache for issue ${issueId}`);
  }

  /**
   * Search issues (with debouncing support)
   */
  static search = (
    query: string,
    projectId?: number
  ): Effect.Effect<Issue[], ApiError, never> => {
    const searchUrl = projectId
      ? `/issues/search?q=${encodeURIComponent(query)}&projectId=${projectId}`
      : `/issues/search?q=${encodeURIComponent(query)}`;

    return pipe(
      get(searchUrl, IssuesArraySchema),
      logRequest(`search("${query}")`)
    );
  };

  /**
   * Get issues by sprint
   */
  static getBySprint = (sprintId: number): Effect.Effect<Issue[], ApiError, never> =>
    pipe(
      cachedRequest(
        `issues:sprint:${sprintId}`,
        ISSUES_CACHE_TTL,
        get(`/issues?sprintId=${sprintId}`, IssuesArraySchema)
      ),
      logRequest(`getBySprint(${sprintId})`)
    );

  /**
   * Get issues by epic
   */
  static getByEpic = (epicId: number): Effect.Effect<Issue[], ApiError, never> =>
    pipe(
      cachedRequest(
        `issues:epic:${epicId}`,
        ISSUES_CACHE_TTL,
        get(`/issues?epicId=${epicId}`, IssuesArraySchema)
      ),
      logRequest(`getByEpic(${epicId})`)
    );
}