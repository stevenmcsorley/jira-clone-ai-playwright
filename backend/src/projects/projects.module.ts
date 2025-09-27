import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Project } from './entities/project.entity'
import { Issue } from '../issues/entities/issue.entity'
import { Sprint } from '../sprints/entities/sprint.entity'
import { Comment } from '../issues/entities/comment.entity'
import { Attachment } from '../issues/entities/attachment.entity'
import { TimeLog } from '../issues/entities/time-log.entity'
import { IssueLink } from '../issues/entities/issue-link.entity'
import { Subtask } from '../issues/entities/subtask.entity'
import { ProjectsService } from './projects.service'
import { ProjectsController } from './projects.controller'

@Module({
  imports: [TypeOrmModule.forFeature([Project, Issue, Sprint, Comment, Attachment, TimeLog, IssueLink, Subtask])],
  providers: [ProjectsService],
  controllers: [ProjectsController],
  exports: [ProjectsService],
})
export class ProjectsModule {}