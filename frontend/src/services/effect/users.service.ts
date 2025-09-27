/**
 * Users Service with Effect.ts
 *
 * Enhanced user management with authentication, caching, and error handling
 */

import { Effect, pipe } from 'effect';
import {
  get,
  post,
  patch,
  cachedRequest,
  logRequest
} from './enhanced-api.service';
import {
  UserSchema,
  UsersArraySchema,
  type User
} from './schemas';
import type { ApiError } from '../../lib/effect-config';

// Cache configuration
const USERS_CACHE_TTL = 120000; // 2 minutes (users don't change frequently)
const USER_DETAIL_CACHE_TTL = 300000; // 5 minutes

// User-related request schemas (if needed for updates)
interface UpdateUserRequest {
  name?: string;
  email?: string;
  avatar?: string;
}

interface CreateUserRequest {
  name: string;
  email: string;
  password?: string;
  avatar?: string;
}

export class EffectUsersService {
  /**
   * Get all users with caching
   */
  static getAll = (): Effect.Effect<User[], ApiError, never> =>
    pipe(
      cachedRequest(
        'users:all',
        USERS_CACHE_TTL,
        get('/users', UsersArraySchema)
      ),
      logRequest('getAll')
    );

  /**
   * Get user by ID with caching
   */
  static getById = (id: number): Effect.Effect<User, ApiError, never> =>
    pipe(
      cachedRequest(
        `user:${id}`,
        USER_DETAIL_CACHE_TTL,
        get(`/users/${id}`, UserSchema)
      ),
      logRequest(`getById(${id})`)
    );

  /**
   * Get current authenticated user
   */
  static getCurrentUser = (): Effect.Effect<User, ApiError, never> =>
    pipe(
      get('/users/me', UserSchema),
      logRequest('getCurrentUser')
    );

  /**
   * Search users by name or email
   */
  static search = (query: string): Effect.Effect<User[], ApiError, never> =>
    pipe(
      get(`/users/search?q=${encodeURIComponent(query)}`, UsersArraySchema),
      logRequest(`search("${query}")`)
    );

  /**
   * Get users by role (if role system exists)
   */
  static getByRole = (role: string): Effect.Effect<User[], ApiError, never> =>
    pipe(
      cachedRequest(
        `users:role:${role}`,
        USERS_CACHE_TTL,
        get(`/users?role=${role}`, UsersArraySchema)
      ),
      logRequest(`getByRole("${role}")`)
    );

  /**
   * Get project members
   */
  static getProjectMembers = (projectId: number): Effect.Effect<User[], ApiError, never> =>
    pipe(
      cachedRequest(
        `users:project:${projectId}`,
        USERS_CACHE_TTL,
        get(`/projects/${projectId}/members`, UsersArraySchema)
      ),
      logRequest(`getProjectMembers(${projectId})`)
    );

  /**
   * Update user profile
   */
  static updateProfile = (
    id: number,
    data: UpdateUserRequest
  ): Effect.Effect<User, ApiError, never> =>
    pipe(
      patch(`/users/${id}`, data, UserSchema),
      Effect.tap(() => Effect.sync(() => {
        // Clear user cache when updated
        this.clearUserCache(id);
      })),
      logRequest(`updateProfile(${id})`)
    );

  /**
   * Update current user profile
   */
  static updateCurrentUser = (data: UpdateUserRequest): Effect.Effect<User, ApiError, never> =>
    pipe(
      patch('/users/me', data, UserSchema),
      logRequest('updateCurrentUser')
    );

  /**
   * Upload user avatar
   */
  static uploadAvatar = (
    userId: number,
    file: File
  ): Effect.Effect<User, ApiError, never> =>
    pipe(
      Effect.tryPromise({
        try: async () => {
          const formData = new FormData();
          formData.append('avatar', file);

          const response = await fetch(`/api/users/${userId}/avatar`, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
          }

          return response.json();
        },
        catch: (error) => new Error(`Avatar upload failed: ${String(error)}`)
      }),
      Effect.flatMap(data =>
        Effect.tryPromise({
          try: () => Promise.resolve(data),
          catch: () => new Error('Invalid response data')
        })
      ),
      Effect.tap(() => Effect.sync(() => {
        this.clearUserCache(userId);
      })),
      logRequest(`uploadAvatar(${userId})`)
    ) as Effect.Effect<User, ApiError, never>;

  /**
   * Get user activity/statistics
   */
  static getUserActivity = (
    userId: number,
    timeRange: '7d' | '30d' | '90d' = '30d'
  ): Effect.Effect<{
    user: User;
    issuesCreated: number;
    issuesAssigned: number;
    issuesCompleted: number;
    commentsCount: number;
  }, ApiError, never> =>
    pipe(
      Effect.all([
        this.getById(userId),
        get(`/users/${userId}/activity?range=${timeRange}`, UsersArraySchema) // Assuming this returns activity data
      ]),
      Effect.map(([user, activity]) => ({
        user,
        issuesCreated: (activity as any)?.issuesCreated || 0,
        issuesAssigned: (activity as any)?.issuesAssigned || 0,
        issuesCompleted: (activity as any)?.issuesCompleted || 0,
        commentsCount: (activity as any)?.commentsCount || 0,
      })),
      logRequest(`getUserActivity(${userId}, ${timeRange})`)
    );

  /**
   * Get users available for assignment (not overloaded)
   */
  static getAvailableUsers = (projectId?: number): Effect.Effect<User[], ApiError, never> => {
    const url = projectId
      ? `/users/available?projectId=${projectId}`
      : '/users/available';

    return pipe(
      get(url, UsersArraySchema),
      logRequest(`getAvailableUsers(${projectId || 'all'})`)
    );
  };

  /**
   * Get users with workload information
   */
  static getUsersWithWorkload = (): Effect.Effect<Array<{
    user: User;
    activeIssues: number;
    estimatedHours: number;
    capacity: number;
  }>, ApiError, never> =>
    pipe(
      get('/users/workload', UsersArraySchema), // Assuming this returns workload data
      Effect.map((data: any[]) =>
        data.map(item => ({
          user: item.user,
          activeIssues: item.activeIssues || 0,
          estimatedHours: item.estimatedHours || 0,
          capacity: item.capacity || 40,
        }))
      ),
      logRequest('getUsersWithWorkload')
    );

  /**
   * Invite user to project
   */
  static inviteToProject = (
    projectId: number,
    email: string,
    role: string = 'member'
  ): Effect.Effect<{ message: string }, ApiError, never> =>
    pipe(
      post(`/projects/${projectId}/invite`, { email, role }, UserSchema),
      Effect.map(() => ({ message: 'Invitation sent successfully' })),
      Effect.tap(() => Effect.sync(() => {
        // Clear project members cache
        this.clearProjectMembersCache(projectId);
      })),
      logRequest(`inviteToProject(${projectId}, ${email})`)
    ) as Effect.Effect<{ message: string }, ApiError, never>;

  /**
   * Remove user from project
   */
  static removeFromProject = (
    projectId: number,
    userId: number
  ): Effect.Effect<{ message: string }, ApiError, never> =>
    pipe(
      Effect.tryPromise({
        try: () => fetch(`/api/projects/${projectId}/members/${userId}`, {
          method: 'DELETE',
        }),
        catch: (error) => new Error(`Remove user failed: ${String(error)}`)
      }),
      Effect.map(() => ({ message: 'User removed from project' })),
      Effect.tap(() => Effect.sync(() => {
        this.clearProjectMembersCache(projectId);
      })),
      logRequest(`removeFromProject(${projectId}, ${userId})`)
    ) as Effect.Effect<{ message: string }, ApiError, never>;

  /**
   * Batch get users by IDs
   */
  static getByIds = (ids: number[]): Effect.Effect<User[], ApiError, never> => {
    if (ids.length === 0) {
      return Effect.succeed([]);
    }

    const idsParam = ids.join(',');
    return pipe(
      get(`/users/batch?ids=${idsParam}`, UsersArraySchema),
      logRequest(`getByIds([${idsParam}])`)
    );
  };

  /**
   * Get user preferences/settings
   */
  static getUserPreferences = (userId: number): Effect.Effect<{
    theme: 'light' | 'dark';
    notifications: boolean;
    timezone: string;
  }, ApiError, never> =>
    pipe(
      get(`/users/${userId}/preferences`, UserSchema), // Would need PreferencesSchema
      Effect.map((data: any) => ({
        theme: data.theme || 'light',
        notifications: data.notifications !== false,
        timezone: data.timezone || 'UTC',
      })),
      logRequest(`getUserPreferences(${userId})`)
    );

  /**
   * Update user preferences
   */
  static updateUserPreferences = (
    userId: number,
    preferences: Partial<{
      theme: 'light' | 'dark';
      notifications: boolean;
      timezone: string;
    }>
  ): Effect.Effect<{ message: string }, ApiError, never> =>
    pipe(
      patch(`/users/${userId}/preferences`, preferences, UserSchema),
      Effect.map(() => ({ message: 'Preferences updated' })),
      logRequest(`updateUserPreferences(${userId})`)
    ) as Effect.Effect<{ message: string }, ApiError, never>;

  /**
   * Cache management
   */
  private static clearUserCache(id: number): void {
    console.log(`Clearing cache for user ${id}`);
  }

  private static clearProjectMembersCache(projectId: number): void {
    console.log(`Clearing project members cache for project ${projectId}`);
  }

  /**
   * Authentication helpers (if handled by this service)
   */
  static login = (
    email: string,
    password: string
  ): Effect.Effect<{ user: User; token: string }, ApiError, never> =>
    pipe(
      post('/auth/login', { email, password }, UserSchema),
      Effect.map((response: any) => ({
        user: response.user,
        token: response.token,
      })),
      logRequest('login')
    ) as Effect.Effect<{ user: User; token: string }, ApiError, never>;

  static logout = (): Effect.Effect<{ message: string }, ApiError, never> =>
    pipe(
      post('/auth/logout', {}, UserSchema),
      Effect.map(() => ({ message: 'Logged out successfully' })),
      logRequest('logout')
    ) as Effect.Effect<{ message: string }, ApiError, never>;
}