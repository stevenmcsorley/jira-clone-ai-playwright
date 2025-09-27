/**
 * Effect.ts Services Index
 *
 * Central export point for all Effect.ts-powered services
 */

// Core API utilities
export * from './enhanced-api.service';

// Schemas
export * from './schemas';

// Services
export { EffectIssuesService as IssuesService } from './issues.service';
export { EffectProjectsService as ProjectsService } from './projects.service';
export { EffectUsersService as UsersService } from './users.service';

// Re-export types from schemas for convenience
export type {
  User,
  Project,
  Issue,
  Comment,
  Attachment,
  Sprint,
  CreateIssueRequest,
  UpdateIssueRequest,
  CreateProjectRequest,
  UpdateProjectRequest,
  IssueStatus,
  IssuePriority,
  IssueType
} from './schemas';