import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Issue } from '../issues/entities/issue.entity'
import { Sprint } from '../sprints/entities/sprint.entity'
import { Project } from '../projects/entities/project.entity'

export interface VelocityData {
  sprintId: number
  sprintName: string
  startDate: Date
  endDate: Date
  plannedPoints: number
  completedPoints: number
  velocity: number
  issuesCompleted: number
  issuesPlanned: number
  completionRate: number
}

export interface VelocityTrends {
  average3Sprints: number
  average6Sprints: number
  average12Sprints: number
  currentTrend: 'increasing' | 'decreasing' | 'stable'
  trendPercentage: number
  standardDeviation: number
  confidenceInterval: [number, number]
}

export interface VelocityForecast {
  projectedVelocity: number
  confidenceLevel: number
  estimatedReleaseDate?: Date
  remainingSprintsForScope?: number
  riskAssessment: 'low' | 'medium' | 'high'
  recommendations: string[]
}

export interface TeamVelocityComparison {
  teamMember: {
    id: number
    name: string
    email: string
  }
  individualVelocity: number
  contributionPercentage: number
  tasksCompleted: number
  averageTaskSize: number
  consistencyScore: number
}

@Injectable()
export class VelocityService {
  constructor(
    @InjectRepository(Issue)
    private issuesRepository: Repository<Issue>,
    @InjectRepository(Sprint)
    private sprintsRepository: Repository<Sprint>,
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
  ) {}

  // Get velocity data for a project
  async getProjectVelocity(projectId: number, sprintCount: number = 12): Promise<VelocityData[]> {
    const sprints = await this.sprintsRepository
      .createQueryBuilder('sprint')
      .leftJoinAndSelect('sprint.issues', 'issue')
      .where('sprint.projectId = :projectId', { projectId })
      .andWhere('sprint.status IN (:...statuses)', { statuses: ['completed', 'active'] })
      .orderBy('sprint.startDate', 'DESC')
      .limit(sprintCount)
      .getMany()

    const velocityData: VelocityData[] = []

    for (const sprint of sprints) {
      const sprintIssues = sprint.issues || []

      // Calculate planned points (all issues that were in the sprint)
      const plannedPoints = sprintIssues.reduce((sum, issue) => {
        const storyPoints = issue.storyPoints
        if (typeof storyPoints === 'number') {
          return sum + storyPoints
        } else if (typeof storyPoints === 'string' && !isNaN(Number(storyPoints))) {
          return sum + Number(storyPoints)
        } else {
          // For non-numeric story points like 'XS', 'S', 'M', etc., map to numbers
          const storyPointMap: Record<string, number> = {
            'XS': 1, 'S': 3, 'M': 5, 'L': 8, 'XL': 13, 'XXL': 21, '?': 0
          }
          return sum + (storyPointMap[storyPoints as string] || 0)
        }
      }, 0)

      // Calculate completed points (only done issues)
      const completedIssues = sprintIssues.filter(issue => issue.status === 'done')
      const completedPoints = completedIssues.reduce((sum, issue) => {
        const storyPoints = issue.storyPoints
        if (typeof storyPoints === 'number') {
          return sum + storyPoints
        } else if (typeof storyPoints === 'string' && !isNaN(Number(storyPoints))) {
          return sum + Number(storyPoints)
        } else {
          // For non-numeric story points like 'XS', 'S', 'M', etc., map to numbers
          const storyPointMap: Record<string, number> = {
            'XS': 1, 'S': 3, 'M': 5, 'L': 8, 'XL': 13, 'XXL': 21, '?': 0
          }
          return sum + (storyPointMap[storyPoints as string] || 0)
        }
      }, 0)

      // Calculate completion rate
      const completionRate = sprintIssues.length > 0
        ? (completedIssues.length / sprintIssues.length) * 100
        : 0

      velocityData.push({
        sprintId: sprint.id,
        sprintName: sprint.name,
        startDate: sprint.startDate,
        endDate: sprint.endDate,
        plannedPoints,
        completedPoints,
        velocity: completedPoints, // Velocity = story points completed
        issuesCompleted: completedIssues.length,
        issuesPlanned: sprintIssues.length,
        completionRate: Math.round(completionRate * 100) / 100,
      })
    }

    return velocityData.reverse() // Return in chronological order
  }

  // Calculate velocity trends and statistics
  async getVelocityTrends(projectId: number): Promise<VelocityTrends> {
    const velocityData = await this.getProjectVelocity(projectId, 12)

    if (velocityData.length === 0) {
      return {
        average3Sprints: 0,
        average6Sprints: 0,
        average12Sprints: 0,
        currentTrend: 'stable',
        trendPercentage: 0,
        standardDeviation: 0,
        confidenceInterval: [0, 0],
      }
    }

    const velocities = velocityData.map(data => data.velocity)

    // Calculate averages
    const average3Sprints = this.calculateAverage(velocities.slice(-3))
    const average6Sprints = this.calculateAverage(velocities.slice(-6))
    const average12Sprints = this.calculateAverage(velocities)

    // Calculate trend
    const { trend, percentage } = this.calculateTrend(velocities)

    // Calculate standard deviation
    const standardDeviation = this.calculateStandardDeviation(velocities)

    // Calculate confidence interval (95%)
    const mean = average12Sprints
    const margin = 1.96 * (standardDeviation / Math.sqrt(velocities.length))
    const confidenceInterval: [number, number] = [
      Math.max(0, mean - margin),
      mean + margin
    ]

    return {
      average3Sprints: Math.round(average3Sprints * 100) / 100,
      average6Sprints: Math.round(average6Sprints * 100) / 100,
      average12Sprints: Math.round(average12Sprints * 100) / 100,
      currentTrend: trend,
      trendPercentage: Math.round(percentage * 100) / 100,
      standardDeviation: Math.round(standardDeviation * 100) / 100,
      confidenceInterval: [
        Math.round(confidenceInterval[0] * 100) / 100,
        Math.round(confidenceInterval[1] * 100) / 100,
      ],
    }
  }

  // Generate velocity forecast
  async generateVelocityForecast(
    projectId: number,
    remainingStoryPoints?: number,
    targetDate?: Date
  ): Promise<VelocityForecast> {
    const trends = await this.getVelocityTrends(projectId)
    const velocityData = await this.getProjectVelocity(projectId, 6)

    if (velocityData.length === 0) {
      return {
        projectedVelocity: 0,
        confidenceLevel: 0,
        riskAssessment: 'high',
        recommendations: ['Insufficient historical data for forecasting'],
      }
    }

    // Use recent average for projection
    const projectedVelocity = trends.average3Sprints

    // Calculate confidence level based on consistency
    const confidenceLevel = this.calculateConfidenceLevel(velocityData)

    // Risk assessment
    const riskAssessment = this.assessRisk(trends, confidenceLevel)

    // Generate recommendations
    const recommendations = this.generateRecommendations(trends, velocityData, riskAssessment)

    const forecast: VelocityForecast = {
      projectedVelocity: Math.round(projectedVelocity * 100) / 100,
      confidenceLevel: Math.round(confidenceLevel * 100) / 100,
      riskAssessment,
      recommendations,
    }

    // Calculate release forecasts if scope is provided
    if (remainingStoryPoints && projectedVelocity > 0) {
      const sprintsNeeded = Math.ceil(remainingStoryPoints / projectedVelocity)
      forecast.remainingSprintsForScope = sprintsNeeded

      // Estimate release date based on recent sprint duration
      if (velocityData.length > 0) {
        const averageSprintDuration = this.calculateAverageSprintDuration(velocityData)
        const estimatedReleaseDate = new Date()
        estimatedReleaseDate.setDate(estimatedReleaseDate.getDate() + (sprintsNeeded * averageSprintDuration))
        forecast.estimatedReleaseDate = estimatedReleaseDate
      }
    }

    return forecast
  }

  // Get team velocity comparison
  async getTeamVelocityComparison(projectId: number, sprintCount: number = 6): Promise<TeamVelocityComparison[]> {
    const sprints = await this.sprintsRepository
      .createQueryBuilder('sprint')
      .where('sprint.projectId = :projectId', { projectId })
      .andWhere('sprint.status = :status', { status: 'completed' })
      .orderBy('sprint.startDate', 'DESC')
      .limit(sprintCount)
      .getMany()

    if (sprints.length === 0) {
      return []
    }

    const sprintIds = sprints.map(sprint => sprint.id)

    // Get all completed issues from these sprints with assignees
    const completedIssues = await this.issuesRepository
      .createQueryBuilder('issue')
      .leftJoinAndSelect('issue.assignee', 'assignee')
      .where('issue.sprintId IN (:...sprintIds)', { sprintIds })
      .andWhere('issue.status = :status', { status: 'done' })
      .andWhere('issue.assigneeId IS NOT NULL')
      .getMany()

    // Group by assignee
    const teamStats = new Map<number, {
      user: any
      totalPoints: number
      tasksCompleted: number
      taskSizes: number[]
    }>()

    completedIssues.forEach(issue => {
      const assigneeId = issue.assigneeId!
      const storyPoints = issue.storyPoints
      let points = 0

      if (typeof storyPoints === 'number') {
        points = storyPoints
      } else if (typeof storyPoints === 'string' && !isNaN(Number(storyPoints))) {
        points = Number(storyPoints)
      } else if (typeof storyPoints === 'string') {
        // For non-numeric story points like 'XS', 'S', 'M', etc., map to numbers
        const storyPointMap: Record<string, number> = {
          'XS': 1, 'S': 3, 'M': 5, 'L': 8, 'XL': 13, 'XXL': 21, '?': 0
        }
        points = storyPointMap[storyPoints] || 0
      }

      if (!teamStats.has(assigneeId)) {
        teamStats.set(assigneeId, {
          user: issue.assignee,
          totalPoints: 0,
          tasksCompleted: 0,
          taskSizes: [],
        })
      }

      const stats = teamStats.get(assigneeId)!
      stats.totalPoints += points
      stats.tasksCompleted += 1
      if (points > 0) stats.taskSizes.push(points)
    })

    // Calculate total points for percentage calculation
    const totalPoints = Array.from(teamStats.values()).reduce((sum, stats) => sum + stats.totalPoints, 0)

    // Convert to comparison format
    const comparisons: TeamVelocityComparison[] = Array.from(teamStats.entries()).map(([userId, stats]) => {
      const averageTaskSize = stats.taskSizes.length > 0
        ? stats.taskSizes.reduce((sum, size) => sum + size, 0) / stats.taskSizes.length
        : 0

      const consistencyScore = stats.taskSizes.length > 1
        ? this.calculateConsistencyScore(stats.taskSizes)
        : 0

      return {
        teamMember: {
          id: stats.user.id,
          name: stats.user.name,
          email: stats.user.email,
        },
        individualVelocity: Math.round(stats.totalPoints * 100) / 100,
        contributionPercentage: totalPoints > 0
          ? Math.round((stats.totalPoints / totalPoints) * 100 * 100) / 100
          : 0,
        tasksCompleted: stats.tasksCompleted,
        averageTaskSize: Math.round(averageTaskSize * 100) / 100,
        consistencyScore: Math.round(consistencyScore * 100) / 100,
      }
    })

    return comparisons.sort((a, b) => b.individualVelocity - a.individualVelocity)
  }

  // Helper methods
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0
    return values.reduce((sum, value) => sum + value, 0) / values.length
  }

  private calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0
    const mean = this.calculateAverage(values)
    const squaredDifferences = values.map(value => Math.pow(value - mean, 2))
    return Math.sqrt(this.calculateAverage(squaredDifferences))
  }

  private calculateTrend(velocities: number[]): { trend: 'increasing' | 'decreasing' | 'stable', percentage: number } {
    if (velocities.length < 2) {
      return { trend: 'stable', percentage: 0 }
    }

    const recentVelocities = velocities.slice(-3)
    const earlierVelocities = velocities.slice(-6, -3)

    if (earlierVelocities.length === 0) {
      return { trend: 'stable', percentage: 0 }
    }

    const recentAverage = this.calculateAverage(recentVelocities)
    const earlierAverage = this.calculateAverage(earlierVelocities)

    if (earlierAverage === 0) {
      return { trend: 'stable', percentage: 0 }
    }

    const percentageChange = ((recentAverage - earlierAverage) / earlierAverage) * 100

    if (Math.abs(percentageChange) < 5) {
      return { trend: 'stable', percentage: 0 }
    }

    return {
      trend: percentageChange > 0 ? 'increasing' : 'decreasing',
      percentage: Math.abs(percentageChange),
    }
  }

  private calculateConfidenceLevel(velocityData: VelocityData[]): number {
    if (velocityData.length === 0) return 0

    // Base confidence on completion rate consistency and velocity stability
    const completionRates = velocityData.map(data => data.completionRate)
    const velocities = velocityData.map(data => data.velocity)

    const avgCompletionRate = this.calculateAverage(completionRates)
    const completionRateStability = 100 - this.calculateStandardDeviation(completionRates)

    const velocityStability = velocities.length > 1
      ? 100 - (this.calculateStandardDeviation(velocities) / this.calculateAverage(velocities)) * 100
      : 50

    // Weighted confidence score
    const confidence = (avgCompletionRate * 0.4) + (completionRateStability * 0.3) + (velocityStability * 0.3)

    return Math.max(0, Math.min(100, confidence))
  }

  private assessRisk(trends: VelocityTrends, confidenceLevel: number): 'low' | 'medium' | 'high' {
    if (confidenceLevel > 80 && trends.currentTrend !== 'decreasing') {
      return 'low'
    } else if (confidenceLevel > 60 && trends.trendPercentage < 20) {
      return 'medium'
    } else {
      return 'high'
    }
  }

  private generateRecommendations(
    trends: VelocityTrends,
    velocityData: VelocityData[],
    riskAssessment: 'low' | 'medium' | 'high'
  ): string[] {
    const recommendations: string[] = []

    if (riskAssessment === 'high') {
      recommendations.push('Consider reviewing sprint planning process due to high variance in velocity')
    }

    if (trends.currentTrend === 'decreasing') {
      recommendations.push('Velocity is declining - investigate potential blockers or team capacity issues')
    }

    if (trends.average3Sprints < trends.average12Sprints * 0.8) {
      recommendations.push('Recent velocity is significantly below historical average - review team workload')
    }

    const avgCompletionRate = this.calculateAverage(velocityData.map(d => d.completionRate))
    if (avgCompletionRate < 70) {
      recommendations.push('Low completion rate detected - consider reducing sprint scope or improving estimation')
    }

    if (trends.standardDeviation > trends.average12Sprints * 0.4) {
      recommendations.push('High velocity variance - focus on consistent sprint planning and estimation accuracy')
    }

    if (recommendations.length === 0) {
      recommendations.push('Velocity trends look healthy - maintain current sprint planning practices')
    }

    return recommendations
  }

  private calculateAverageSprintDuration(velocityData: VelocityData[]): number {
    if (velocityData.length === 0) return 14 // Default 2 weeks

    const durations = velocityData
      .filter(data => data.startDate && data.endDate)
      .map(data => {
        const start = new Date(data.startDate)
        const end = new Date(data.endDate)
        return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      })

    return durations.length > 0 ? this.calculateAverage(durations) : 14
  }

  private calculateConsistencyScore(taskSizes: number[]): number {
    if (taskSizes.length < 2) return 100

    const mean = this.calculateAverage(taskSizes)
    const standardDeviation = this.calculateStandardDeviation(taskSizes)

    // Lower standard deviation relative to mean = higher consistency
    const coefficientOfVariation = mean > 0 ? (standardDeviation / mean) : 0

    // Convert to 0-100 scale (lower CV = higher score)
    return Math.max(0, 100 - (coefficientOfVariation * 50))
  }
}