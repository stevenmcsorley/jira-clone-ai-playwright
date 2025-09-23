# Claude AI Integration Guide

This guide explains how Claude and other AI agents can effectively interact with the Jira Clone API.

## Quick Start for Claude

### Basic Setup
```javascript
const BASE_URL = 'http://localhost:4000/api'

// Helper function for API calls
async function apiCall(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  }
  if (data) options.body = JSON.stringify(data)

  const response = await fetch(`${BASE_URL}${endpoint}`, options)
  return response.json()
}
```

## Common Claude Use Cases

### 1. Creating Issues from User Requests

When a user asks Claude to create a task:

```javascript
// Example: "Create a task to implement user authentication"
async function createTask(title, description, priority = 'medium') {
  // Get the default project
  const projects = await apiCall('/projects')
  const project = projects[0] // Use first project or find by name

  // Create the issue
  const issue = await apiCall('/issues', 'POST', {
    title,
    description,
    status: 'todo',
    priority,
    type: 'task',
    projectId: project.id,
    reporterId: 1 // Default user (could be Claude's user ID)
  })

  return `Created task: ${issue.title} (${project.key}-${issue.id})`
}
```

### 2. Managing Project Status

```javascript
// Check project progress
async function getProjectStatus(projectId) {
  const issues = await apiCall(`/issues?projectId=${projectId}`)

  const stats = {
    total: issues.length,
    todo: issues.filter(i => i.status === 'todo').length,
    in_progress: issues.filter(i => i.status === 'in_progress').length,
    done: issues.filter(i => i.status === 'done').length
  }

  const progress = Math.round((stats.done / stats.total) * 100)

  return `Project progress: ${progress}% complete (${stats.done}/${stats.total} issues)`
}
```

### 3. Triaging and Prioritizing

```javascript
// Find and prioritize urgent issues
async function findUrgentIssues() {
  const issues = await apiCall('/issues')

  const urgent = issues.filter(i =>
    i.type === 'bug' &&
    i.priority === 'high' &&
    i.status !== 'done'
  )

  return urgent.map(issue =>
    `${issue.project.key}-${issue.id}: ${issue.title} (${issue.status})`
  )
}
```

### 4. Assigning Work

```javascript
// Assign issues to team members
async function assignIssue(issueId, assigneeName) {
  // Find user by name
  const users = await apiCall('/users')
  const assignee = users.find(u =>
    u.name.toLowerCase().includes(assigneeName.toLowerCase())
  )

  if (!assignee) {
    return `User "${assigneeName}" not found`
  }

  // Update issue
  await apiCall(`/issues/${issueId}`, 'PATCH', {
    assigneeId: assignee.id,
    status: 'in_progress'
  })

  return `Assigned issue to ${assignee.name}`
}
```

## Integration with Development Workflow

### Git Integration Example
```javascript
// When Claude helps with code, it can create follow-up tasks
async function createFollowUpTask(codeContext, suggestions) {
  const task = await apiCall('/issues', 'POST', {
    title: `Code review: ${codeContext.filename}`,
    description: `
Suggested improvements:
${suggestions.map(s => `- ${s}`).join('\n')}

File: ${codeContext.filename}
Function: ${codeContext.functionName}
    `,
    status: 'todo',
    priority: 'medium',
    type: 'task',
    projectId: 1,
    reporterId: 1,
    labels: ['code-review', 'claude-generated']
  })

  return task
}
```

### Error Handling and Logging
```javascript
async function createErrorReport(error, context) {
  const issue = await apiCall('/issues', 'POST', {
    title: `Error: ${error.message}`,
    description: `
**Error Details:**
- Message: ${error.message}
- Stack: ${error.stack}
- Context: ${JSON.stringify(context, null, 2)}
- Timestamp: ${new Date().toISOString()}

**Environment:**
- User Agent: ${navigator.userAgent}
- URL: ${window.location.href}
    `,
    status: 'todo',
    priority: 'high',
    type: 'bug',
    projectId: 1,
    reporterId: 1,
    labels: ['error-report', 'auto-generated']
  })

  return issue
}
```

## Best Practices for AI Agents

### 1. Always Check Project Context
```javascript
// Before creating issues, understand the project structure
async function getProjectContext() {
  const projects = await apiCall('/projects')
  const projectSummary = await Promise.all(
    projects.map(async project => {
      const issues = await apiCall(`/issues?projectId=${project.id}`)
      return {
        ...project,
        issueCount: issues.length,
        activeIssues: issues.filter(i => i.status !== 'done').length
      }
    })
  )
  return projectSummary
}
```

### 2. Use Descriptive Labels
```javascript
// Always add relevant labels for tracking
const commonLabels = {
  aiGenerated: 'ai-generated',
  automated: 'automated',
  codeReview: 'code-review',
  bugReport: 'bug-report',
  enhancement: 'enhancement',
  documentation: 'documentation'
}
```

### 3. Provide Detailed Descriptions
```javascript
// Template for AI-generated issue descriptions
function createIssueDescription(type, details) {
  return `
## ${type} Details

${details.summary}

## Context
- Generated by: Claude AI
- Triggered by: ${details.trigger}
- Priority Rationale: ${details.priorityReason}

## Acceptance Criteria
${details.criteria.map(c => `- [ ] ${c}`).join('\n')}

## Additional Notes
${details.notes || 'None'}
  `.trim()
}
```

## Advanced Patterns

### 1. Issue Dependencies
```javascript
// Create related issues and link them in descriptions
async function createFeatureWithTasks(featureName, tasks) {
  // Create epic
  const epic = await apiCall('/issues', 'POST', {
    title: `Epic: ${featureName}`,
    description: `Implementation of ${featureName}`,
    type: 'epic',
    status: 'todo',
    priority: 'medium',
    projectId: 1,
    reporterId: 1
  })

  // Create subtasks
  const subtasks = await Promise.all(
    tasks.map(task => apiCall('/issues', 'POST', {
      title: task.title,
      description: `Part of Epic: ${featureName} (${epic.project.key}-${epic.id})\n\n${task.description}`,
      type: 'task',
      status: 'todo',
      priority: task.priority || 'medium',
      projectId: 1,
      reporterId: 1,
      labels: ['subtask', `epic-${epic.id}`]
    }))
  )

  return { epic, subtasks }
}
```

### 2. Smart Prioritization
```javascript
// AI-driven priority assignment based on context
function determinePriority(issueType, keywords, context) {
  const urgentKeywords = ['critical', 'production', 'security', 'data loss']
  const highKeywords = ['bug', 'broken', 'not working', 'error']

  if (issueType === 'bug' && urgentKeywords.some(k => keywords.includes(k))) {
    return 'urgent'
  }

  if (highKeywords.some(k => keywords.includes(k))) {
    return 'high'
  }

  return 'medium'
}
```

## Testing the Integration

### Health Check
```javascript
async function healthCheck() {
  try {
    const projects = await apiCall('/projects')
    const users = await apiCall('/users')
    const issues = await apiCall('/issues')

    return {
      status: 'healthy',
      data: {
        projects: projects.length,
        users: users.length,
        issues: issues.length
      }
    }
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    }
  }
}
```

This integration guide provides Claude with all the necessary patterns and examples to effectively manage the Jira Clone system.