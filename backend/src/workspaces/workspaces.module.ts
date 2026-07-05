import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Workspace } from './entities/workspace.entity'
import { WorkspaceMember } from './entities/workspace-member.entity'
import { WorkspaceInvite } from './entities/workspace-invite.entity'
import { User } from '../users/entities/user.entity'
import { Project } from '../projects/entities/project.entity'
import { Issue } from '../issues/entities/issue.entity'
import { WorkspacesService } from './workspaces.service'
import { WorkspaceScopeService } from './workspace-scope.service'
import { WorkspacesController, InvitesController } from './workspaces.controller'
import { UsersModule } from '../users/users.module'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Workspace, WorkspaceMember, WorkspaceInvite, User, Project, Issue]),
    UsersModule,
    AuthModule,
  ],
  controllers: [WorkspacesController, InvitesController],
  providers: [WorkspacesService, WorkspaceScopeService],
  exports: [WorkspacesService, WorkspaceScopeService],
})
export class WorkspacesModule {}
