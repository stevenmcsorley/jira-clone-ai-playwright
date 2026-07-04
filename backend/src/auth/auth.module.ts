import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PassportModule } from '@nestjs/passport'
import { JwtModule } from '@nestjs/jwt'
import { ApiToken } from './entities/api-token.entity'
import { ApiTokenService } from './services/api-token.service'
import { AuthService } from './services/auth.service'
import { ApiTokensController } from './controllers/api-tokens.controller'
import { AuthController } from './controllers/auth.controller'
import { ApiTokenGuard } from './guards/api-token.guard'
import { OptionalApiTokenGuard } from './guards/optional-api-token.guard'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { GlobalAuthGuard } from './guards/global-auth.guard'
import { AdminGuard } from './guards/admin.guard'
import { JwtStrategy } from './strategies/jwt.strategy'
import { User } from '../users/entities/user.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([ApiToken, User]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [ApiTokensController, AuthController],
  providers: [
    ApiTokenService,
    AuthService,
    ApiTokenGuard,
    OptionalApiTokenGuard,
    JwtAuthGuard,
    AdminGuard,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: GlobalAuthGuard,
    },
  ],
  exports: [ApiTokenService, ApiTokenGuard, OptionalApiTokenGuard, JwtAuthGuard, AdminGuard],
})
export class AuthModule {}
