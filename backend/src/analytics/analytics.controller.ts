import { Controller, Get, Param, Query, Req, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AnalyticsService } from './analytics.service'
import { VelocityService } from './velocity.service'
import { Sprint } from '../sprints/entities/sprint.entity'
import { WorkspaceScopeService } from '../workspaces/workspace-scope.service'

@Controller('api/analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly velocityService: VelocityService,
    private readonly workspaceScope: WorkspaceScopeService,
    @InjectRepository(Sprint)
    private readonly sprintsRepository: Repository<Sprint>,
  ) {}

  /** 404 unless the sprint's project belongs to the request's workspace. */
  private async assertSprint(sprintId: number, workspaceId: number) {
    const sprint = await this.sprintsRepository.findOne({
      where: { id: sprintId },
      select: ['id', 'projectId'],
    })
    if (!sprint) throw new NotFoundException('Sprint not found')
    await this.workspaceScope.assertProject(sprint.projectId, workspaceId)
  }

  // Get comprehensive dashboard analytics
  @Get('dashboard/:projectId')
  async getDashboardAnalytics(@Param('projectId') projectId: number, @Req() req: any) {
    await this.workspaceScope.assertProject(+projectId, req.workspaceId)
    return this.analyticsService.getDashboardAnalytics(projectId)
  }

  // Velocity endpoints
  @Get('velocity/:projectId')
  async getProjectVelocity(
    @Param('projectId') projectId: number,
    @Req() req: any,
    @Query('sprintCount') sprintCount: number = 12
  ) {
    await this.workspaceScope.assertProject(+projectId, req.workspaceId)
    return this.velocityService.getProjectVelocity(projectId, sprintCount)
  }

  @Get('velocity/:projectId/trends')
  async getVelocityTrends(@Param('projectId') projectId: number, @Req() req: any) {
    await this.workspaceScope.assertProject(+projectId, req.workspaceId)
    return this.velocityService.getVelocityTrends(projectId)
  }

  @Get('velocity/:projectId/forecast')
  async getVelocityForecast(
    @Param('projectId') projectId: number,
    @Req() req: any,
    @Query('remainingStoryPoints') remainingStoryPoints?: number,
    @Query('targetDate') targetDate?: string
  ) {
    await this.workspaceScope.assertProject(+projectId, req.workspaceId)
    const targetDateObj = targetDate ? new Date(targetDate) : undefined
    return this.velocityService.generateVelocityForecast(
      projectId,
      remainingStoryPoints,
      targetDateObj
    )
  }

  @Get('velocity/:projectId/team-comparison')
  async getTeamVelocityComparison(
    @Param('projectId') projectId: number,
    @Req() req: any,
    @Query('sprintCount') sprintCount: number = 6
  ) {
    await this.workspaceScope.assertProject(+projectId, req.workspaceId)
    return this.velocityService.getTeamVelocityComparison(projectId, sprintCount)
  }

  // Burndown chart
  @Get('burndown/:sprintId')
  async getBurndownChart(@Param('sprintId') sprintId: number, @Req() req: any) {
    await this.assertSprint(+sprintId, req.workspaceId)
    return this.analyticsService.generateBurndownData(sprintId)
  }

  // Cycle time metrics
  @Get('cycle-time/:projectId')
  async getCycleTimeMetrics(
    @Param('projectId') projectId: number,
    @Req() req: any,
    @Query('sprintCount') sprintCount: number = 6
  ) {
    await this.workspaceScope.assertProject(+projectId, req.workspaceId)
    return this.analyticsService.calculateCycleTimeMetrics(projectId, sprintCount)
  }

  // Throughput metrics
  @Get('throughput/:projectId')
  async getThroughputMetrics(
    @Param('projectId') projectId: number,
    @Req() req: any,
    @Query('sprintCount') sprintCount: number = 6
  ) {
    await this.workspaceScope.assertProject(+projectId, req.workspaceId)
    return this.analyticsService.calculateThroughputMetrics(projectId, sprintCount)
  }

  // Sprint scope data (for burnup charts)
  @Get('sprint-scope/:sprintId')
  async getSprintScopeData(@Param('sprintId') sprintId: number, @Req() req: any) {
    await this.assertSprint(+sprintId, req.workspaceId)
    return this.analyticsService.getSprintScopeData(sprintId)
  }

  // Sprint health metrics
  @Get('sprint-health/:sprintId')
  async getSprintHealthMetrics(@Param('sprintId') sprintId: number, @Req() req: any) {
    await this.assertSprint(+sprintId, req.workspaceId)
    return this.analyticsService.calculateSprintHealthMetrics(sprintId)
  }

  // Cumulative flow diagram
  @Get('cumulative-flow/:projectId')
  async getCumulativeFlowData(
    @Param('projectId') projectId: number,
    @Req() req: any,
    @Query('days') days: number = 30
  ) {
    await this.workspaceScope.assertProject(+projectId, req.workspaceId)
    return this.analyticsService.generateCumulativeFlowData(projectId, days)
  }
}
