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
  status: 'todo' | 'in_progress' | 'code_review' | 'done'
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
  epicId?: number
  epic?: Issue // Parent epic (if this is not an epic)
  epicIssues?: Issue[] // Child issues (if this is an epic)
  sprintId?: number
  sprint?: Sprint
  createdAt: Date
  updatedAt: Date
}
```

### Subtask
```typescript
interface Subtask {
  id: number
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'code_review' | 'done'
  parentIssueId: number
  assigneeId?: number
  assignee?: User
  estimate?: number
  position: number
  createdAt: Date
  updatedAt: Date
}
```

### Comment
```typescript
interface Comment {
  id: number
  content: string
  issueId: number
  authorId: number
  author: User
  parentId?: number
  isEdited: boolean
  editedAt?: Date
  createdAt: Date
  updatedAt: Date
  replies?: Comment[]
}
```

### TimeLog
```typescript
interface TimeLog {
  id: number
  hours: number
  description?: string
  date: Date
  issueId: number
  userId: number
  user: User
  createdAt: Date
}
```

### Attachment
```typescript
interface Attachment {
  id: number
  filename: string
  originalName: string
  mimeType: string
  size: number
  path: string
  issueId: number
  uploadedById: number
  uploadedBy: User
  createdAt: Date
}
```

### Sprint
```typescript
interface Sprint {
  id: number
  name: string
  goal?: string
  status: 'future' | 'active' | 'completed'
  projectId: number
  startDate?: Date
  endDate?: Date
  position: number
  issues: Issue[]
  createdById: number
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
  "status": "todo" | "in_progress" | "code_review" | "done",
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
    "status": "todo" | "in_progress" | "code_review" | "done"
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

### Subtasks

#### Create Subtask
```http
POST /api/subtasks
```
**Body:**
```json
{
  "title": "string",
  "description": "string", // optional
  "parentIssueId": "number",
  "assigneeId": "number", // optional
  "estimate": "number" // optional
}
```
**Response:** Created Subtask object

#### Get Subtasks by Issue
```http
GET /api/subtasks/issue/:issueId
```
**Parameters:**
- `issueId` (number): Parent issue ID

**Response:** Array of Subtask objects

#### Get Subtask Progress
```http
GET /api/subtasks/issue/:issueId/progress
```
**Parameters:**
- `issueId` (number): Parent issue ID

**Response:**
```json
{
  "completed": "number",
  "total": "number",
  "percentage": "number"
}
```

#### Get Subtask by ID
```http
GET /api/subtasks/:id
```
**Parameters:**
- `id` (number): Subtask ID

**Response:** Subtask object

#### Update Subtask
```http
PATCH /api/subtasks/:id
```
**Parameters:**
- `id` (number): Subtask ID

**Body:** Partial Subtask object
**Response:** Updated Subtask object

#### Reorder Subtasks
```http
POST /api/subtasks/issue/:issueId/reorder
```
**Parameters:**
- `issueId` (number): Parent issue ID

**Body:**
```json
{
  "subtaskIds": ["number"] // Array of subtask IDs in desired order
}
```
**Response:** No content (204)

#### Delete Subtask
```http
DELETE /api/subtasks/:id
```
**Parameters:**
- `id` (number): Subtask ID

**Response:** No content (204)

### Comments

#### Create Comment
```http
POST /api/comments
```
**Body:**
```json
{
  "content": "string",
  "issueId": "number",
  "parentId": "number" // optional for replies
}
```
**Response:** Created Comment object

#### Get Comments by Issue
```http
GET /api/comments/issue/:issueId
```
**Parameters:**
- `issueId` (number): Issue ID

**Response:** Array of Comment objects with nested replies

#### Get Comment by ID
```http
GET /api/comments/:id
```
**Parameters:**
- `id` (number): Comment ID

**Response:** Comment object

#### Update Comment
```http
PATCH /api/comments/:id
```
**Parameters:**
- `id` (number): Comment ID

**Body:**
```json
{
  "content": "string"
}
```
**Response:** Updated Comment object

#### Delete Comment
```http
DELETE /api/comments/:id
```
**Parameters:**
- `id` (number): Comment ID

**Response:** No content (204)

### Time Tracking

#### Log Time
```http
POST /api/time-tracking/log
```
**Body:**
```json
{
  "hours": "number", // e.g., 2.5 for 2 hours 30 minutes
  "description": "string", // optional
  "date": "string", // ISO date string, e.g., "2024-01-15"
  "issueId": "number"
}
```
**Response:** Created TimeLog object

#### Get Time Logs by Issue
```http
GET /api/time-tracking/issue/:issueId
```
**Parameters:**
- `issueId` (number): Issue ID

**Response:** Array of TimeLog objects

#### Get Time Tracking Summary
```http
GET /api/time-tracking/issue/:issueId/summary
```
**Parameters:**
- `issueId` (number): Issue ID

**Response:**
```json
{
  "totalTimeSpent": "number",
  "originalEstimate": "number",
  "remainingEstimate": "number",
  "timeSpentByUser": [
    {
      "userId": "number",
      "userName": "string",
      "hours": "number"
    }
  ],
  "recentTimeLogs": [TimeLog]
}
```

#### Get Time Log by ID
```http
GET /api/time-tracking/log/:id
```
**Parameters:**
- `id` (number): Time log ID

**Response:** TimeLog object

#### Update Time Log
```http
PATCH /api/time-tracking/log/:id
```
**Parameters:**
- `id` (number): Time log ID

**Body:** Partial TimeLog object
**Response:** Updated TimeLog object

#### Delete Time Log
```http
DELETE /api/time-tracking/log/:id
```
**Parameters:**
- `id` (number): Time log ID

**Response:** No content (204)

#### Parse Time Input
```http
POST /api/time-tracking/parse-time
```
**Body:**
```json
{
  "timeStr": "string" // e.g., "2h 30m", "1.5h", "90m"
}
```
**Response:**
```json
{
  "hours": "number",
  "formatted": "string",
  "error": "string" // if parsing failed
}
```

### Attachments

#### Upload File
```http
POST /api/attachments/upload/:issueId
```
**Parameters:**
- `issueId` (number): Issue ID

**Body:** Multipart form data with `file` field
**Response:** Created Attachment object

#### Get Attachments by Issue
```http
GET /api/attachments/issue/:issueId
```
**Parameters:**
- `issueId` (number): Issue ID

**Response:** Array of Attachment objects

#### Get Attachment by ID
```http
GET /api/attachments/:id
```
**Parameters:**
- `id` (number): Attachment ID

**Response:** Attachment object

#### Download File
```http
GET /api/attachments/download/:id
```
**Parameters:**
- `id` (number): Attachment ID

**Response:** File download with appropriate headers

#### Delete Attachment
```http
DELETE /api/attachments/:id
```
**Parameters:**
- `id` (number): Attachment ID

**Response:** No content (204)

### Sprints

#### Create Sprint
```http
POST /api/sprints
```
**Body:**
```json
{
  "name": "string",
  "goal": "string", // optional
  "projectId": "number",
  "createdById": "number"
}
```
**Response:** Created Sprint object

#### Get Sprints by Project
```http
GET /api/sprints?projectId=:projectId
```
**Query Parameters:**
- `projectId` (number): Project ID

**Response:** Array of Sprint objects with related issues, ordered by position

#### Get Sprint by ID
```http
GET /api/sprints/:id
```
**Parameters:**
- `id` (number): Sprint ID

**Response:** Sprint object with related issues and project

#### Update Sprint
```http
PATCH /api/sprints/:id
```
**Parameters:**
- `id` (number): Sprint ID

**Body:** Partial Sprint object
**Response:** Updated Sprint object

#### Start Sprint
```http
POST /api/sprints/:id/start
```
**Parameters:**
- `id` (number): Sprint ID

**Body:**
```json
{
  "startDate": "string", // ISO date string
  "endDate": "string"    // ISO date string
}
```

**Common Duration Templates:**
- 1 Day: `endDate = new Date(startDate.getTime() + 1 * 24 * 60 * 60 * 1000)`
- 1 Week: `endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000)`
- 2 Weeks (Recommended): `endDate = new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000)`
- Custom: Calculate based on desired number of days

**Response:** Updated Sprint object with status 'active'

#### Complete Sprint
```http
POST /api/sprints/:id/complete
```
**Parameters:**
- `id` (number): Sprint ID

**Response:** Updated Sprint object with status 'completed'

#### Add Issue to Sprint
```http
POST /api/sprints/:id/add-issue/:issueId
```
**Parameters:**
- `id` (number): Sprint ID
- `issueId` (number): Issue ID

**Response:** No content (204)

#### Remove Issue from Sprint
```http
POST /api/sprints/remove-issue/:issueId
```
**Parameters:**
- `issueId` (number): Issue ID

**Response:** No content (204)

#### Get Backlog Issues
```http
GET /api/sprints/backlog?projectId=:projectId
```
**Query Parameters:**
- `projectId` (number): Project ID

**Response:** Array of Issue objects not assigned to any sprint

#### Delete Sprint
```http
DELETE /api/sprints/:id
```
**Parameters:**
- `id` (number): Sprint ID

**Note:** All issues in the sprint are moved back to the backlog

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

### 4. Creating a Complete Issue with Subtasks and Time Tracking
```javascript
// Step 1: Create main issue
const mainIssue = await fetch('http://localhost:4000/api/issues', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Implement user authentication',
    description: 'Add JWT-based authentication to the application',
    status: 'todo',
    priority: 'high',
    type: 'story',
    projectId: 1,
    reporterId: 1,
    estimate: 8,
    labels: ['authentication', 'security']
  })
}).then(r => r.json())

// Step 2: Create subtasks
const subtasks = [
  'Design authentication flow',
  'Implement JWT token generation',
  'Add login/logout endpoints',
  'Create user registration'
]

for (const subtaskTitle of subtasks) {
  await fetch('http://localhost:4000/api/subtasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: subtaskTitle,
      parentIssueId: mainIssue.id,
      estimate: 2
    })
  })
}

// Step 3: Add initial comment
await fetch('http://localhost:4000/api/comments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: 'Starting work on authentication implementation',
    issueId: mainIssue.id
  })
})
```

### 5. Time Tracking Workflow
```javascript
// Log time worked
await fetch('http://localhost:4000/api/time-tracking/log', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    hours: 2.5, // 2 hours 30 minutes
    description: 'Implemented JWT token generation logic',
    date: '2024-01-15',
    issueId: issueId
  })
})

// Get time tracking summary
const summary = await fetch(`http://localhost:4000/api/time-tracking/issue/${issueId}/summary`)
  .then(r => r.json())

console.log(`Total time spent: ${summary.totalTimeSpent} hours`)
console.log(`Contributors: ${summary.timeSpentByUser.length}`)
```

### 6. Managing Subtask Progress
```javascript
// Get subtask progress
const progress = await fetch(`http://localhost:4000/api/subtasks/issue/${issueId}/progress`)
  .then(r => r.json())

console.log(`Progress: ${progress.completed}/${progress.total} (${progress.percentage}%)`)

// Complete a subtask
await fetch(`http://localhost:4000/api/subtasks/${subtaskId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: 'done' })
})
```

### 7. File Attachments
```javascript
// Upload a file (requires FormData)
const formData = new FormData()
formData.append('file', fileBlob, 'screenshot.png')

const attachment = await fetch(`http://localhost:4000/api/attachments/upload/${issueId}`, {
  method: 'POST',
  body: formData
}).then(r => r.json())

// Get all attachments for an issue
const attachments = await fetch(`http://localhost:4000/api/attachments/issue/${issueId}`)
  .then(r => r.json())
```

### 8. Comment Threads
```javascript
// Add a main comment
const mainComment = await fetch('http://localhost:4000/api/comments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: 'This looks good, but we should add error handling',
    issueId: issueId
  })
}).then(r => r.json())

// Reply to the comment
await fetch('http://localhost:4000/api/comments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: 'Agreed, I will add try-catch blocks',
    issueId: issueId,
    parentId: mainComment.id
  })
})
```

### 9. Sprint Management Workflow
```javascript
// Step 1: Create a new sprint
const sprint = await fetch('http://localhost:4000/api/sprints', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Sprint 1',
    goal: 'Complete user authentication features',
    projectId: projectId,
    createdById: 1
  })
}).then(r => r.json())

// Step 2: Get backlog issues
const backlogIssues = await fetch(`http://localhost:4000/api/sprints/backlog?projectId=${projectId}`)
  .then(r => r.json())

// Step 3: Add selected issues to sprint
const selectedIssues = backlogIssues.slice(0, 5) // Take first 5 issues
for (const issue of selectedIssues) {
  await fetch(`http://localhost:4000/api/sprints/${sprint.id}/add-issue/${issue.id}`, {
    method: 'POST'
  })
}

// Step 4: Start the sprint with duration template
const startDate = new Date()
let endDate

// Choose sprint duration template
const sprintDuration = '2-weeks' // Options: '1-day', '1-week', '2-weeks', or custom number of days

switch (sprintDuration) {
  case '1-day':
    endDate = new Date(startDate.getTime() + 1 * 24 * 60 * 60 * 1000)
    break
  case '1-week':
    endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000)
    break
  case '2-weeks':
    endDate = new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000)
    break
  default:
    // For custom duration, use number of days
    const customDays = 21 // Example: 3 weeks
    endDate = new Date(startDate.getTime() + customDays * 24 * 60 * 60 * 1000)
}

const startedSprint = await fetch(`http://localhost:4000/api/sprints/${sprint.id}/start`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  })
}).then(r => r.json())

console.log(`Sprint "${startedSprint.name}" is now active`)

// Step 5: Later, complete the sprint
await fetch(`http://localhost:4000/api/sprints/${sprint.id}/complete`, {
  method: 'POST'
})
```

### 10. Epic and Issue Linking
```javascript
// Step 1: Create an epic
const epic = await fetch('http://localhost:4000/api/issues', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'User Management System',
    description: 'Complete user management functionality including auth, profiles, and permissions',
    status: 'todo',
    priority: 'high',
    type: 'epic',
    projectId: projectId,
    reporterId: 1,
    estimate: 40,
    labels: ['epic', 'user-management']
  })
}).then(r => r.json())

// Step 2: Create stories and link them to the epic
const stories = [
  'User Registration',
  'User Login',
  'Profile Management',
  'Password Reset'
]

for (const storyTitle of stories) {
  await fetch('http://localhost:4000/api/issues', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: storyTitle,
      status: 'todo',
      priority: 'medium',
      type: 'story',
      projectId: projectId,
      reporterId: 1,
      epicId: epic.id, // Link to epic
      estimate: 8
    })
  })
}
```

### 11. Sprint Reporting and Analytics
```javascript
// Get all sprints for reporting
const sprints = await fetch(`http://localhost:4000/api/sprints?projectId=${projectId}`)
  .then(r => r.json())

// Filter completed sprints for historical analysis
const completedSprints = sprints.filter(sprint => sprint.status === 'completed')

// Calculate sprint metrics for each completed sprint
const sprintReports = completedSprints.map(sprint => {
  const totalIssues = sprint.issues.length
  const completedIssues = sprint.issues.filter(issue => issue.status === 'done').length
  const completionRate = totalIssues > 0 ? (completedIssues / totalIssues) * 100 : 0

  const totalEstimate = sprint.issues.reduce((sum, issue) => sum + (issue.estimate || 0), 0)
  const completedEstimate = sprint.issues
    .filter(issue => issue.status === 'done')
    .reduce((sum, issue) => sum + (issue.estimate || 0), 0)

  const sprintDuration = sprint.startDate && sprint.endDate
    ? Math.ceil((new Date(sprint.endDate) - new Date(sprint.startDate)) / (1000 * 60 * 60 * 24))
    : null

  return {
    id: sprint.id,
    name: sprint.name,
    status: sprint.status,
    startDate: sprint.startDate,
    endDate: sprint.endDate,
    duration: sprintDuration,
    totalIssues,
    completedIssues,
    completionRate: Math.round(completionRate),
    totalEstimate,
    completedEstimate,
    velocity: completedEstimate, // Story points completed
    goal: sprint.goal
  }
})

console.log('Sprint Reports:', sprintReports)

// Calculate team velocity trend (last 5 sprints)
const recentSprints = sprintReports.slice(-5)
const averageVelocity = recentSprints.reduce((sum, sprint) => sum + sprint.velocity, 0) / recentSprints.length
console.log(`Team average velocity: ${Math.round(averageVelocity)} points per sprint`)
```

### 12. Bulk Operations
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