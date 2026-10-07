# OAuth connections to Ossicone

ChatGPT custom MCP connectors use `https://ossicone.halfagiraf.com/mcp` with
OAuth. Leave Client ID and Client Secret blank. Discovery advertises dynamic
client registration, authorization code with S256 PKCE and rotating refresh tokens.
This follows the [OpenAI MCP authentication guidance](https://developers.openai.com/plugins/build/auth).
Existing API-token clients (including Claude and the stdio transport) still work.

The existing Ossicone browser JWT login opens a consent page. Choose a workspace
and read-only or read/write access; allow or cancel explicitly. A login return
path is limited to this consent page. Consent requests are bound to the browser
session, expire after ten minutes and can be used once. Redirects must exactly
match a registered URI; only HTTPS and local loopback HTTP redirects are accepted.

Access tokens last one hour. Refresh tokens rotate, with an absolute 30-day
connection lifetime. Only hashes of access/refresh tokens and authorization codes
are stored. Codes expire in five minutes and are exchanged once under a database
lock. Refresh replay revokes the connection. Removed workspace membership,
deleted accounts, expiry and user revocation stop access. In AI Agent access,
users can see and revoke their own OAuth connections at `/ai-agents`. This SPA
route is separate from the actual MCP server at `/mcp` and works on direct load.

OAuth tokens are bound to the selected workspace. Existing workspace permissions
and ownership checks apply; a caller's `X-Workspace-Id` cannot override the binding.
Only APIs used by MCP tools are permitted. Account credential administration,
user mutations, workspace administration, repository secrets and webhook settings
are outside this OAuth grant. Read-only connections allow issue search (a POST
read operation) but refuse mutations. API-token permissions retain existing behavior.

Public routes: `/.well-known/oauth-protected-resource` (also `/mcp` suffix),
`/.well-known/oauth-authorization-server`, `/oauth/register`, `/oauth/authorize`,
`/oauth/token`. Consent is the SPA at `/oauth/consent`; its API endpoints require
the existing browser JWT. Missing/invalid MCP credentials return 401 with a
resource-metadata challenge before exposing tools. The issuer/resource come from
the production `FRONTEND_URL`/`PUBLIC_URL`, never an untrusted Host header.

Schema is added by migration `1791330000000-McpOAuth`; no external auth provider
or existing-user/session replacement. All three containers are built and deployed
by the existing Pi CI workflow, following tests. The MCP package lock is tracked
because its Dockerfile installs with `npm ci`.

## Verification

Use a dedicated **local** PostgreSQL database named `ossicone_oauth_test`.
The integration test resets its schema and refuses every other DB/host.

```powershell
$env:TEST_DATABASE_URL='postgres://postgres@127.0.0.1:55439/ossicone_oauth_test'
cd backend
npm run test:oauth
cd ../frontend
npm test
npm run build
```

The tests cover discovery, registration, redirect/resource/PKCE binding, consent
and cancellation, session/workspace isolation, concurrent code redemption, hashed
storage, read/write tools, rotating refresh/replay, expiry, membership removal,
revocation and existing bearer-token compatibility. The frontend test covers safe
login return paths. A real ChatGPT account linking check remains a host-side step;
these tests exercise the protocol and MCP transport without that host UI.
