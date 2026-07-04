# Ossicone

A self-hosted project tracker (Jira-style boards, sprints, backlog, reports) built with React, TypeScript, NestJS, and PostgreSQL — designed to be driven by humans in the browser **and** by AI agents through its API / MCP server.

> An ossicone is one of the horns on a giraffe's head. This is the halfagiraf project tracker.

## Features

- **Kanban board** with drag-and-drop, sprints, and backlog planning
- **Issue tracking**: stories/tasks/bugs/epics, priorities, story points, labels, subtasks, comments, attachments, issue links, time tracking with live timers
- **Reports**: velocity, burndown, burnup, cumulative flow, sprint health
- **Planning poker** estimation sessions
- **Real authentication**: email/password login (JWT), admin-managed users
- **API tokens** for scripts and AI agents — the same API surface the UI uses
- **Real-time updates** via WebSockets

## Tech stack

- **Frontend**: React 18 + TypeScript, Vite, TailwindCSS, @dnd-kit
- **Backend**: NestJS + TypeORM, PostgreSQL 15, Redis, Socket.IO, MinIO
- **Infra**: Docker Compose

## Quick start

```bash
docker compose up -d --build

# First run only: seed the admin user + demo project
docker compose exec backend node seed.js
```

Then open http://localhost:5173 and sign in:

- **Email**: `admin@ossicone.local`
- **Password**: `ossicone`

Change the password after first login (or seed with `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars). Additional users are added from the **People** page (avatar menu → People) by an admin.

No host `npm install` is needed — backend and frontend dependencies live in named Docker volumes, so native modules (bcrypt) are always built for the container platform. If you change `package.json`, rebuild with `docker compose up -d --build` and remove the stale volume if needed (`docker volume rm <project>_backend_node_modules`).

Services:
- Frontend: http://localhost:5173
- Backend API: http://localhost:4000
- MinIO console: http://localhost:9001 (minio/minio123)

## Authentication

- **Browser**: `POST /api/auth/login` issues a 7-day JWT; the SPA stores it and attaches it to every `/api` request. `GET /api/auth/me` returns the current user.
- **Agents/scripts**: create an API token (`POST /api/tokens` while authenticated), then send `Authorization: Bearer <token>`. Both credential types are accepted on every endpoint.
- All endpoints require auth except `POST /api/auth/login`. Admin role is required to create/delete users.

## API

See `API.md` for the endpoint reference. The schema is managed by TypeORM (`synchronize` in development); `db_schema_summary.md` documents the tables.

## Testing

```bash
cd e2e-tests && npm test        # Playwright/Cucumber e2e
cd backend && npm run test      # backend unit tests
```

## Deployment

Production deployment (nginx-served frontend build, secrets via env, Cloudflare tunnel) — see `docker-compose.prod.yml` (coming with the Pi deployment).

## License

MIT
