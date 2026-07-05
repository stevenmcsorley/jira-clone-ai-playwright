import { Controller, Get, Patch, Post, Param, ParseIntPipe, Req } from '@nestjs/common'
import { NotificationsService } from './notifications.service'

// Auth + workspace context come from the global guards (req.user / req.workspaceId)
@Controller('api/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(@Req() req: any) {
    return this.notificationsService.list(req.user.id, req.workspaceId)
  }

  @Patch(':id/read')
  markRead(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.notificationsService.markRead(id, req.user.id)
  }

  @Post('read-all')
  markAllRead(@Req() req: any) {
    return this.notificationsService.markAllRead(req.user.id, req.workspaceId)
  }
}
