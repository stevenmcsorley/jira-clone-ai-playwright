import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Notification } from './entities/notification.entity'
import { IssueEvent } from './entities/issue-event.entity'
import { User } from '../users/entities/user.entity'
import { NotificationsService } from './notifications.service'
import { NotificationsController } from './notifications.controller'
import { EventsModule } from '../events/events.module'

// NOTE: deliberately does NOT import IssuesModule (it only needs the Issue
// entity type, not the module) so IssuesModule can import this module
// without creating a circular dependency.
@Module({
  imports: [TypeOrmModule.forFeature([Notification, IssueEvent, User]), EventsModule],
  providers: [NotificationsService],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
