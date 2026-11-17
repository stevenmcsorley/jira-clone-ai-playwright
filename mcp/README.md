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

## Code Mode (/mcp-code)

The HTTP server offers `/mcp-code` as a second MCP endpoint alongside `/mcp`. It exposes only two tools, `search` and `execute`, instead of the roughly 34 individual tools available through `/mcp`:

- `search` with an empty query returns a compact, names-only index (with short summaries, but no input schemas). With a query, it returns matching operations with their input schemas.
- `execute` runs an async JavaScript function in a QuickJS (WASM) sandbox. Call operations through the `ossicone.<tool>()` namespace, then filter or aggregate their results in JavaScript and return a small final result. Each execution is limited to 32 tool calls, 60 seconds, and 64 MB of memory. The sandbox has no network, filesystem, `process`, or `require` access.

Use the same bearer token or OAuth grant as `/mcp`; scopes and workspace binding still apply to every operation.

Measured on production, the advertised tool list drops from about 3,400 tokens to about 390 tokens, and a six-project issue summary drops from about 32,000 tokens to about 60 tokens by aggregating results inside `execute`.

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
