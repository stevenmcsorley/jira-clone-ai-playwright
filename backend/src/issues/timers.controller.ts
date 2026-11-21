import { Body, Controller, Get, Param, ParseIntPipe, Post, Req, UnauthorizedException } from '@nestjs/common'
import { TimersService } from './timers.service'
import { WorkspaceScopeService } from '../workspaces/workspace-scope.service'

interface StopBody { log?: boolean; description?: string }

/** Timers belong to the signed-in person (or the agent token acting as them). */
@Controller('api/timers')
export class TimersController {
  constructor(
    private readonly timers: TimersService,
    private readonly workspaceScope: WorkspaceScopeService,
  ) {}

  private user(req: any): number {
    const id = req.user?.id
    if (!id) throw new UnauthorizedException()
    return id
  }

  /** My running and paused timers in the current workspace. */
  @Get()
  async list(@Req() req: any) {
    const projectIds = await this.workspaceScope.projectIds(req.workspaceId)
    return this.timers.list(this.user(req), projectIds)
  }

  @Get('issue/:issueId')
  async get(@Param('issueId', ParseIntPipe) issueId: number, @Req() req: any) {
    await this.workspaceScope.assertIssue(issueId, req.workspaceId)
    return this.timers.get(this.user(req), issueId)
  }

  @Post('stop-all')
  async stopAll(@Body() body: StopBody, @Req() req: any) {
    return this.timers.stopAll(this.user(req), body ?? {})
  }

  @Post('import')
  async importLocal(@Body() body: { timers: Array<{ issueId: number; elapsedMs: number; status: 'running' | 'paused' }> }, @Req() req: any) {
    const items = Array.isArray(body?.timers) ? body.timers.slice(0, 50) : []
    for (const item of items) await this.workspaceScope.assertIssue(item.issueId, req.workspaceId)
    return this.timers.importLocal(this.user(req), items)
  }

  @Post('issue/:issueId/start')
  async start(@Param('issueId', ParseIntPipe) issueId: number, @Req() req: any) {
    await this.workspaceScope.assertIssue(issueId, req.workspaceId)
    return this.timers.start(this.user(req), issueId)
  }

  @Post('issue/:issueId/pause')
  async pause(@Param('issueId', ParseIntPipe) issueId: number, @Req() req: any) {
    await this.workspaceScope.assertIssue(issueId, req.workspaceId)
    return this.timers.pause(this.user(req), issueId)
  }

  @Post('issue/:issueId/resume')
  async resume(@Param('issueId', ParseIntPipe) issueId: number, @Req() req: any) {
    await this.workspaceScope.assertIssue(issueId, req.workspaceId)
    return this.timers.resume(this.user(req), issueId)
  }

  /** Stop and log the time (pass { "log": false } to discard it instead). */
  @Post('issue/:issueId/stop')
  async stop(@Param('issueId', ParseIntPipe) issueId: number, @Body() body: StopBody, @Req() req: any) {
    await this.workspaceScope.assertIssue(issueId, req.workspaceId)
    return this.timers.stop(this.user(req), issueId, body ?? {})
  }
}
