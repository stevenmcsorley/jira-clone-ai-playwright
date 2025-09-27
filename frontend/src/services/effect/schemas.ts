/**
 * Effect.ts Schemas for API Responses
 *
 * This file contains all the schemas used to validate API responses using Effect.ts Schema
 */

import * as Schema from 'effect/Schema';

// Base Schemas
export const DateTimeString = Schema.String.pipe(
  Schema.transform(
    Schema.String,
    (s: string) => new Date(s),
    (d: Date) => d.toISOString()
  )
);

// User Schema
export const UserSchema = Schema.Struct({
  id: Schema.Number,
  email: Schema.String,
  name: Schema.String,
  avatar: Schema.NullishOr(Schema.String),
  createdAt: DateTimeString,
  updatedAt: DateTimeString,
});

// Project Schema
export const ProjectSchema = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
  key: Schema.String,
  description: Schema.NullishOr(Schema.String),
  leadId: Schema.Number,
  lead: Schema.optional(UserSchema),
  createdAt: DateTimeString,
  updatedAt: DateTimeString,
});

// Issue Enums
export const IssueStatusSchema = Schema.Literal('todo', 'in_progress', 'code_review', 'done');
export const IssuePrioritySchema = Schema.Literal('low', 'medium', 'high', 'urgent');
export const IssueTypeSchema = Schema.Literal('story', 'task', 'bug', 'epic');

// Issue Schema (with self-reference for epic/epicIssues)
export const IssueSchema = Schema.Struct({
  id: Schema.Number,
  title: Schema.String,
  description: Schema.NullishOr(Schema.String),
  status: IssueStatusSchema,
  priority: IssuePrioritySchema,
  type: IssueTypeSchema,
  projectId: Schema.Number,
  project: Schema.optional(ProjectSchema),
  assigneeId: Schema.NullishOr(Schema.Number),
  assignee: Schema.optional(UserSchema),
  reporterId: Schema.Number,
  reporter: Schema.optional(UserSchema),
  estimate: Schema.NullishOr(Schema.Number),
  labels: Schema.Array(Schema.String),
  position: Schema.Number,
  epicId: Schema.NullishOr(Schema.Number),
  epic: Schema.optional(Schema.suspend(() => IssueSchema)),
  epicIssues: Schema.optional(Schema.Array(Schema.suspend(() => IssueSchema))),
  sprintId: Schema.NullishOr(Schema.Number),
  createdAt: DateTimeString,
  updatedAt: DateTimeString,
});

// Comment Schema
export const CommentSchema = Schema.Struct({
  id: Schema.Number,
  content: Schema.String,
  issueId: Schema.Number,
  authorId: Schema.Number,
  author: Schema.optional(UserSchema),
  createdAt: DateTimeString,
  updatedAt: DateTimeString,
});

// Attachment Schema
export const AttachmentSchema = Schema.Struct({
  id: Schema.Number,
  filename: Schema.String,
  originalName: Schema.String,
  mimetype: Schema.String,
  size: Schema.Number,
  issueId: Schema.Number,
  uploadedById: Schema.Number,
  uploadedBy: Schema.optional(UserSchema),
  createdAt: DateTimeString,
});

// Sprint Schema
export const SprintSchema = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
  goal: Schema.NullishOr(Schema.String),
  startDate: Schema.NullishOr(DateTimeString),
  endDate: Schema.NullishOr(DateTimeString),
  projectId: Schema.Number,
  project: Schema.optional(ProjectSchema),
  status: Schema.Literal('planning', 'active', 'completed'),
  createdAt: DateTimeString,
  updatedAt: DateTimeString,
});

// Request/Response Schemas
export const CreateIssueRequestSchema = Schema.Struct({
  title: Schema.String,
  description: Schema.optional(Schema.String),
  status: Schema.optional(IssueStatusSchema),
  priority: IssuePrioritySchema,
  type: IssueTypeSchema,
  projectId: Schema.Number,
  assigneeId: Schema.optional(Schema.Number),
  reporterId: Schema.Number,
  estimate: Schema.optional(Schema.Number),
  labels: Schema.optional(Schema.Array(Schema.String)),
  epicId: Schema.optional(Schema.Number),
  sprintId: Schema.optional(Schema.Number),
});

export const UpdateIssueRequestSchema = Schema.partial(CreateIssueRequestSchema);

export const CreateProjectRequestSchema = Schema.Struct({
  name: Schema.String,
  key: Schema.String,
  description: Schema.optional(Schema.String),
  leadId: Schema.Number,
});

export const UpdateProjectRequestSchema = Schema.partial(CreateProjectRequestSchema);

// Array Schemas
export const IssuesArraySchema = Schema.Array(IssueSchema);
export const ProjectsArraySchema = Schema.Array(ProjectSchema);
export const UsersArraySchema = Schema.Array(UserSchema);
export const CommentsArraySchema = Schema.Array(CommentSchema);
export const AttachmentsArraySchema = Schema.Array(AttachmentSchema);

// Success Response Schema
export const SuccessResponseSchema = Schema.Struct({
  message: Schema.String,
});

// Delete Response (empty)
export const DeleteResponseSchema = Schema.Void;

// API Response Wrapper (if needed)
export const ApiResponseSchema = <T>(dataSchema: Schema.Schema<T>) =>
  Schema.Struct({
    data: dataSchema,
    status: Schema.Number,
    message: Schema.optional(Schema.String),
  });

// Export types for TypeScript
export type User = Schema.Schema.Type<typeof UserSchema>;
export type Project = Schema.Schema.Type<typeof ProjectSchema>;
export type Issue = Schema.Schema.Type<typeof IssueSchema>;
export type Comment = Schema.Schema.Type<typeof CommentSchema>;
export type Attachment = Schema.Schema.Type<typeof AttachmentSchema>;
export type Sprint = Schema.Schema.Type<typeof SprintSchema>;

export type CreateIssueRequest = Schema.Schema.Type<typeof CreateIssueRequestSchema>;
export type UpdateIssueRequest = Schema.Schema.Type<typeof UpdateIssueRequestSchema>;
export type CreateProjectRequest = Schema.Schema.Type<typeof CreateProjectRequestSchema>;
export type UpdateProjectRequest = Schema.Schema.Type<typeof UpdateProjectRequestSchema>;

export type IssueStatus = Schema.Schema.Type<typeof IssueStatusSchema>;
export type IssuePriority = Schema.Schema.Type<typeof IssuePrioritySchema>;
export type IssueType = Schema.Schema.Type<typeof IssueTypeSchema>;