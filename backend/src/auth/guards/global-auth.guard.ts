import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { IS_PUBLIC_KEY } from '../decorators/public.decorator'
import { JwtAuthGuard } from './jwt-auth.guard'
import { ApiTokenGuard } from './api-token.guard'

/**
 * Accepts either a user JWT (browser session) or an API token
 * (MCP server / scripts). Routes marked @Public() skip auth.
 */
@Injectable()
export class GlobalAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtAuthGuard: JwtAuthGuard,
    private readonly apiTokenGuard: ApiTokenGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (isPublic) return true

    try {
      return (await this.jwtAuthGuard.canActivate(context)) as boolean
    } catch {
      // Not a valid JWT — fall through to API token
    }

    try {
      return await this.apiTokenGuard.canActivate(context)
    } catch {
      throw new UnauthorizedException('Authentication required')
    }
  }
}
