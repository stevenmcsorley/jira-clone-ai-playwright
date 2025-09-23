import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PassportModule } from '@nestjs/passport'
import { JwtModule } from '@nestjs/jwt'
import { ApiToken } from './entities/api-token.entity'
import { ApiTokenService } from './services/api-token.service'
import { ApiTokensController } from './controllers/api-tokens.controller'
import { ApiTokenGuard } from './guards/api-token.guard'
import { OptionalApiTokenGuard } from './guards/optional-api-token.guard'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { JwtStrategy } from './strategies/jwt.strategy'
import { User } from '../users/entities/user.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([ApiToken, User]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [ApiTokensController],
  providers: [ApiTokenService, ApiTokenGuard, OptionalApiTokenGuard, JwtAuthGuard, JwtStrategy],
  exports: [ApiTokenService, ApiTokenGuard, OptionalApiTokenGuard, JwtAuthGuard],
})
export class AuthModule {}