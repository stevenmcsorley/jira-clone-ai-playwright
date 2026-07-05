import { Repository } from 'typeorm';
import { AnalyticsService } from './analytics.service';
import { VelocityService } from './velocity.service';
import { Sprint } from '../sprints/entities/sprint.entity';
import { WorkspaceScopeService } from '../workspaces/workspace-scope.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    private readonly velocityService;
    private readonly workspaceScope;
    private readonly sprintsRepository;
    constructor(analyticsService: AnalyticsService, velocityService: VelocityService, workspaceScope: WorkspaceScopeService, sprintsRepository: Repository<Sprint>);
    private assertSprint;
    getDashboardAnalytics(projectId: number, req: any): Promise<{
        velocityTrends: import("./velocity.service").VelocityTrends;
        velocityForecast: import("./velocity.service").VelocityForecast;
        teamComparison: import("./velocity.service").TeamVelocityComparison[];
        cycleTimeMetrics: import("./analytics.service").CycleTimeMetrics;
        throughputMetrics: import("./analytics.service").ThroughputMetrics;
        lastUpdated: string;
    }>;
    getProjectVelocity(projectId: number, req: any, sprintCount?: number): Promise<import("./velocity.service").VelocityData[]>;
    getVelocityTrends(projectId: number, req: any): Promise<import("./velocity.service").VelocityTrends>;
    getVelocityForecast(projectId: number, req: any, remainingStoryPoints?: number, targetDate?: string): Promise<import("./velocity.service").VelocityForecast>;
    getTeamVelocityComparison(projectId: number, req: any, sprintCount?: number): Promise<import("./velocity.service").TeamVelocityComparison[]>;
    getBurndownChart(sprintId: number, req: any): Promise<import("./analytics.service").BurndownData[]>;
    getCycleTimeMetrics(projectId: number, req: any, sprintCount?: number): Promise<import("./analytics.service").CycleTimeMetrics>;
    getThroughputMetrics(projectId: number, req: any, sprintCount?: number): Promise<import("./analytics.service").ThroughputMetrics>;
    getSprintScopeData(sprintId: number, req: any): Promise<{
        totalScope: number;
        completedWork: number;
        remainingWork: number;
        completionRate: number;
        completedIssuesCount: number;
        incompleteIssuesCount: number;
        totalIssuesCount: number;
    }>;
    getSprintHealthMetrics(sprintId: number, req: any): Promise<import("./analytics.service").SprintHealthMetrics>;
    getCumulativeFlowData(projectId: number, req: any, days?: number): Promise<{
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
            wipTrend: "increasing" | "decreasing" | "stable";
        };
    }>;
}
