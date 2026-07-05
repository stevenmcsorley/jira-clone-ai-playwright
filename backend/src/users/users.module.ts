import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from './entities/user.entity'
import { WorkspaceMember } from '../workspaces/entities/workspace-member.entity'
import { UsersService } from './users.service'
import { UsersController } from './users.controller'

@Module({
  imports: [TypeOrmModule.forFeature([User, WorkspaceMember])],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}