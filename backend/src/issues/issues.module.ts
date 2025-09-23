import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Issue } from './entities/issue.entity'
import { Comment } from './entities/comment.entity'
import { Attachment } from './entities/attachment.entity'
import { Subtask } from './entities/subtask.entity'
import { TimeLog } from './entities/time-log.entity'
import { User } from '../users/entities/user.entity'
import { IssuesService } from './issues.service'
import { IssuesController } from './issues.controller'
import { CommentsService } from './comments.service'
import { CommentsController } from './comments.controller'
import { AttachmentsService } from './attachments.service'
import { AttachmentsController } from './attachments.controller'
import { SubtasksService } from './subtasks.service'
import { SubtasksController } from './subtasks.controller'
import { TimeTrackingService } from './time-tracking.service'
import { TimeTrackingController } from './time-tracking.controller'
import { PublicSubtasksController } from './controllers/public-subtasks.controller' // New import

@Module({
  imports: [TypeOrmModule.forFeature([Issue, Comment, Attachment, Subtask, TimeLog, User])],
  providers: [IssuesService, CommentsService, AttachmentsService, SubtasksService, TimeTrackingService],
  controllers: [
    IssuesController,
    CommentsController,
    AttachmentsController,
    SubtasksController,
    TimeTrackingController,
    PublicSubtasksController, // New controller added here
  ],
  exports: [IssuesService, CommentsService, AttachmentsService, SubtasksService, TimeTrackingService],
})
export class IssuesModule {}