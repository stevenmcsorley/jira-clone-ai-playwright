import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { Issue } from '../issues/entities/issue.entity'
import { IssueStatus } from '../issues/enums/issue-status.enum'
import { Sprint } from '../sprints/entities/sprint.entity'
import { TimeLog } from '../issues/entities/time-log.entity'
import { IssueEvent } from '../notifications/entities/issue-event.entity'
import { VelocityService } from './velocity.service'

export interface BurndownData {
  date: string
  remainingWork: number
  idealRemaining: number
  actualCompleted: number
  idealCompleted: number
}

/**
 * Response shape of GET /api/analytics/cycle-time/:projectId
 *
 * Cycle time here is measured per DONE issue. Where the issue_events table
 * has 'status' events for the issue we use them: start = first transition
 * into in_progress (or code_review if in_progress was skipped), end = last
 * transition into done. Issues without recorded status events fall back to
 * the createdAt -> updatedAt window as a reasonable approximation (true
 * in-progress -> done timing needs issue_events, which only exist for
 * changes made after activity tracking was introduced).
 */
export interface CycleTimeDatapoint {
  issueId: number
  title: string
  type: string
  priority: string
  completedAt: string // ISO date of the (approximated) done transition
  cycleTimeDays: number
  source: 'events' | 'timestamps' // 'events' = derived from issue_events
}

export interface CycleTimeReport {
  datapoints: CycleTimeDatapoint[] // sorted by completedAt ascending
  stats: {
    count: number
    averageDays: number
    medianDays: number
    p85Days: number
  }
  // Monthly trend of average cycle time, oldest first (period = 'YYYY-MM')
  trend: Array<{ period: string; averageDays: number; count: number }>
}

export interface CycleTimeMetrics {
  averageCycleTime: number // in days
  medianCycleTime: number
  cycleTimeByType: Record<string, number>
  cycleTimeByPriority: Record<string, number>
  cycleTimeTrend: Array<{
    period: string
    averageCycleTime: number
  }>
}

export interface ThroughputMetrics {
  issuesPerSprint: number
  storyPointsPerSprint: number
  throughputTrend: Array<{
    sprintName: string
    issuesCompleted: number
    storyPointsCompleted: number
  }>
}

export interface SprintHealthMetrics {
  scopeCreepPercentage: number
  velocityVariance: number
  completionRate: number
  averageIssueAge: number
  blockedTimePercentage: number
  reworkRate: number
  qualityScore: number
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Issue)
    private issuesRepository: Repository<Issue>,
    @InjectRepository(Sprint)
    private sprintsRepository: Repository<Sprint>,
    @InjectRepository(TimeLog)
    private timeLogRepository: Repository<TimeLog>,
    @InjectRepository(IssueEvent)
    private issueEventsRepository: Repository<IssueEvent>,
    private velocityService: VelocityService,
  ) {}

  // Generate burndown chart data for a sprint
  async generateBurndownData(sprintId: number): Promise<BurndownData[]> {
    const sprint = await this.sprintsRepository.findOne({
      where: { id: sprintId },
      relations: ['issues'],
    })

    if (!sprint || !sprint.startDate || !sprint.endDate) {
      return []
    }

    const startDate = new Date(sprint.startDate)
    const endDate = new Date(sprint.endDate)
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

    // Get the original sprint scope (including issues that were moved out)
    let allOriginalIssues = sprint.issues || []

    if (sprint.status === 'completed') {
      // For completed sprints, find issues that were originally in this sprint
      // but moved back to backlog during sprint execution
      const movedIssues = await this.issuesRepository
        .createQueryBuilder('issue')
        .where('issue.projectId = :projectId', { projectId: sprint.projectId })
        .andWhere('issue.sprintId IS NULL')
        .andWhere('issue.updatedAt BETWEEN :startTime AND :endTime', {
          startTime: new Date(sprint.updatedAt.getTime() - 300000), // 5 minutes before sprint completion
          endTime: new Date(sprint.updatedAt.getTime() + 300000),   // 5 minutes after sprint completion
        })
        .getMany()

      allOriginalIssues = [...allOriginalIssues, ...movedIssues]
    }

    // Calculate original total scope
    const originalTotalStoryPoints = this.calculateStoryPoints(allOriginalIssues)

    // Calculate scope that was removed (moved out of sprint)
    const currentSprintStoryPoints = this.calculateStoryPoints(sprint.issues || [])
    const scopeRemoved = originalTotalStoryPoints - currentSprintStoryPoints

    const burndownData: BurndownData[] = []

    // Generate data for each day
    for (let day = 0; day <= totalDays; day++) {
      const currentDate = new Date(startDate)
      currentDate.setDate(startDate.getDate() + day)

      // Calculate how much work was completed by this date (only work still in sprint)
      const completedByDate = await this.getCompletedWorkByDate(sprintId, currentDate)

      // Ideal burndown based on original scope
      const idealProgress = day / totalDays
      const idealCompleted = originalTotalStoryPoints * idealProgress
      const idealRemaining = originalTotalStoryPoints - idealCompleted

      // Calculate the scope for this specific date (accounting for timeline of scope changes)
      const scopeForDate = await this.getScopeForDate(sprintId, currentDate, sprint, allOriginalIssues)

      // For completed sprints, use original scope to show true remaining work
      let actualRemaining: number
      if (sprint.status === 'completed') {
        // For completed sprints: show original scope minus completed work to reflect true remaining work
        actualRemaining = Math.max(0, originalTotalStoryPoints - completedByDate)
      } else {
        // For active sprints: use scope for date minus completed work (accounts for scope changes)
        actualRemaining = Math.max(0, scopeForDate - completedByDate)
      }

      burndownData.push({
        date: currentDate.toISOString().split('T')[0],
        remainingWork: actualRemaining,
        idealRemaining: Math.max(0, idealRemaining),
        actualCompleted: completedByDate,
        idealCompleted: idealCompleted,
      })
    }

    return burndownData
  }

  // Calculate cycle time metrics
  async calculateCycleTimeMetrics(projectId: number, sprintCount: number = 6): Promise<CycleTimeMetrics> {
    const sprints = await this.sprintsRepository
      .createQueryBuilder('sprint')
      .where('sprint.projectId = :projectId', { projectId })
      .andWhere('sprint.status = :status', { status: 'completed' })
      .orderBy('sprint.startDate', 'DESC')
      .limit(sprintCount)
      .getMany()

    if (sprints.length === 0) {
      return {
        averageCycleTime: 0,
        medianCycleTime: 0,
        cycleTimeByType: {},
        cycleTimeByPriority: {},
        cycleTimeTrend: [],
      }
    }

    const sprintIds = sprints.map(sprint => sprint.id)

    // Get completed issues with their creation and completion dates
    const completedIssues = await this.issuesRepository
      .createQueryBuilder('issue')
      .where('issue.sprintId IN (:...sprintIds)', { sprintIds })
      .andWhere('issue.status = :status', { status: 'done' })
      .getMany()

    // Calculate cycle times
    const cycleTimes: number[] = []
    const cycleTimesByType: Record<string, number[]> = {}
    const cycleTimesByPriority: Record<string, number[]> = {}

    completedIssues.forEach(issue => {
      const createdDate = new Date(issue.createdAt)
      const completedDate = new Date(issue.updatedAt) // Using updatedAt as completion date
      const cycleTimeDays = Math.ceil((completedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))

      cycleTimes.push(cycleTimeDays)

      // Group by type
      if (!cycleTimesByType[issue.type]) {
        cycleTimesByType[issue.type] = []
      }
      cycleTimesByType[issue.type].push(cycleTimeDays)

      // Group by priority
      if (!cycleTimesByPriority[issue.priority]) {
        cycleTimesByPriority[issue.priority] = []
      }
      cycleTimesByPriority[issue.priority].push(cycleTimeDays)
    })

    // Calculate averages
    const averageCycleTime = cycleTimes.length > 0
      ? cycleTimes.reduce((sum, time) => sum + time, 0) / cycleTimes.length
      : 0

    const medianCycleTime = this.calculateMedian(cycleTimes)

    // Calculate averages by type and priority
    const cycleTimeByType: Record<string, number> = {}
    Object.entries(cycleTimesByType).forEach(([type, times]) => {
      cycleTimeByType[type] = times.reduce((sum, time) => sum + time, 0) / times.length
    })

    const cycleTimeByPriority: Record<string, number> = {}
    Object.entries(cycleTimesByPriority).forEach(([priority, times]) => {
      cycleTimeByPriority[priority] = times.reduce((sum, time) => sum + time, 0) / times.length
    })

    // Generate trend data
    const cycleTimeTrend = await this.generateCycleTimeTrend(projectId, sprintCount)

    return {
      averageCycleTime: Math.round(averageCycleTime * 100) / 100,
      medianCycleTime: Math.round(medianCycleTime * 100) / 100,
      cycleTimeByType,
      cycleTimeByPriority,
      cycleTimeTrend,
    }
  }

  /**
   * Real cycle time report for GET /api/analytics/cycle-time/:projectId.
   *
   * Uses issue_events ('status' field) where they exist to time the
   * in_progress -> done window; falls back to createdAt -> updatedAt for
   * issues completed before activity tracking recorded any status events.
   * See CycleTimeReport for the documented response shape.
   */
  async getCycleTimeReport(projectId: number, days: number = 180): Promise<CycleTimeReport> {
    const since = new Date()
    since.setDate(since.getDate() - days)

    const doneIssues = await this.issuesRepository
      .createQueryBuilder('issue')
      .where('issue.projectId = :projectId', { projectId })
      .andWhere('issue.status = :status', { status: IssueStatus.DONE })
      .orderBy('issue.updatedAt', 'ASC')
      .getMany()

    const eventsByIssue = await this.getStatusEventsByIssue(doneIssues.map(i => i.id))

    const datapoints: CycleTimeDatapoint[] = []
    for (const issue of doneIssues) {
      const window = this.resolveCycleWindow(issue, eventsByIssue.get(issue.id) || [])
      if (!window) continue
      // Only include issues completed within the requested window
      if (window.completedAt < since) continue

      const elapsedDays = (window.completedAt.getTime() - window.startedAt.getTime()) / (1000 * 60 * 60 * 24)
      datapoints.push({
        issueId: issue.id,
        title: issue.title,
        type: issue.type,
        priority: issue.priority,
        completedAt: window.completedAt.toISOString(),
        cycleTimeDays: Math.round(Math.max(elapsedDays, 0) * 100) / 100,
        source: window.source,
      })
    }

    datapoints.sort((a, b) => a.completedAt.localeCompare(b.completedAt))

    const times = datapoints.map(d => d.cycleTimeDays)
    const averageDays = times.length > 0 ? times.reduce((sum, t) => sum + t, 0) / times.length : 0

    // Monthly trend (period = 'YYYY-MM'), oldest first
    const byMonth = new Map<string, number[]>()
    for (const d of datapoints) {
      const period = d.completedAt.slice(0, 7)
      const bucket = byMonth.get(period) || []
      bucket.push(d.cycleTimeDays)
      byMonth.set(period, bucket)
    }
    const trend = [...byMonth.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, values]) => ({
        period,
        averageDays: Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 100) / 100,
        count: values.length,
      }))

    return {
      datapoints,
      stats: {
        count: datapoints.length,
        averageDays: Math.round(averageDays * 100) / 100,
        medianDays: Math.round(this.calculateMedian(times) * 100) / 100,
        p85Days: Math.round(this.calculatePercentile(times, 85) * 100) / 100,
      },
      trend,
    }
  }

  /** Status-change events for the given issues, grouped per issue, oldest first. */
  private async getStatusEventsByIssue(issueIds: number[]): Promise<Map<number, IssueEvent[]>> {
    const map = new Map<number, IssueEvent[]>()
    if (issueIds.length === 0) return map

    const events = await this.issueEventsRepository.find({
      where: { issueId: In(issueIds), field: 'status' },
      order: { createdAt: 'ASC', id: 'ASC' },
    })
    for (const event of events) {
      const bucket = map.get(event.issueId) || []
      bucket.push(event)
      map.set(event.issueId, bucket)
    }
    return map
  }

  /**
   * Work out when an issue started active work and when it was completed.
   * Prefers issue_events; falls back to createdAt -> updatedAt otherwise.
   */
  private resolveCycleWindow(
    issue: Issue,
    statusEvents: IssueEvent[],
  ): { startedAt: Date; completedAt: Date; source: 'events' | 'timestamps' } | null {
    const doneEvents = statusEvents.filter(e => e.newValue === IssueStatus.DONE)
    if (doneEvents.length > 0) {
      const completedAt = new Date(doneEvents[doneEvents.length - 1].createdAt)
      const startEvent = statusEvents.find(
        e => e.newValue === IssueStatus.IN_PROGRESS || e.newValue === IssueStatus.CODE_REVIEW,
      )
      const startedAt = startEvent ? new Date(startEvent.createdAt) : new Date(issue.createdAt)
      return { startedAt, completedAt, source: 'events' }
    }

    // No recorded done transition: approximate with createdAt -> updatedAt
    if (issue.status !== IssueStatus.DONE) return null
    return {
      startedAt: new Date(issue.createdAt),
      completedAt: new Date(issue.updatedAt),
      source: 'timestamps',
    }
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0
    const sorted = [...values].sort((a, b) => a - b)
    const index = Math.min(sorted.length - 1, Math.ceil((percentile / 100) * sorted.length) - 1)
    return sorted[Math.max(0, index)]
  }

  // Calculate throughput metrics
  async calculateThroughputMetrics(projectId: number, sprintCount: number = 6): Promise<ThroughputMetrics> {
    const velocityData = await this.velocityService.getProjectVelocity(projectId, sprintCount)

    if (velocityData.length === 0) {
      return {
        issuesPerSprint: 0,
        storyPointsPerSprint: 0,
        throughputTrend: [],
      }
    }

    const avgIssuesPerSprint = velocityData.reduce((sum, data) => sum + data.issuesCompleted, 0) / velocityData.length
    const avgStoryPointsPerSprint = velocityData.reduce((sum, data) => sum + data.velocity, 0) / velocityData.length

    const throughputTrend = velocityData.map(data => ({
      sprintName: data.sprintName,
      issuesCompleted: data.issuesCompleted,
      storyPointsCompleted: data.velocity,
    }))

    return {
      issuesPerSprint: Math.round(avgIssuesPerSprint * 100) / 100,
      storyPointsPerSprint: Math.round(avgStoryPointsPerSprint * 100) / 100,
      throughputTrend,
    }
  }

  // Get sprint scope data (including completed sprint historical data)
  async getSprintScopeData(sprintId: number): Promise<{
    totalScope: number
    completedWork: number
    remainingWork: number
    completionRate: number
    completedIssuesCount: number
    incompleteIssuesCount: number
    totalIssuesCount: number
  }> {
    const sprint = await this.sprintsRepository.findOne({
      where: { id: sprintId },
      relations: ['issues'],
    })

    if (!sprint) {
      return { 
        totalScope: 0, 
        completedWork: 0, 
        remainingWork: 0, 
        completionRate: 0,
        completedIssuesCount: 0,
        incompleteIssuesCount: 0,
        totalIssuesCount: 0
      }
    }

    // For completed sprints, we need to account for issues that were moved back to backlog
    let allSprintIssues = sprint.issues || []

    if (sprint.status === 'completed') {
      // For completed sprints, also find issues that were originally in this sprint
      // but moved back to backlog. Include both completed and incomplete moved issues.
      const potentialMovedIssues = await this.issuesRepository
        .createQueryBuilder('issue')
        .where('issue.projectId = :projectId', { projectId: sprint.projectId })
        .andWhere('issue.sprintId IS NULL')
        .andWhere('issue.updatedAt BETWEEN :startTime AND :endTime', {
          startTime: new Date(sprint.updatedAt.getTime() - 300000), // 5 minutes before sprint completion
          endTime: new Date(sprint.updatedAt.getTime() + 300000),   // 5 minutes after sprint completion
        })
        .getMany()

      allSprintIssues = [...allSprintIssues, ...potentialMovedIssues]
    }

    const totalScope = allSprintIssues.reduce((sum, issue) => {
      const storyPoints = issue.storyPoints
      if (typeof storyPoints === 'number') {
        return sum + storyPoints
      } else if (typeof storyPoints === 'string' && !isNaN(Number(storyPoints))) {
        return sum + Number(storyPoints)
      } else {
        const storyPointMap: Record<string, number> = {
          'XS': 1, 'S': 3, 'M': 5, 'L': 8, 'XL': 13, 'XXL': 21, '?': 0
        }
        return sum + (storyPointMap[storyPoints as string] || 0)
      }
    }, 0)

    // Count completed and incomplete issues
    const completedIssues = allSprintIssues.filter(issue => issue.status === 'done')
    const incompleteIssues = allSprintIssues.filter(issue => issue.status !== 'done')
    
    const completedWork = completedIssues.reduce((sum, issue) => {
      const storyPoints = issue.storyPoints
      if (typeof storyPoints === 'number') {
        return sum + storyPoints
      } else if (typeof storyPoints === 'string' && !isNaN(Number(storyPoints))) {
        return sum + Number(storyPoints)
      } else {
        const storyPointMap: Record<string, number> = {
          'XS': 1, 'S': 3, 'M': 5, 'L': 8, 'XL': 13, 'XXL': 21, '?': 0
        }
        return sum + (storyPointMap[storyPoints as string] || 0)
      }
    }, 0)

    const remainingWork = totalScope - completedWork
    const completionRate = totalScope > 0 ? (completedWork / totalScope) * 100 : 0

    return {
      totalScope,
      completedWork,
      remainingWork,
      completionRate: Math.round(completionRate * 10) / 10, // Round to 1 decimal place
      completedIssuesCount: completedIssues.length,
      incompleteIssuesCount: incompleteIssues.length,
      totalIssuesCount: allSprintIssues.length
    }
  }

  // Calculate sprint health metrics
  async calculateSprintHealthMetrics(sprintId: number): Promise<SprintHealthMetrics> {
    const sprint = await this.sprintsRepository.findOne({
      where: { id: sprintId },
      relations: ['issues'],
    })

    if (!sprint || !sprint.issues) {
      return {
        scopeCreepPercentage: 0,
        velocityVariance: 0,
        completionRate: 0,
        averageIssueAge: 0,
        blockedTimePercentage: 0,
        reworkRate: 0,
        qualityScore: 0,
      }
    }

    const issues = sprint.issues
    const completedIssues = issues.filter(issue => issue.status === 'done')

    // Calculate metrics
    const completionRate = issues.length > 0 ? (completedIssues.length / issues.length) * 100 : 0

    // Average issue age (from creation to completion)
    const issueAges = completedIssues.map(issue => {
      const created = new Date(issue.createdAt)
      const completed = new Date(issue.updatedAt)
      return Math.ceil((completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
    })
    const averageIssueAge = issueAges.length > 0
      ? issueAges.reduce((sum, age) => sum + age, 0) / issueAges.length
      : 0

    // Basic quality score based on completion rate and consistency
    const qualityScore = completionRate * 0.6 + (issueAges.length > 0 ? Math.max(0, 100 - averageIssueAge * 2) : 50) * 0.4

    return {
      scopeCreepPercentage: 0, // Would need additional tracking for scope changes
      velocityVariance: 0, // Would need historical comparison
      completionRate: Math.round(completionRate * 100) / 100,
      averageIssueAge: Math.round(averageIssueAge * 100) / 100,
      blockedTimePercentage: 0, // Would need status change tracking
      reworkRate: 0, // Would need rework tracking
      qualityScore: Math.round(qualityScore * 100) / 100,
    }
  }

  // Get comprehensive analytics dashboard data
  async getDashboardAnalytics(projectId: number) {
    const [
      velocityTrends,
      velocityForecast,
      teamComparison,
      cycleTimeMetrics,
      throughputMetrics,
    ] = await Promise.all([
      this.velocityService.getVelocityTrends(projectId),
      this.velocityService.generateVelocityForecast(projectId),
      this.velocityService.getTeamVelocityComparison(projectId),
      this.calculateCycleTimeMetrics(projectId),
      this.calculateThroughputMetrics(projectId),
    ])

    return {
      velocityTrends,
      velocityForecast,
      teamComparison,
      cycleTimeMetrics,
      throughputMetrics,
      lastUpdated: new Date().toISOString(),
    }
  }

  // Helper methods
  private async getCompletedWorkByDate(sprintId: number, date: Date): Promise<number> {
    // Get the sprint to understand its state
    const sprint = await this.sprintsRepository.findOne({
      where: { id: sprintId },
      relations: ['issues'],
    })

    if (!sprint) return 0

    let completedIssues: any[] = []

    if (sprint.status === 'completed') {
      // For completed sprints, we need to look at all issues that were originally in the sprint
      // including those that were moved back to backlog as incomplete

      // Get issues currently in the sprint (these are the completed ones)
      const currentSprintIssues = await this.issuesRepository
        .createQueryBuilder('issue')
        .where('issue.sprintId = :sprintId', { sprintId })
        .andWhere('issue.status = :status', { status: 'done' })
        .andWhere('issue.updatedAt <= :date', { date })
        .getMany()

      // Get issues that were moved back to backlog but were originally in this sprint
      const movedBacklogIssues = await this.issuesRepository
        .createQueryBuilder('issue')
        .where('issue.projectId = :projectId', { projectId: sprint.projectId })
        .andWhere('issue.sprintId IS NULL')
        .andWhere('issue.status = :status', { status: 'done' })
        .andWhere('issue.updatedAt <= :date', { date })
        .andWhere('issue.updatedAt BETWEEN :startTime AND :endTime', {
          startTime: new Date(sprint.updatedAt.getTime() - 300000), // 5 minutes before sprint completion
          endTime: new Date(sprint.updatedAt.getTime() + 300000),   // 5 minutes after sprint completion
        })
        .getMany()

      completedIssues = [...currentSprintIssues, ...movedBacklogIssues]
    } else {
      // For active sprints, use the normal logic
      completedIssues = await this.issuesRepository
        .createQueryBuilder('issue')
        .where('issue.sprintId = :sprintId', { sprintId })
        .andWhere('issue.status = :status', { status: 'done' })
        .andWhere('issue.updatedAt <= :date', { date })
        .getMany()
    }

    return this.calculateStoryPoints(completedIssues)
  }

  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0

    const sorted = [...values].sort((a, b) => a - b)
    const middle = Math.floor(sorted.length / 2)

    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2
    } else {
      return sorted[middle]
    }
  }

  private async generateCycleTimeTrend(projectId: number, sprintCount: number): Promise<Array<{
    period: string
    averageCycleTime: number
  }>> {
    const velocityData = await this.velocityService.getProjectVelocity(projectId, sprintCount)

    // Simplified trend - would need more detailed cycle time tracking
    return velocityData.map(data => ({
      period: data.sprintName,
      averageCycleTime: data.velocity > 0 ? Math.round((data.issuesCompleted / data.velocity) * 7) : 0, // Rough estimate
    }))
  }

  // Helper method to calculate scope for a specific date based on issue timeline
  private async getScopeForDate(sprintId: number, date: Date, sprint: any, originalIssues: any[]): Promise<number> {
    // Start with original scope, then subtract issues that were moved out by this date
    let scopeForDate = this.calculateStoryPoints(originalIssues)

    // Find issues that were moved out of the sprint by this date
    const movedOutIssues = await this.issuesRepository
      .createQueryBuilder('issue')
      .where('issue.projectId = :projectId', { projectId: sprint.projectId })
      .andWhere('issue.sprintId IS NULL')
      .andWhere('issue.updatedAt <= :date', { date })
      .andWhere('issue.updatedAt >= :sprintStart', { sprintStart: sprint.createdAt })
      .getMany()

    // Filter to only issues that were likely originally in this sprint
    const relevantMovedIssues = movedOutIssues.filter(issue =>
      originalIssues.some(original => original.id === issue.id)
    )

    const scopeReduced = this.calculateStoryPoints(relevantMovedIssues)
    return scopeForDate - scopeReduced
  }

  // Generate cumulative flow diagram data.
  //
  // Each day's counts are reconstructed from real issue statuses: where the
  // issue_events table has 'status' events we replay them to know the exact
  // status on a given day; issues without recorded status events fall back
  // to a createdAt -> updatedAt approximation (created in todo; if currently
  // done, treated as done from updatedAt onwards; otherwise assumed to have
  // held their current status since creation).
  async generateCumulativeFlowData(projectId: number, days: number = 30): Promise<{
    chartData: Array<{
      date: string
      todo: number
      inProgress: number
      codeReview: number
      done: number
      total: number
    }>
    metrics: {
      avgCycleTime: number
      avgThroughput: number
      currentWIP: number
      bottleneckStatus: string | null
      wipTrend: 'increasing' | 'decreasing' | 'stable'
    }
  }> {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - days)

    const issues = await this.issuesRepository
      .createQueryBuilder('issue')
      .where('issue.projectId = :projectId', { projectId })
      .getMany()

    const eventsByIssue = await this.getStatusEventsByIssue(issues.map(i => i.id))

    const chartData: Array<{
      date: string
      todo: number
      inProgress: number
      codeReview: number
      done: number
      total: number
    }> = []
    const wipData: number[] = [] // in_progress + code_review, for trend analysis

    for (let day = 0; day <= days; day++) {
      const currentDate = new Date(startDate)
      currentDate.setDate(startDate.getDate() + day)
      currentDate.setHours(23, 59, 59, 999) // End of day

      const counts: Record<IssueStatus, number> = {
        [IssueStatus.TODO]: 0,
        [IssueStatus.IN_PROGRESS]: 0,
        [IssueStatus.CODE_REVIEW]: 0,
        [IssueStatus.DONE]: 0,
      }

      for (const issue of issues) {
        const status = this.statusAtDate(issue, eventsByIssue.get(issue.id) || [], currentDate)
        if (status) counts[status]++
      }

      const total =
        counts[IssueStatus.TODO] +
        counts[IssueStatus.IN_PROGRESS] +
        counts[IssueStatus.CODE_REVIEW] +
        counts[IssueStatus.DONE]

      chartData.push({
        date: currentDate.toISOString().split('T')[0],
        todo: counts[IssueStatus.TODO],
        inProgress: counts[IssueStatus.IN_PROGRESS],
        codeReview: counts[IssueStatus.CODE_REVIEW],
        done: counts[IssueStatus.DONE],
        total,
      })

      wipData.push(counts[IssueStatus.IN_PROGRESS] + counts[IssueStatus.CODE_REVIEW])
    }

    // Calculate metrics
    const lastDay = chartData[chartData.length - 1]
    const currentWIP = lastDay ? lastDay.inProgress + lastDay.codeReview : 0

    // Average cycle time over issues completed within the window (events-based
    // where possible, createdAt -> updatedAt fallback otherwise)
    const cycleTimes: number[] = []
    let completedInPeriod = 0
    for (const issue of issues) {
      const window = this.resolveCycleWindow(issue, eventsByIssue.get(issue.id) || [])
      if (!window || window.completedAt < startDate) continue
      completedInPeriod++
      cycleTimes.push((window.completedAt.getTime() - window.startedAt.getTime()) / (1000 * 60 * 60 * 24))
    }

    const avgCycleTime = cycleTimes.length > 0
      ? Math.round((cycleTimes.reduce((sum, time) => sum + time, 0) / cycleTimes.length) * 10) / 10
      : 0

    // Calculate average throughput (issues completed per week)
    const weeksInPeriod = days / 7
    const avgThroughput = weeksInPeriod > 0
      ? Math.round((completedInPeriod / weeksInPeriod) * 10) / 10
      : 0

    // Detect bottlenecks by finding status with highest accumulation
    const lastWeekData = chartData.slice(-7)
    const statusAccumulation = {
      todo: lastWeekData.reduce((sum, d) => sum + d.todo, 0) / Math.max(lastWeekData.length, 1),
      inProgress: lastWeekData.reduce((sum, d) => sum + d.inProgress, 0) / Math.max(lastWeekData.length, 1),
      codeReview: lastWeekData.reduce((sum, d) => sum + d.codeReview, 0) / Math.max(lastWeekData.length, 1),
    }

    let bottleneckStatus: string | null = null
    if (statusAccumulation.codeReview > Math.max(statusAccumulation.inProgress, 1) * 1.5) {
      bottleneckStatus = 'code_review'
    } else if (statusAccumulation.inProgress > Math.max(statusAccumulation.todo, 1) * 1.5) {
      bottleneckStatus = 'in_progress'
    } else if (statusAccumulation.todo > Math.max(statusAccumulation.inProgress + statusAccumulation.codeReview, 1) * 2) {
      bottleneckStatus = 'todo'
    }

    // Calculate WIP trend
    const firstHalfWIP = wipData.slice(0, Math.floor(wipData.length / 2))
    const secondHalfWIP = wipData.slice(Math.floor(wipData.length / 2))

    const firstAvg = firstHalfWIP.reduce((sum, wip) => sum + wip, 0) / firstHalfWIP.length
    const secondAvg = secondHalfWIP.reduce((sum, wip) => sum + wip, 0) / secondHalfWIP.length

    let wipTrend: 'increasing' | 'decreasing' | 'stable' = 'stable'
    if (secondAvg > firstAvg * 1.2) {
      wipTrend = 'increasing'
    } else if (secondAvg < firstAvg * 0.8) {
      wipTrend = 'decreasing'
    }

    return {
      chartData,
      metrics: {
        avgCycleTime,
        avgThroughput,
        currentWIP,
        bottleneckStatus,
        wipTrend
      }
    }
  }

  /**
   * The status an issue held at the end of a given day, or null if the issue
   * did not exist yet. Replays issue_events 'status' events where available;
   * otherwise approximates from createdAt/updatedAt (see CFD doc comment).
   */
  private statusAtDate(issue: Issue, statusEvents: IssueEvent[], date: Date): IssueStatus | null {
    if (new Date(issue.createdAt) > date) return null

    const validStatuses = new Set<string>(Object.values(IssueStatus))
    const toStatus = (value: string | null): IssueStatus =>
      value && validStatuses.has(value) ? (value as IssueStatus) : IssueStatus.TODO

    if (statusEvents.length > 0) {
      let lastBefore: IssueEvent | null = null
      for (const event of statusEvents) {
        if (new Date(event.createdAt) <= date) lastBefore = event
        else break
      }
      if (lastBefore) return toStatus(lastBefore.newValue)
      // Before the first recorded transition: the issue held its initial status
      return toStatus(statusEvents[0].oldValue)
    }

    // No recorded status events: fall back to timestamps. Issues start in
    // todo; if currently done, treat updatedAt as the done transition.
    if (issue.status === IssueStatus.DONE) {
      return new Date(issue.updatedAt) <= date ? IssueStatus.DONE : IssueStatus.TODO
    }
    return issue.status
  }

  // Helper method to calculate story points from issue array
  private calculateStoryPoints(issues: any[]): number {
    return issues.reduce((sum, issue) => {
      const storyPoints = issue.storyPoints
      if (typeof storyPoints === 'number') {
        return sum + storyPoints
      } else if (typeof storyPoints === 'string' && !isNaN(Number(storyPoints))) {
        return sum + Number(storyPoints)
      } else {
        // For non-numeric story points like 'XS', 'S', 'M', etc., map to numbers
        const storyPointMap: Record<string, number> = {
          'XS': 1,
          'S': 3,
          'M': 5,
          'L': 8,
          'XL': 13,
          'XXL': 21,
          '?': 0
        }
        return sum + (storyPointMap[storyPoints as string] || 0)
      }
    }, 0)
  }
}