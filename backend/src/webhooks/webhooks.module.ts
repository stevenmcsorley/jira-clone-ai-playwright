import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ProjectWebhook } from './entities/project-webhook.entity'
import { Project } from '../projects/entities/project.entity'
import { User } from '../users/entities/user.entity'
import { WebhooksService } from './webhooks.service'
import { WebhookDispatcher } from './webhook-dispatcher.service'
import { WebhooksController } from './webhooks.controller'
import { WorkspacesModule } from '../workspaces/workspaces.module'

@Module({
  imports: [TypeOrmModule.forFeature([ProjectWebhook, Project, User]), WorkspacesModule],
  controllers: [WebhooksController],
  providers: [WebhooksService, WebhookDispatcher],
  // WebhookDispatcher is consumed by Issues/Sprints services to emit events.
  exports: [WebhookDispatcher],
})
export class WebhooksModule {}
