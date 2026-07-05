import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { IS_PUBLIC_KEY } from '../decorators/public.decorator'
import { Workspace } from '../../workspaces/entities/workspace.entity'
import { WorkspaceMember } from '../../workspaces/entities/workspace-member.entity'

/**
 * Runs after GlobalAuthGuard. Resolves the workspace the request operates in
 * and attaches req.workspaceId / req.workspaceRole:
 *
 * - API tokens are bound to a workspace (token.workspaceId)
 * - Browser sessions send X-Workspace-Id; membership is verified
 * - Fallback: the user's first workspace
 * - Users with no workspace at all get a personal one created on the fly
 *   (self-heals accounts that predate workspaces)
 */
@Injectable()
export class WorkspaceContextGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    @InjectRepository(WorkspaceMember)
    private readonly memberRepository: Repository<WorkspaceMember>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (isPublic) return true

    const request = context.switchToHttp().getRequest()
    const user = request.user
    if (!user) return true // GlobalAuthGuard already rejected unauthenticated requests

    let memberships = await this.memberRepository.find({
      where: { userId: user.id },
      order: { id: 'ASC' },
    })

    if (memberships.length === 0) {
      const workspace = await this.workspaceRepository.save(
        this.workspaceRepository.create({ name: `${user.name}'s workspace` }),
      )
      const membership = await this.memberRepository.save(
        this.memberRepository.create({ workspaceId: workspace.id, userId: user.id, role: 'owner' }),
      )
      memberships = [membership]
    }

    let workspaceId: number | undefined

    if (request.apiToken?.workspaceId) {
      workspaceId = request.apiToken.workspaceId
    } else {
      const header = request.headers['x-workspace-id']
      if (header) {
        const requested = parseInt(Array.isArray(header) ? header[0] : header, 10)
        if (!Number.isNaN(requested)) workspaceId = requested
      }
    }

    const membership = workspaceId
      ? memberships.find(m => m.workspaceId === workspaceId)
      : memberships[0]

    if (!membership) {
      throw new ForbiddenException('You are not a member of that workspace')
    }

    request.workspaceId = membership.workspaceId
    request.workspaceRole = membership.role
    return true
  }
}
