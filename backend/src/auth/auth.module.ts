import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ApiToken } from './entities/api-token.entity'
import { ApiTokenService } from './services/api-token.service'
import { ApiTokensController } from './controllers/api-tokens.controller'
import { ApiTokenGuard } from './guards/api-token.guard'
import { OptionalApiTokenGuard } from './guards/optional-api-token.guard'
import { User } from '../users/entities/user.entity'

@Module({
  imports: [TypeOrmModule.forFeature([ApiToken, User])],
  controllers: [ApiTokensController],
  providers: [ApiTokenService, ApiTokenGuard, OptionalApiTokenGuard],
  exports: [ApiTokenService, ApiTokenGuard, OptionalApiTokenGuard],
})
export class AuthModule {}