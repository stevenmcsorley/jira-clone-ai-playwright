import { Controller, Get, Param, Query } from '@nestjs/common'
import { AnalyticsService } from './analytics.service'
import { VelocityService } from './velocity.service'

@Controller('api/analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly velocityService: VelocityService,
  ) {}

  // Get comprehensive dashboard analytics
  @Get('dashboard/:projectId')
  async getDashboardAnalytics(@Param('projectId') projectId: number) {
    return this.analyticsService.getDashboardAnalytics(projectId)
  }

  // Velocity endpoints
  @Get('velocity/:projectId')
  async getProjectVelocity(
    @Param('projectId') projectId: number,
    @Query('sprintCount') sprintCount: number = 12
  ) {
    return this.velocityService.getProjectVelocity(projectId, sprintCount)
  }

  @Get('velocity/:projectId/trends')
  async getVelocityTrends(@Param('projectId') projectId: number) {
    return this.velocityService.getVelocityTrends(projectId)
  }

  @Get('velocity/:projectId/forecast')
  async getVelocityForecast(
    @Param('projectId') projectId: number,
    @Query('remainingStoryPoints') remainingStoryPoints?: number,
    @Query('targetDate') targetDate?: string
  ) {
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
    @Query('sprintCount') sprintCount: number = 6
  ) {
    return this.velocityService.getTeamVelocityComparison(projectId, sprintCount)
  }

  // Burndown chart
  @Get('burndown/:sprintId')
  async getBurndownChart(@Param('sprintId') sprintId: number) {
    return this.analyticsService.generateBurndownData(sprintId)
  }

  // Cycle time metrics
  @Get('cycle-time/:projectId')
  async getCycleTimeMetrics(
    @Param('projectId') projectId: number,
    @Query('sprintCount') sprintCount: number = 6
  ) {
    return this.analyticsService.calculateCycleTimeMetrics(projectId, sprintCount)
  }

  // Throughput metrics
  @Get('throughput/:projectId')
  async getThroughputMetrics(
    @Param('projectId') projectId: number,
    @Query('sprintCount') sprintCount: number = 6
  ) {
    return this.analyticsService.calculateThroughputMetrics(projectId, sprintCount)
  }

  // Sprint scope data (for burnup charts)
  @Get('sprint-scope/:sprintId')
  async getSprintScopeData(@Param('sprintId') sprintId: number) {
    return this.analyticsService.getSprintScopeData(sprintId)
  }

  // Sprint health metrics
  @Get('sprint-health/:sprintId')
  async getSprintHealthMetrics(@Param('sprintId') sprintId: number) {
    return this.analyticsService.calculateSprintHealthMetrics(sprintId)
  }

  // Cumulative flow diagram
  @Get('cumulative-flow/:projectId')
  async getCumulativeFlowData(
    @Param('projectId') projectId: number,
    @Query('days') days: number = 30
  ) {
    return this.analyticsService.generateCumulativeFlowData(projectId, days)
  }
}