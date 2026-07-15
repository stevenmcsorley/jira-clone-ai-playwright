import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common'
import { WebhooksService, WebhookInput, WEBHOOK_EVENTS } from './webhooks.service'
import { WebhookDispatcher } from './webhook-dispatcher.service'
import { WorkspaceScopeService } from '../workspaces/workspace-scope.service'

@Controller('api/projects/:projectId/webhooks')
export class WebhooksController {
  constructor(
    private readonly webhooks: WebhooksService,
    private readonly dispatcher: WebhookDispatcher,
    private readonly scope: WorkspaceScopeService,
  ) {}

  private async assert(projectId: string, req: any): Promise<number> {
    const id = +projectId
    await this.scope.assertProject(id, req.workspaceId)
    return id
  }

  private requireManager(req: any): void {
    if (!['owner', 'admin'].includes(req.workspaceRole)) {
      throw new ForbiddenException('Workspace admin access required')
    }
  }

  /** The event types a webhook can subscribe to (for the settings UI). */
  @Get('events')
  async events(@Param('projectId') projectId: string, @Req() req: any) {
    await this.assert(projectId, req)
    return WEBHOOK_EVENTS
  }

  @Get()
  async list(@Param('projectId') projectId: string, @Req() req: any) {
    const id = await this.assert(projectId, req)
    return this.webhooks.list(id)
  }

  @Post()
  async create(@Param('projectId') projectId: string, @Body() body: WebhookInput, @Req() req: any) {
    const id = await this.assert(projectId, req)
    this.requireManager(req)
    return this.webhooks.create(id, body)
  }

  @Patch(':id')
  async update(
    @Param('projectId') projectId: string,
    @Param('id') hookId: string,
    @Body() body: WebhookInput,
    @Req() req: any,
  ) {
    const id = await this.assert(projectId, req)
    this.requireManager(req)
    return this.webhooks.update(id, +hookId, body)
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('projectId') projectId: string, @Param('id') hookId: string, @Req() req: any) {
    const id = await this.assert(projectId, req)
    this.requireManager(req)
    await this.webhooks.remove(id, +hookId)
  }

  @Post(':id/test')
  async test(@Param('projectId') projectId: string, @Param('id') hookId: string, @Req() req: any) {
    const id = await this.assert(projectId, req)
    this.requireManager(req)
    const hook = await this.webhooks.getWithSecret(id, +hookId)
    return this.dispatcher.sendTest(hook)
  }
}
