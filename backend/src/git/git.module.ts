import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ProjectRepo } from './entities/project-repo.entity'
import { Project } from '../projects/entities/project.entity'
import { GitService } from './git.service'
import { GitController } from './git.controller'
import { GitProviderFactory } from './git-provider.factory'
import { WorkspacesModule } from '../workspaces/workspaces.module'

@Module({
  imports: [TypeOrmModule.forFeature([ProjectRepo, Project]), WorkspacesModule],
  controllers: [GitController],
  providers: [GitService, GitProviderFactory],
  exports: [GitService],
})
export class GitModule {}
