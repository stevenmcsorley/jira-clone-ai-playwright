import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Request, UseGuards } from '@nestjs/common'
import { TimeTrackingService } from './time-tracking.service'
import { CreateTimeLogDto, UpdateTimeLogDto } from './dto/time-log.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { WorkspaceScopeService } from '../workspaces/workspace-scope.service'

@Controller('api/time-tracking')
// @UseGuards(JwtAuthGuard) // Temporarily disabled for development
export class TimeTrackingController {
  constructor(
    private readonly timeTrackingService: TimeTrackingService,
    private readonly workspaceScope: WorkspaceScopeService,
  ) {}

  @Post('log')
  async logTime(@Body() createTimeLogDto: CreateTimeLogDto, @Request() req) {
    await this.workspaceScope.assertIssue(createTimeLogDto.issueId, req.workspaceId)
    // Use default user ID for development
    const userId = req.user?.id || 1
    return this.timeTrackingService.logTime(createTimeLogDto, userId)
  }

  @Get('issue/:issueId')
  async getTimeLogsByIssue(@Param('issueId', ParseIntPipe) issueId: number, @Request() req) {
    await this.workspaceScope.assertIssue(issueId, req.workspaceId)
    return this.timeTrackingService.getTimeLogsByIssue(issueId)
  }

  @Get('issue/:issueId/summary')
  async getTimeTrackingSummary(@Param('issueId', ParseIntPipe) issueId: number, @Request() req) {
    await this.workspaceScope.assertIssue(issueId, req.workspaceId)
    return this.timeTrackingService.getTimeTrackingSummary(issueId)
  }

  @Get('log/:id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const timeLog = await this.timeTrackingService.findOne(id)
    await this.workspaceScope.assertIssue(timeLog.issueId, req.workspaceId)
    return timeLog
  }

  @Patch('log/:id')
  async updateTimeLog(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTimeLogDto: UpdateTimeLogDto,
    @Request() req
  ) {
    const timeLog = await this.timeTrackingService.findOne(id)
    await this.workspaceScope.assertIssue(timeLog.issueId, req.workspaceId)
    // Use default user ID for development
    const userId = req.user?.id || 1
    return this.timeTrackingService.updateTimeLog(id, updateTimeLogDto, userId)
  }

  @Delete('log/:id')
  async deleteTimeLog(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const timeLog = await this.timeTrackingService.findOne(id)
    await this.workspaceScope.assertIssue(timeLog.issueId, req.workspaceId)
    // Use default user ID for development
    const userId = req.user?.id || 1
    return this.timeTrackingService.deleteTimeLog(id, userId)
  }

  @Post('parse-time')
  parseTimeInput(@Body() body: { timeStr: string }) {
    try {
      const hours = this.timeTrackingService.parseTimeInput(body.timeStr)
      return { hours, formatted: this.timeTrackingService.formatTime(hours) }
    } catch (error) {
      return { error: error.message }
    }
  }
}
