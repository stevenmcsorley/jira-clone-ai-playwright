import { Repository } from 'typeorm';
import { Issue } from '../issues/entities/issue.entity';
import { Sprint } from '../sprints/entities/sprint.entity';
import { TimeLog } from '../issues/entities/time-log.entity';
import { VelocityService } from './velocity.service';
export interface BurndownData {
    date: string;
    remainingWork: number;
    idealRemaining: number;
    actualCompleted: number;
    idealCompleted: number;
}
export interface CycleTimeMetrics {
    averageCycleTime: number;
    medianCycleTime: number;
    cycleTimeByType: Record<string, number>;
    cycleTimeByPriority: Record<string, number>;
    cycleTimeTrend: Array<{
        period: string;
        averageCycleTime: number;
    }>;
}
export interface ThroughputMetrics {
    issuesPerSprint: number;
    storyPointsPerSprint: number;
    throughputTrend: Array<{
        sprintName: string;
        issuesCompleted: number;
        storyPointsCompleted: number;
    }>;
}
export interface SprintHealthMetrics {
    scopeCreepPercentage: number;
    velocityVariance: number;
    completionRate: number;
    averageIssueAge: number;
    blockedTimePercentage: number;
    reworkRate: number;
    qualityScore: number;
}
export declare class AnalyticsService {
    private issuesRepository;
    private sprintsRepository;
    private timeLogRepository;
    private velocityService;
    constructor(issuesRepository: Repository<Issue>, sprintsRepository: Repository<Sprint>, timeLogRepository: Repository<TimeLog>, velocityService: VelocityService);
    generateBurndownData(sprintId: number): Promise<BurndownData[]>;
    calculateCycleTimeMetrics(projectId: number, sprintCount?: number): Promise<CycleTimeMetrics>;
    calculateThroughputMetrics(projectId: number, sprintCount?: number): Promise<ThroughputMetrics>;
    getSprintScopeData(sprintId: number): Promise<{
        totalScope: number;
        completedWork: number;
        remainingWork: number;
        completionRate: number;
        completedIssuesCount: number;
        incompleteIssuesCount: number;
        totalIssuesCount: number;
    }>;
    calculateSprintHealthMetrics(sprintId: number): Promise<SprintHealthMetrics>;
    getDashboardAnalytics(projectId: number): Promise<{
        velocityTrends: import("./velocity.service").VelocityTrends;
        velocityForecast: import("./velocity.service").VelocityForecast;
        teamComparison: import("./velocity.service").TeamVelocityComparison[];
        cycleTimeMetrics: CycleTimeMetrics;
        throughputMetrics: ThroughputMetrics;
        lastUpdated: string;
    }>;
    private getCompletedWorkByDate;
    private calculateMedian;
    private generateCycleTimeTrend;
    private getScopeForDate;
    generateCumulativeFlowData(projectId: number, days?: number): Promise<{
        chartData: Array<{
            date: string;
            todo: number;
            inProgress: number;
            done: number;
            total: number;
        }>;
        metrics: {
            avgCycleTime: number;
            avgThroughput: number;
            currentWIP: number;
            bottleneckStatus: string | null;
            wipTrend: 'increasing' | 'decreasing' | 'stable';
        };
    }>;
    private calculateStoryPoints;
}
