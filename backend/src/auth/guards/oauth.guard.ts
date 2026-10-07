import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { OAuthService } from '../services/oauth.service'
import { User } from '../../users/entities/user.entity'

// Only MCP tool APIs; account credentials, repository secrets, webhooks and
// administrative routes cannot be reached with this token.
export function oauthApiAllowed(path: string, method: string, writable: boolean): boolean {
  try { path = decodeURIComponent(path).replace(/\/$/, '') } catch { return false }
  const read = ['GET', 'HEAD', 'OPTIONS'].includes(method)
  if (!read && !writable && !(method === 'POST' && path === '/api/issues/search')) return false
  if (path === '/api/auth/me') return read
  if (/^\/api\/workspaces(?:\/current(?:\/members)?)?$/.test(path)) return read
  if (path === '/api/users') return read
  if (/^\/api\/projects(?:\/\d+(?:\/wiki(?:\/\d+)?)?)?$/.test(path)) return true
  return /^\/api\/(issues|sprints|comments|time-tracking|subtasks|issue-links|analytics)(\/|$)/.test(path)
}
@Injectable()
export class OAuthGuard implements CanActivate {
  constructor(private readonly oauth: OAuthService,
    @InjectRepository(User) private readonly users: Repository<User>) {}
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest()
    const identity = await this.oauth.identity(req.headers.authorization?.substring(7))
    if (!oauthApiAllowed(req.path, req.method, identity.scope.split(' ').includes('write')))
      throw new ForbiddenException('This OAuth connection does not permit that action')
    const user = await this.users.findOne({ where: { id: identity.user_id } })
    if (!user) throw new UnauthorizedException()
    req.user = { ...user, role: 'member' }
    req.oauthIdentity = identity
    // Reuse the existing token workspace binding and membership recheck.
    req.apiToken = { workspaceId: identity.workspace_id }
    return true
  }
}
