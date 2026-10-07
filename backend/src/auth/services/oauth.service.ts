import { Injectable, HttpException, UnauthorizedException, ForbiddenException } from '@nestjs/common'
import { DataSource, EntityManager } from 'typeorm'
import { createHash, randomBytes } from 'crypto'

export const oauthSite = () => (process.env.FRONTEND_URL || 'https://ossicone.halfagiraf.com').replace(/\/$/, '')
export const oauthResource = () => `${oauthSite()}/mcp`
export const hash = (s: string) => createHash('sha256').update(s).digest('hex')
export const challenge = (s: string) => createHash('sha256').update(s).digest('base64url')
const random = () => randomBytes(32).toString('base64url')
const error = (name: string): never => { throw new HttpException({ error: name }, 400) }
export function validRedirect(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 2048 || value.includes('#')) return false
  try {
    const u = new URL(value)
    return !u.username && !u.password && (u.protocol === 'https:' ||
      (u.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(u.hostname)))
  } catch { return false }
}

@Injectable()
export class OAuthService {
  constructor(private readonly db: DataSource) {}

  async register(b: any) {
    if (!b || !Array.isArray(b.redirect_uris) || !b.redirect_uris.length || b.redirect_uris.length > 10 ||
      !b.redirect_uris.every(validRedirect) ||
      (b.token_endpoint_auth_method !== undefined && b.token_endpoint_auth_method !== 'none') ||
      (b.response_types !== undefined && (!Array.isArray(b.response_types) || b.response_types.length !== 1 || b.response_types[0] !== 'code')) ||
      (b.grant_types !== undefined && (!Array.isArray(b.grant_types) || !b.grant_types.includes('authorization_code') || b.grant_types.some((g: string) => !['authorization_code', 'refresh_token'].includes(g))))) error('invalid_client_metadata')
    const id = random()
    const name = typeof b.client_name === 'string' ? b.client_name.slice(0, 120) : 'MCP client'
    await this.db.query('INSERT INTO mcp_oauth_clients(id,name,redirects) VALUES($1,$2,$3)', [id, name, JSON.stringify(b.redirect_uris)])
    return { client_id: id, client_name: name, redirect_uris: b.redirect_uris,
      token_endpoint_auth_method: 'none', grant_types: ['authorization_code', 'refresh_token'], response_types: ['code'] }
  }

  async authorize(p: any) {
    if (typeof p.client_id !== 'string' || !validRedirect(p.redirect_uri)) error('invalid_request')
    const [client] = await this.db.query('SELECT * FROM mcp_oauth_clients WHERE id=$1', [p.client_id])
    // Never redirect an error to a URI that has not been registered exactly.
    if (!client || !client.redirects.includes(p.redirect_uri)) error('invalid_request')
    if (p.response_type !== 'code') return this.redirect(p, { error: 'unsupported_response_type' })
    if (typeof p.state !== 'string' || p.state.length > 2048 ||
      p.code_challenge_method !== 'S256' || typeof p.code_challenge !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(p.code_challenge))
      return this.redirect(p, { error: 'invalid_request' })
    if (p.resource !== undefined && p.resource !== oauthResource()) return this.redirect(p, { error: 'invalid_target' })
    const scope = p.scope === undefined ? 'mcp offline_access' : p.scope
    if (typeof scope !== 'string' || !scope.split(' ').includes('mcp') || scope.split(' ').some((s: string) => !['mcp', 'offline_access'].includes(s)))
      return this.redirect(p, { error: 'invalid_scope' })
    const id = random()
    await this.db.query(`INSERT INTO mcp_oauth_requests(id,client_id,redirect_uri,state,challenge,scope,resource)
      VALUES($1,$2,$3,$4,$5,$6,$7)`, [hash(id), p.client_id, p.redirect_uri, p.state, p.code_challenge, scope, oauthResource()])
    return `${oauthSite()}/oauth/consent?request=${id}`
  }

  redirect(p: any, values: Record<string, string>) {
    const target = new URL(p.redirect_uri)
    for (const [key, value] of Object.entries({ ...values, iss: oauthSite() })) target.searchParams.set(key, value)
    if (typeof p.state === 'string') target.searchParams.set('state', p.state)
    return target.toString()
  }

  async request(id: unknown, session: string) {
    if (typeof id !== 'string') error('invalid_request')
    return this.db.transaction(async manager => {
      const [row] = await manager.query(`SELECT * FROM mcp_oauth_requests
        WHERE id=$1 AND expires_at>now() AND (session_hash IS NULL OR session_hash=$2)
        FOR UPDATE`, [hash(id as string), hash(session)])
      if (!row) error('invalid_request')
      await manager.query('UPDATE mcp_oauth_requests SET session_hash=$2 WHERE id=$1', [row.id, hash(session)])
      const [client] = await manager.query('SELECT name FROM mcp_oauth_clients WHERE id=$1', [row.client_id])
      return { clientName: client.name, redirectHost: new URL(row.redirect_uri).host, scope: row.scope }
    })
  }

  async consent(b: any, userId: number, session: string) {
    if (!b || typeof b.request !== 'string' || !['allow', 'deny'].includes(b.decision)) error('invalid_request')
    return this.db.transaction(async manager => {
      const [request] = await manager.query(`SELECT * FROM mcp_oauth_requests
        WHERE id=$1 AND session_hash=$2 AND expires_at>now() FOR UPDATE`, [hash(b.request), hash(session)])
      if (!request) error('invalid_request')
      if (b.decision === 'deny') {
        await manager.query('DELETE FROM mcp_oauth_requests WHERE id=$1', [request.id])
        return { redirect: this.redirect(request, { error: 'access_denied' }) }
      }
      if (!Number.isSafeInteger(b.workspaceId) || !['read', 'write'].includes(b.access)) error('invalid_request')
      const [membership] = await manager.query('SELECT id FROM workspace_members WHERE "userId"=$1 AND "workspaceId"=$2', [userId, b.workspaceId])
      if (!membership) throw new ForbiddenException('You are not a member of that workspace')
      const grant = random(), code = random()
      const scope = `${request.scope}${b.access === 'write' ? ' write' : ''}`
      await manager.query(`INSERT INTO mcp_oauth_grants(id,client_id,user_id,workspace_id,scope,resource)
        VALUES($1,$2,$3,$4,$5,$6)`, [grant, request.client_id, userId, b.workspaceId, scope, request.resource])
      await manager.query('INSERT INTO mcp_oauth_codes(hash,grant_id,redirect_uri,challenge) VALUES($1,$2,$3,$4)',
        [hash(code), grant, request.redirect_uri, request.challenge])
      await manager.query('DELETE FROM mcp_oauth_requests WHERE id=$1', [request.id])
      return { redirect: this.redirect(request, { code }) }
    })
  }

  async token(b: any) {
    if (!b || typeof b.client_id !== 'string') error('invalid_request')
    if (b.resource !== undefined && b.resource !== oauthResource()) error('invalid_target')
    if (b.client_secret !== undefined || b.client_assertion !== undefined) error('invalid_client')
    if (!['authorization_code', 'refresh_token'].includes(b.grant_type)) error('unsupported_grant_type')
    const credential = b.grant_type === 'authorization_code' ? b.code : b.refresh_token
    if (typeof credential !== 'string' || credential.length > 256) error('invalid_grant')
    const result = await this.db.transaction(async manager => {
      const table = b.grant_type === 'authorization_code' ? 'mcp_oauth_codes' : 'mcp_oauth_tokens'
      const [stored] = await manager.query(`SELECT * FROM ${table} WHERE hash=$1 FOR UPDATE`, [hash(credential)])
      if (!stored || (b.grant_type === 'refresh_token' && stored.kind !== 'refresh')) error('invalid_grant')
      const [grant] = await manager.query('SELECT * FROM mcp_oauth_grants WHERE id=$1 FOR UPDATE', [stored.grant_id])
      if (!grant || grant.client_id !== b.client_id || grant.resource !== oauthResource() || grant.revoked || new Date(grant.expires_at).getTime() <= Date.now()) error('invalid_grant')
      // Refresh replay revokes the whole connection, including still-live access tokens.
      if (stored.used) {
        if (b.grant_type === 'refresh_token') {
          await manager.query('UPDATE mcp_oauth_grants SET revoked=true WHERE id=$1', [grant.id])
          return null
        }
        error('invalid_grant')
      }
      if (new Date(stored.expires_at).getTime() <= Date.now()) error('invalid_grant')
      if (b.grant_type === 'authorization_code' && (b.redirect_uri !== stored.redirect_uri ||
        typeof b.code_verifier !== 'string' || !/^[A-Za-z0-9._~-]{43,128}$/.test(b.code_verifier) || challenge(b.code_verifier) !== stored.challenge)) error('invalid_grant')
      const [membership] = await manager.query('SELECT id FROM workspace_members WHERE "userId"=$1 AND "workspaceId"=$2', [grant.user_id, grant.workspace_id])
      if (!membership) error('invalid_grant')
      if (b.scope !== undefined && b.scope !== grant.scope) error('invalid_scope')
      await manager.query(`UPDATE ${table} SET used=true WHERE hash=$1`, [hash(credential)])
      return this.issueTokens(manager, grant)
    })
    if (!result) error('invalid_grant')
    return result
  }

  private async issueTokens(manager: EntityManager, grant: any) {
    const access = `oxo_${random()}`, refresh = `oxr_${random()}`
    await manager.query(`INSERT INTO mcp_oauth_tokens(hash,grant_id,kind,expires_at) VALUES($1,$2,'access',now()+interval '1 hour')`, [hash(access), grant.id])
    if (grant.scope.split(' ').includes('offline_access'))
      await manager.query(`INSERT INTO mcp_oauth_tokens(hash,grant_id,kind,expires_at) VALUES($1,$2,'refresh',$3)`, [hash(refresh), grant.id, grant.expires_at])
    return { access_token: access, token_type: 'Bearer', expires_in: 3600, scope: grant.scope,
      ...(grant.scope.split(' ').includes('offline_access') ? { refresh_token: refresh } : {}) }
  }

  async identity(token: string) {
    const [row] = await this.db.query(`SELECT g.user_id, g.workspace_id, g.scope FROM mcp_oauth_tokens t
      JOIN mcp_oauth_grants g ON g.id=t.grant_id
      JOIN workspace_members m ON m."userId"=g.user_id AND m."workspaceId"=g.workspace_id
      WHERE t.hash=$1 AND t.kind='access' AND t.expires_at>now() AND g.expires_at>now()
      AND NOT g.revoked AND g.resource=$2`, [hash(token), oauthResource()])
    if (!row || !row.scope.split(' ').includes('mcp')) throw new UnauthorizedException('Invalid OAuth access token')
    return row
  }

  async connections(userId: number) {
    return this.db.query(`SELECT g.id, c.name AS "clientName", w.name AS "workspaceName", g.scope,
      g.created_at AS "createdAt", g.expires_at AS "expiresAt" FROM mcp_oauth_grants g
      JOIN mcp_oauth_clients c ON c.id=g.client_id JOIN workspaces w ON w.id=g.workspace_id
      WHERE g.user_id=$1 AND NOT g.revoked AND g.expires_at>now() ORDER BY g.created_at DESC`, [userId])
  }

  async revoke(userId: number, id: string) {
    await this.db.query('UPDATE mcp_oauth_grants SET revoked=true WHERE id=$1 AND user_id=$2', [id, userId])
    return { revoked: true }
  }
}
