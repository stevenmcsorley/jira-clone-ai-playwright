/**
 * Working Effect.ts Services
 *
 * Simplified but functional services that compile and work correctly
 */

import { Effect } from 'effect';
import * as Schema from 'effect/Schema';
import { simpleApiCall, UserSchema } from './simple-api.service';
import type { ApiError } from '../../lib/effect-config';

// Working Issue Schema (simplified)
const WorkingIssueSchema = Schema.Struct({
  id: Schema.Number,
  title: Schema.String,
  description: Schema.NullishOr(Schema.String),
  status: Schema.String,
  priority: Schema.String,
  type: Schema.String,
  projectId: Schema.Number,
  assigneeId: Schema.NullishOr(Schema.Number),
  reporterId: Schema.Number,
  estimate: Schema.NullishOr(Schema.Number),
  labels: Schema.Array(Schema.String),
  position: Schema.Number,
  epicId: Schema.NullishOr(Schema.Number),
  sprintId: Schema.NullishOr(Schema.Number),
  createdAt: Schema.String,
  updatedAt: Schema.String,
});

// Working Project Schema (simplified)
const WorkingProjectSchema = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
  key: Schema.String,
  description: Schema.NullishOr(Schema.String),
  leadId: Schema.Number,
  createdAt: Schema.String,
  updatedAt: Schema.String,
});

// Array schemas
const IssuesArraySchema = Schema.Array(WorkingIssueSchema);
const ProjectsArraySchema = Schema.Array(WorkingProjectSchema);
const UsersArraySchema = Schema.Array(UserSchema);

// Types
export type WorkingIssue = Schema.Schema.Type<typeof WorkingIssueSchema>;
export type WorkingProject = Schema.Schema.Type<typeof WorkingProjectSchema>;
export type WorkingUser = Schema.Schema.Type<typeof UserSchema>;

// Working Issues Service
export class WorkingIssuesService {
  static getAll(): Effect.Effect<WorkingIssue[], ApiError, never> {
    return simpleApiCall('/issues', IssuesArraySchema);
  }

  static getByProject(projectId: number): Effect.Effect<WorkingIssue[], ApiError, never> {
    return simpleApiCall(`/issues?projectId=${projectId}`, IssuesArraySchema);
  }

  static getById(id: number): Effect.Effect<WorkingIssue, ApiError, never> {
    return simpleApiCall(`/issues/${id}`, WorkingIssueSchema);
  }

  static create(data: any): Effect.Effect<WorkingIssue, ApiError, never> {
    return Effect.gen(function* () {
      const response = yield* Effect.tryPromise({
        try: () => fetch('/api/issues', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }),
        catch: (error) => new Error(`Create failed: ${String(error)}`)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const json = yield* Effect.tryPromise({
        try: () => response.json(),
        catch: (error) => new Error(`Parse failed: ${String(error)}`)
      });

      return yield* Schema.decodeUnknown(WorkingIssueSchema)(json);
    }) as Effect.Effect<WorkingIssue, ApiError, never>;
  }

  static update(id: number, data: any): Effect.Effect<WorkingIssue, ApiError, never> {
    return Effect.gen(function* () {
      const response = yield* Effect.tryPromise({
        try: () => fetch(`/api/issues/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }),
        catch: (error) => new Error(`Update failed: ${String(error)}`)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const json = yield* Effect.tryPromise({
        try: () => response.json(),
        catch: (error) => new Error(`Parse failed: ${String(error)}`)
      });

      return yield* Schema.decodeUnknown(WorkingIssueSchema)(json);
    }) as Effect.Effect<WorkingIssue, ApiError, never>;
  }
}

// Working Projects Service
export class WorkingProjectsService {
  static getAll(): Effect.Effect<WorkingProject[], ApiError, never> {
    return simpleApiCall('/projects', ProjectsArraySchema);
  }

  static getById(id: number): Effect.Effect<WorkingProject, ApiError, never> {
    return simpleApiCall(`/projects/${id}`, WorkingProjectSchema);
  }

  static create(data: any): Effect.Effect<WorkingProject, ApiError, never> {
    return Effect.gen(function* () {
      const response = yield* Effect.tryPromise({
        try: () => fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }),
        catch: (error) => new Error(`Create failed: ${String(error)}`)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const json = yield* Effect.tryPromise({
        try: () => response.json(),
        catch: (error) => new Error(`Parse failed: ${String(error)}`)
      });

      return yield* Schema.decodeUnknown(WorkingProjectSchema)(json);
    }) as Effect.Effect<WorkingProject, ApiError, never>;
  }
}

// Working Users Service
export class WorkingUsersService {
  static getAll(): Effect.Effect<WorkingUser[], ApiError, never> {
    return simpleApiCall('/users', UsersArraySchema);
  }

  static getById(id: number): Effect.Effect<WorkingUser, ApiError, never> {
    return simpleApiCall(`/users/${id}`, UserSchema);
  }
}

// Simple test function
export const testWorkingServices = async () => {
  console.log('🧪 Testing working Effect.ts services...');

  // Test with Effect.runPromise
  try {
    const projectsEffect = WorkingProjectsService.getAll();
    const projects = await Effect.runPromise(projectsEffect);
    console.log('✅ Projects loaded:', projects.length);

    const usersEffect = WorkingUsersService.getAll();
    const users = await Effect.runPromise(usersEffect);
    console.log('✅ Users loaded:', users.length);

    if (projects.length > 0) {
      const issuesEffect = WorkingIssuesService.getByProject(projects[0].id);
      const issues = await Effect.runPromise(issuesEffect);
      console.log('✅ Issues loaded:', issues.length);
    }

    console.log('🎉 All working services tested successfully!');
    return true;
  } catch (error) {
    console.error('❌ Working services test failed:', error);
    return false;
  }
};