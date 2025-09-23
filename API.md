# Jira Clone REST API Documentation

This document provides comprehensive API documentation for the Jira Clone application, designed specifically for AI agent integration.

## Base URL
- Development: `http://localhost:4000`
- Production: TBD

## Authentication

The API supports API token authentication for AI agents and external integrations. Authentication is optional for basic usage but recommended for production environments.

### API Token Authentication

Include the API token in the Authorization header:

```http
Authorization: Bearer your_api_token_here
```

### Managing API Tokens

#### Create API Token
```http
POST /api/tokens
Content-Type: application/json

{
  "name": "Claude AI Agent",
  "description": "Token for Claude to manage issues",
  "userId": 1,
  "scopes": ["read", "write"],
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

**Response:**
```json
{
  "message": "API token created successfully",
  "token": "abc123...",
  "tokenInfo": {
    "id": 1,
    "name": "Claude AI Agent",
    "scopes": ["read", "write"],
    "expiresAt": "2024-12-31T23:59:59Z"
  }
}
```

#### List User's Tokens
```http
GET /api/tokens/user/:userId
```

#### Get Token Details
```http
GET /api/tokens/:id
```

#### Update Token
```http
PUT /api/tokens/:id
Authorization: Bearer your_token

{
  "name": "Updated Token Name",
  "scopes": ["read"]
}
```

#### Revoke Token
```http
POST /api/tokens/:id/revoke
Authorization: Bearer your_token
```

#### Validate Token
```http
GET /api/tokens/validate/:token
```

## Data Models

### User
```typescript
interface User {
  id: number
  email: string
  name: string
  avatar?: string
  createdAt: Date
  updatedAt: Date
}
```

### Project
```typescript
interface Project {
  id: number
  name: string
  key: string
  description: string
  leadId: number
  lead?: User
  issues?: Issue[]
  createdAt: Date
  updatedAt: Date
}
```

### Issue
```typescript
interface Issue {
  id: number
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  type: 'task' | 'story' | 'bug' | 'epic'
  projectId: number
  project?: Project
  assigneeId?: number
  assignee?: User
  reporterId: number
  reporter?: User
  estimate?: number
  labels: string[]
  position: number
  createdAt: Date
  updatedAt: Date
}
```

## API Endpoints

### Users

#### Get All Users
```http
GET /api/users
```
**Response:** Array of User objects

#### Get User by ID
```http
GET /api/users/:id
```
**Parameters:**
- `id` (number): User ID

**Response:** User object

#### Create User
```http
POST /api/users
```
**Body:**
```json
{
  "email": "string",
  "name": "string",
  "password": "string",
  "avatar": "string" // optional
}
```
**Response:** Created User object

#### Update User
```http
PATCH /api/users/:id
```
**Parameters:**
- `id` (number): User ID

**Body:** Partial User object
**Response:** Updated User object

#### Delete User
```http
DELETE /api/users/:id
```
**Parameters:**
- `id` (number): User ID

**Response:** No content (204)

### Projects

#### Get All Projects
```http
GET /api/projects
```
**Response:** Array of Project objects with related lead and issues

#### Get Project by ID
```http
GET /api/projects/:id
```
**Parameters:**
- `id` (number): Project ID

**Response:** Project object with related lead and issues

#### Create Project
```http
POST /api/projects
```
**Body:**
```json
{
  "name": "string",
  "key": "string", // unique project key (e.g., "JC")
  "description": "string",
  "leadId": "number"
}
```
**Response:** Created Project object

#### Update Project
```http
PATCH /api/projects/:id
```
**Parameters:**
- `id` (number): Project ID

**Body:** Partial Project object
**Response:** Updated Project object

#### Delete Project
```http
DELETE /api/projects/:id
```
**Parameters:**
- `id` (number): Project ID

**Response:** No content (204)

### Issues

#### Get All Issues
```http
GET /api/issues
```
**Query Parameters:**
- `projectId` (optional, number): Filter issues by project

**Response:** Array of Issue objects with related project, assignee, and reporter

#### Get Issues by Project
```http
GET /api/issues?projectId=:projectId
```
**Query Parameters:**
- `projectId` (number): Project ID

**Response:** Array of Issue objects ordered by position, then creation date

#### Get Issue by ID
```http
GET /api/issues/:id
```
**Parameters:**
- `id` (number): Issue ID

**Response:** Issue object with related project, assignee, and reporter

#### Create Issue
```http
POST /api/issues
```
**Body:**
```json
{
  "title": "string",
  "description": "string", // optional
  "status": "todo" | "in_progress" | "done",
  "priority": "low" | "medium" | "high" | "urgent",
  "type": "task" | "story" | "bug" | "epic",
  "projectId": "number",
  "assigneeId": "number", // optional
  "reporterId": "number",
  "estimate": "number", // optional
  "labels": ["string"] // optional array
}
```
**Response:** Created Issue object

#### Update Issue
```http
PATCH /api/issues/:id
```
**Parameters:**
- `id` (number): Issue ID

**Body:** Partial Issue object
**Response:** Updated Issue object

#### Reorder Issues
```http
POST /api/issues/reorder
```
**Body:**
```json
[
  {
    "id": "number",
    "position": "number",
    "status": "todo" | "in_progress" | "done"
  }
]
```
**Response:** No content (204)

#### Delete Issue
```http
DELETE /api/issues/:id
```
**Parameters:**
- `id` (number): Issue ID

**Response:** No content (204)

## Common Usage Patterns for AI Agents

### 1. Creating a Bug Report from Test Failures
```javascript
// Step 1: Get the project
const projects = await fetch('http://localhost:4000/api/projects').then(r => r.json())
const project = projects.find(p => p.key === 'JC') // or specific project

// Step 2: Create a bug issue
const bugIssue = await fetch('http://localhost:4000/api/issues', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Test failure: Login functionality broken',
    description: 'Automated test found that login fails with error: ...',
    status: 'todo',
    priority: 'high',
    type: 'bug',
    projectId: project.id,
    reporterId: 1, // Bot user ID
    labels: ['automated-test', 'ci-failure']
  })
}).then(r => r.json())
```

### 2. Updating Issue Status
```javascript
// Move issue to in progress
await fetch(`http://localhost:4000/api/issues/${issueId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: 'in_progress',
    assigneeId: userId
  })
})
```

### 3. Getting Current Kanban Board State
```javascript
// Get all issues for a project
const issues = await fetch(`http://localhost:4000/api/issues?projectId=${projectId}`)
  .then(r => r.json())

// Group by status
const board = {
  todo: issues.filter(i => i.status === 'todo'),
  in_progress: issues.filter(i => i.status === 'in_progress'),
  done: issues.filter(i => i.status === 'done')
}
```

### 4. Bulk Operations
```javascript
// Get all high priority bugs
const highPriorityBugs = await fetch('http://localhost:4000/api/issues')
  .then(r => r.json())
  .then(issues => issues.filter(i => i.priority === 'high' && i.type === 'bug'))

// Update multiple issues
for (const issue of highPriorityBugs) {
  await fetch(`http://localhost:4000/api/issues/${issue.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ priority: 'urgent' })
  })
}
```

## Error Responses

All endpoints return appropriate HTTP status codes:
- `200`: Success
- `201`: Created
- `204`: No Content
- `400`: Bad Request
- `404`: Not Found
- `500`: Internal Server Error

Error responses include a message:
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

## Future Enhancements

### Authentication (Planned)
Future versions will include API token authentication:
```http
Authorization: Bearer <api-token>
```

### WebSocket Support (Planned)
Real-time updates will be available via WebSocket connection at `/socket.io`

### Filtering and Search (Planned)
Advanced query parameters for filtering:
- `status`: Filter by issue status
- `priority`: Filter by priority
- `assigneeId`: Filter by assignee
- `search`: Full-text search across title and description

### Bulk Operations (Planned)
Dedicated bulk endpoints for efficiency:
- `POST /api/issues/bulk-update`
- `POST /api/issues/bulk-delete`