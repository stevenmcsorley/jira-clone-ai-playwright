import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { ApiTokenService } from '../services/api-token.service'

interface CreateTokenDto {
  name: string
  description?: string
  scopes?: string[]
  expiresAt?: string
}

interface UpdateTokenDto {
  name?: string
  description?: string
  scopes?: string[]
  expiresAt?: string
  isActive?: boolean
}

@Controller('api/tokens')
export class ApiTokensController {
  constructor(private readonly apiTokenService: ApiTokenService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createToken(@Body() createTokenDto: CreateTokenDto, @Body('userId') userId?: number) {
    // For now, allow creating tokens for any user by passing userId
    // In a real app, this would be restricted to authenticated users
    const targetUserId = userId || 1 // Default to first user

    const result = await this.apiTokenService.createToken({
      ...createTokenDto,
      userId: targetUserId,
      expiresAt: createTokenDto.expiresAt ? new Date(createTokenDto.expiresAt) : undefined
    })

    // Return the token info but hide the actual token value in the response
    const { rawToken, token } = result
    return {
      message: 'API token created successfully',
      token: rawToken, // Only show this once during creation
      tokenInfo: {
        id: token.id,
        name: token.name,
        description: token.description,
        scopes: token.scopes,
        expiresAt: token.expiresAt,
        createdAt: token.createdAt
      }
    }
  }

  @Get('user/:userId')
  async getTokensByUser(@Param('userId', ParseIntPipe) userId: number) {
    const tokens = await this.apiTokenService.findAllByUser(userId)

    // Hide the actual token values
    return tokens.map(token => ({
      id: token.id,
      name: token.name,
      description: token.description,
      scopes: token.scopes,
      isActive: token.isActive,
      expiresAt: token.expiresAt,
      lastUsedAt: token.lastUsedAt,
      createdAt: token.createdAt,
      updatedAt: token.updatedAt
    }))
  }

  @Get(':id')
  async getToken(@Param('id', ParseIntPipe) id: number) {
    const token = await this.apiTokenService.findOne(id)

    // Hide the actual token value
    return {
      id: token.id,
      name: token.name,
      description: token.description,
      scopes: token.scopes,
      isActive: token.isActive,
      expiresAt: token.expiresAt,
      lastUsedAt: token.lastUsedAt,
      createdAt: token.createdAt,
      updatedAt: token.updatedAt,
      user: {
        id: token.user.id,
        name: token.user.name,
        email: token.user.email
      }
    }
  }

  @Put(':id')
  async updateToken(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTokenDto: UpdateTokenDto
  ) {
    const updatedToken = await this.apiTokenService.updateToken(id, {
      ...updateTokenDto,
      expiresAt: updateTokenDto.expiresAt ? new Date(updateTokenDto.expiresAt) : undefined
    })

    return {
      id: updatedToken.id,
      name: updatedToken.name,
      description: updatedToken.description,
      scopes: updatedToken.scopes,
      isActive: updatedToken.isActive,
      expiresAt: updatedToken.expiresAt,
      updatedAt: updatedToken.updatedAt
    }
  }

  @Post(':id/revoke')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeToken(@Param('id', ParseIntPipe) id: number) {
    await this.apiTokenService.revokeToken(id)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteToken(@Param('id', ParseIntPipe) id: number) {
    await this.apiTokenService.deleteToken(id)
  }

  @Get('validate/:token')
  async validateToken(@Param('token') token: string) {
    const apiToken = await this.apiTokenService.validateToken(token)

    if (!apiToken) {
      return { valid: false }
    }

    return {
      valid: true,
      tokenInfo: {
        id: apiToken.id,
        name: apiToken.name,
        scopes: apiToken.scopes,
        user: {
          id: apiToken.user.id,
          name: apiToken.user.name,
          email: apiToken.user.email
        }
      }
    }
  }
}