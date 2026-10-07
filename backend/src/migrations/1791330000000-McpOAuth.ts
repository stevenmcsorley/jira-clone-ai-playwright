import { MigrationInterface, QueryRunner } from 'typeorm'

export class McpOAuth1791330000000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE TABLE mcp_oauth_clients (
      id text PRIMARY KEY, name text NOT NULL, redirects jsonb NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now())`)
    await q.query(`CREATE TABLE mcp_oauth_requests (
      id text PRIMARY KEY, client_id text NOT NULL REFERENCES mcp_oauth_clients(id),
      redirect_uri text NOT NULL, state text NOT NULL, challenge text NOT NULL,
      scope text NOT NULL, resource text NOT NULL, session_hash text,
      expires_at timestamptz NOT NULL DEFAULT now()+interval '10 minutes')`)
    await q.query(`CREATE TABLE mcp_oauth_grants (
      id text PRIMARY KEY, client_id text NOT NULL REFERENCES mcp_oauth_clients(id),
      user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      workspace_id integer NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      scope text NOT NULL, resource text NOT NULL,
      revoked boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now(),
      expires_at timestamptz NOT NULL DEFAULT now()+interval '30 days')`)
    await q.query(`CREATE TABLE mcp_oauth_codes (
      hash text PRIMARY KEY, grant_id text NOT NULL REFERENCES mcp_oauth_grants(id) ON DELETE CASCADE,
      redirect_uri text NOT NULL, challenge text NOT NULL,
      expires_at timestamptz NOT NULL DEFAULT now()+interval '5 minutes', used boolean NOT NULL DEFAULT false)`)
    await q.query(`CREATE TABLE mcp_oauth_tokens (
      hash text PRIMARY KEY, grant_id text NOT NULL REFERENCES mcp_oauth_grants(id) ON DELETE CASCADE,
      kind text NOT NULL CHECK(kind IN ('access','refresh')),
      expires_at timestamptz NOT NULL, used boolean NOT NULL DEFAULT false)`)
    await q.query('CREATE INDEX mcp_oauth_tokens_grant ON mcp_oauth_tokens(grant_id)')
  }
  async down(q: QueryRunner): Promise<void> {
    await q.query('DROP TABLE mcp_oauth_tokens, mcp_oauth_codes, mcp_oauth_grants, mcp_oauth_requests, mcp_oauth_clients')
  }
}
