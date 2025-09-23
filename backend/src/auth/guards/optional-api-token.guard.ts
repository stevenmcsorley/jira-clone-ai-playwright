import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ApiToken } from '../entities/api-token.entity'

@Injectable()
export class OptionalApiTokenGuard implements CanActivate {
  constructor(
    @InjectRepository(ApiToken)
    private readonly apiTokenRepository: Repository<ApiToken>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const authHeader = request.headers.authorization

    // If no auth header is provided, allow the request to continue
    // This maintains backward compatibility with frontend
    if (!authHeader) {
      return true
    }

    // If auth header is provided, it must be valid
    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid authorization header format')
    }

    const token = authHeader.substring(7)

    const apiToken = await this.apiTokenRepository.findOne({
      where: {
        token,
        isActive: true
      },
      relations: ['user']
    })

    if (!apiToken) {
      throw new UnauthorizedException('Invalid API token')
    }

    // Check if token is expired
    if (apiToken.expiresAt && apiToken.expiresAt < new Date()) {
      throw new UnauthorizedException('API token expired')
    }

    // Update last used timestamp
    await this.apiTokenRepository.update(apiToken.id, {
      lastUsedAt: new Date()
    })

    // Attach user and token to request
    request.user = apiToken.user
    request.apiToken = apiToken

    return true
  }
}