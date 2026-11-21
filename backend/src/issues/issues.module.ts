import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Issue } from './entities/issue.entity'
import { Comment } from './entities/comment.entity'
import { Attachment } from './entities/attachment.entity'
import { Subtask } from './entities/subtask.entity'
import { TimeLog } from './entities/time-log.entity'
import { IssueTimer } from './entities/issue-timer.entity'
import { IssueLink } from './entities/issue-link.entity'
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
import { TimersService } from './timers.service'
import { TimersController } from './timers.controller'
import { IssueLinksService } from './issue-links.service'
import { IssueLinksController } from './issue-links.controller'
import { EventsModule } from '../events/events.module'
import { WorkspacesModule } from '../workspaces/workspaces.module'
import { NotificationsModule } from '../notifications/notifications.module'
import { WebhooksModule } from '../webhooks/webhooks.module'

@Module({
  imports: [TypeOrmModule.forFeature([Issue, Comment, Attachment, Subtask, TimeLog, IssueTimer, IssueLink, User]), EventsModule, WorkspacesModule, NotificationsModule, WebhooksModule],
  providers: [IssuesService, CommentsService, AttachmentsService, SubtasksService, TimeTrackingService, TimersService, IssueLinksService],
  controllers: [
    IssuesController,
    CommentsController,
    AttachmentsController,
    SubtasksController,
    TimeTrackingController,
    TimersController,
    IssueLinksController,
  ],
  exports: [IssuesService, CommentsService, AttachmentsService, SubtasksService, TimeTrackingService, TimersService, IssueLinksService],
})
export class IssuesModule {}