import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Request, UseGuards } from '@nestjs/common'
import { TimeTrackingService } from './time-tracking.service'
import { CreateTimeLogDto, UpdateTimeLogDto } from './dto/time-log.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@Controller('api/time-tracking')
// @UseGuards(JwtAuthGuard) // Temporarily disabled for development
export class TimeTrackingController {
  constructor(private readonly timeTrackingService: TimeTrackingService) {}

  @Post('log')
  logTime(@Body() createTimeLogDto: CreateTimeLogDto, @Request() req) {
    // Use default user ID for development
    const userId = req.user?.id || 1
    return this.timeTrackingService.logTime(createTimeLogDto, userId)
  }

  @Get('issue/:issueId')
  getTimeLogsByIssue(@Param('issueId', ParseIntPipe) issueId: number) {
    return this.timeTrackingService.getTimeLogsByIssue(issueId)
  }

  @Get('issue/:issueId/summary')
  getTimeTrackingSummary(@Param('issueId', ParseIntPipe) issueId: number) {
    return this.timeTrackingService.getTimeTrackingSummary(issueId)
  }

  @Get('log/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.timeTrackingService.findOne(id)
  }

  @Patch('log/:id')
  updateTimeLog(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTimeLogDto: UpdateTimeLogDto,
    @Request() req
  ) {
    // Use default user ID for development
    const userId = req.user?.id || 1
    return this.timeTrackingService.updateTimeLog(id, updateTimeLogDto, userId)
  }

  @Delete('log/:id')
  deleteTimeLog(@Param('id', ParseIntPipe) id: number, @Request() req) {
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