import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ApiToken } from '../entities/api-token.entity'
import { User } from '../../users/entities/user.entity'
import * as crypto from 'crypto'

interface CreateApiTokenDto {
  name: string
  description?: string
  userId: number
  scopes?: string[]
  expiresAt?: Date
}

interface UpdateApiTokenDto {
  name?: string
  description?: string
  scopes?: string[]
  expiresAt?: Date
  isActive?: boolean
}

@Injectable()
export class ApiTokenService {
  constructor(
    @InjectRepository(ApiToken)
    private readonly apiTokenRepository: Repository<ApiToken>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createToken(createTokenDto: CreateApiTokenDto): Promise<{ token: ApiToken; rawToken: string }> {
    const user = await this.userRepository.findOne({ where: { id: createTokenDto.userId } })
    if (!user) {
      throw new NotFoundException('User not found')
    }

    // Check if token name already exists for this user
    const existingToken = await this.apiTokenRepository.findOne({
      where: { name: createTokenDto.name, userId: createTokenDto.userId }
    })

    if (existingToken) {
      throw new ConflictException('Token name already exists')
    }

    // Generate secure token
    const rawToken = crypto.randomBytes(32).toString('hex')

    const apiToken = this.apiTokenRepository.create({
      ...createTokenDto,
      token: rawToken,
      user,
      scopes: createTokenDto.scopes || ['read', 'write']
    })

    const savedToken = await this.apiTokenRepository.save(apiToken)

    return {
      token: savedToken,
      rawToken
    }
  }

  async findAllByUser(userId: number): Promise<ApiToken[]> {
    return this.apiTokenRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' }
    })
  }

  async findOne(id: number): Promise<ApiToken> {
    const token = await this.apiTokenRepository.findOne({ where: { id } })
    if (!token) {
      throw new NotFoundException('API token not found')
    }
    return token
  }

  async updateToken(id: number, updateTokenDto: UpdateApiTokenDto): Promise<ApiToken> {
    const token = await this.findOne(id)

    Object.assign(token, updateTokenDto)
    return this.apiTokenRepository.save(token)
  }

  async revokeToken(id: number): Promise<void> {
    const token = await this.findOne(id)
    await this.apiTokenRepository.update(id, { isActive: false })
  }

  async deleteToken(id: number): Promise<void> {
    const token = await this.findOne(id)
    await this.apiTokenRepository.remove(token)
  }

  async validateToken(tokenValue: string): Promise<ApiToken | null> {
    return this.apiTokenRepository.findOne({
      where: {
        token: tokenValue,
        isActive: true
      },
      relations: ['user']
    })
  }
}