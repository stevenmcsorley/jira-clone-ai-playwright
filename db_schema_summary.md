# Jira Clone Database Schema Summary

**Generated:** 2025-09-30  
**Database:** PostgreSQL 15  
**Total Tables:** 14

## Table Overview

| Table | Rows | Description |
|-------|------|-------------|
| **issues** | 192 | Core issue tracking (stories, bugs, tasks, epics) |
| **sprints** | 46 | Sprint management and planning |
| **time_logs** | 30 | Time tracking entries for issues |
| **comments** | 13 | Issue comments and discussions |
| **projects** | 3 | Project containers |
| **users** | 0 | User accounts and profiles |
| **attachments** | 0 | File attachments for issues |
| **subtasks** | 0 | Sub-task relationships |
| **issue_links** | 0 | Issue relationships (blocks, relates to, etc.) |
| **estimation_sessions** | 0 | Planning poker sessions |
| **estimation_participants** | 0 | Planning poker participants |
| **estimation_votes** | 0 | Planning poker votes |
| **session_issues** | 0 | Issues in estimation sessions |
| **api_tokens** | 0 | API authentication tokens |

## Schema Files

- **Full Schema Dump:** `db_schema_dump.sql` (1,236 lines)
- **Database User:** `jira_clone`
- **Database Name:** `jira_clone`

## Key Relationships

```
projects (1) ───→ (N) sprints
projects (1) ───→ (N) issues
sprints (1) ───→ (N) issues
issues (1) ───→ (N) time_logs
issues (1) ───→ (N) comments
issues (1) ───→ (N) subtasks
issues (1) ───→ (N) attachments
users (1) ───→ (N) issues (assignee)
users (1) ───→ (N) issues (reporter)
users (1) ───→ (N) time_logs
```

## Table Descriptions

### Core Tables

#### **issues**
Main issue tracking table supporting:
- Types: story, task, bug, epic
- Statuses: todo, in_progress, code_review, done
- Priorities: low, medium, high, urgent
- Fields: title, description, estimate, storyPoints, labels
- Relationships: project, sprint, assignee, reporter, epic

#### **time_logs**
Automatic and manual time tracking:
- Fields: hours, description, date
- Links to: issue, user
- Supports: automatic timer tracking, manual entries

#### **sprints**
Sprint lifecycle management:
- Statuses: planned, active, completed
- Fields: name, goal, startDate, endDate
- Position-based ordering for backlog

#### **comments**
Issue discussion threads:
- Fields: content
- Links to: issue, author
- Supports: threaded discussions

### Feature Tables

#### **attachments**
File upload support:
- Fields: filename, url, size, mimeType
- Links to: issue, uploaded by user

#### **subtasks**
Hierarchical task breakdown:
- Links parent issues to child subtasks
- Supports task decomposition

#### **issue_links**
Issue relationships:
- Types: blocks, is blocked by, relates to, duplicates
- Bidirectional linking

### Planning Poker Tables

#### **estimation_sessions**
Planning poker game sessions:
- Fields: title, status, votingSystem
- Links to: project

#### **estimation_participants**
Session participants:
- Links: session, user
- Tracks participation

#### **estimation_votes**
Individual votes:
- Fields: vote value
- Links: session, issue, user

#### **session_issues**
Issues in estimation:
- Links estimation sessions to issues

### Authentication

#### **api_tokens**
API authentication:
- Fields: token, name, expiresAt
- Links to: user

## Recent Changes

### Time Tracking Enhancements (2025-09-30)
- ✅ Removed minimum time logging restrictions (0.1h → 0.001h)
- ✅ Added validation to skip logging when time elapsed = 0
- ✅ Fixed automatic timer integration with kanban drag-and-drop
- ✅ Timer now properly starts/stops with issue status changes

### Sprint Validation (2025-09-30)
- ✅ Added validation to prevent completing sprints without dates
- ✅ Fixed null date handling in burnup/burndown reports

## Connection Info

```bash
# Docker container
docker exec -it jira-clone-postgres-1 psql -U jira_clone -d jira_clone

# Connection string
postgres://jira_clone:secret@localhost:5432/jira_clone
```
