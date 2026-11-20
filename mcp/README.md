# Ossicone MCP server

Exposes the Ossicone project tracker as MCP tools so Claude (or any MCP client) can plan projects and track work Jira-style: create issues, plan sprints, move cards across the board, comment, log time, and pull sprint reports.

## Setup

1. Sign in to Ossicone and create an API token:

   ```bash
   # login → JWT
   curl -s -X POST http://localhost:4000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@ossicone.local","password":"<your password>"}'

   # create a token with the JWT
   curl -s -X POST http://localhost:4000/api/tokens \
     -H "Authorization: Bearer <jwt>" -H "Content-Type: application/json" \
     -d '{"name":"claude","description":"Claude MCP access"}'
   ```

   The `token` field in the response is shown once — save it.

2. Install dependencies: `cd mcp && npm install`

3. Register with Claude Code:

   ```bash
   claude mcp add ossicone \
     --env OSSICONE_URL=http://localhost:4000 \
     --env OSSICONE_API_TOKEN=<token> \
     -- node /path/to/repo/mcp/index.js
   ```

## Code Mode (the HTTP endpoint)

The hosted endpoint (`/mcp`) runs in **Code Mode**: instead of advertising every tool below (about 34 schemas, paid for by every session), it exposes just two:

- `search({ query, limit })` finds operations. An empty query returns a compact index of names; a query returns the best matches with their input schemas.
- `execute({ code })` runs an async JavaScript function in a QuickJS (WASM) sandbox with an `ossicone.*` namespace holding every operation listed under **Tools**. The sandbox has no network, filesystem or `require`; the only thing it can reach is those functions, which call the same authenticated API with the caller's own token, so scopes and workspace binding are unchanged. Results are returned as compact JSON, and a script can filter and combine several calls so only the final answer reaches the model's context.

There is a single endpoint; clients that were already connected to `/mcp` keep working with their existing sign-in. The stdio server (`node mcp/index.js`) still registers the individual tools, for local use.

Free to run: no Cloudflare account or paid plan is involved, the sandbox is in-process.

## Tools

| Area | Tools |
|---|---|
| Workspace | `get_workspace`, `list_workspaces` |
| Projects | `list_projects`, `create_project`, `list_users` |
| Board | `get_board`, `get_backlog`, `list_issues`, `search_issues` |
| Issues | `get_issue`, `create_issue`, `update_issue`, `add_comment`, `log_time` |
| Subtasks & links | `add_subtask`, `list_subtasks`, `complete_subtask`, `link_issues`, `list_links`, `get_epic` |
| Sprints | `list_sprints`, `create_sprint`, `plan_sprint`, `remove_from_sprint`, `start_sprint`, `complete_sprint` |
| Reports | `sprint_report`, `project_dashboard` |

Actions are attributed to the user who owns the API token (reporter on issues, author on comments, time logs).

**Workspaces:** every token is bound to the workspace it was created in, and all tools are scoped to it server-side — an agent can never see another workspace's data. To let Claude work in a second workspace, create a token there and register another MCP server entry (e.g. `ossicone-teamx`).

Typical agent flow: `create_project` → `create_issue` (epics + stories) → `create_sprint` → `plan_sprint` → `start_sprint` → work: `update_issue` (status moves) + `add_comment` + `log_time` → `complete_sprint` → `sprint_report`.
