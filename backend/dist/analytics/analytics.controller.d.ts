import { AnalyticsService } from './analytics.service';
import { VelocityService } from './velocity.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    private readonly velocityService;
    constructor(analyticsService: AnalyticsService, velocityService: VelocityService);
    getDashboardAnalytics(projectId: number): Promise<{
        velocityTrends: import("./velocity.service").VelocityTrends;
        velocityForecast: import("./velocity.service").VelocityForecast;
        teamComparison: import("./velocity.service").TeamVelocityComparison[];
        cycleTimeMetrics: import("./analytics.service").CycleTimeMetrics;
        throughputMetrics: import("./analytics.service").ThroughputMetrics;
        lastUpdated: string;
    }>;
    getProjectVelocity(projectId: number, sprintCount?: number): Promise<import("./velocity.service").VelocityData[]>;
    getVelocityTrends(projectId: number): Promise<import("./velocity.service").VelocityTrends>;
    getVelocityForecast(projectId: number, remainingStoryPoints?: number, targetDate?: string): Promise<import("./velocity.service").VelocityForecast>;
    getTeamVelocityComparison(projectId: number, sprintCount?: number): Promise<import("./velocity.service").TeamVelocityComparison[]>;
    getBurndownChart(sprintId: number): Promise<import("./analytics.service").BurndownData[]>;
    getCycleTimeMetrics(projectId: number, sprintCount?: number): Promise<import("./analytics.service").CycleTimeMetrics>;
    getThroughputMetrics(projectId: number, sprintCount?: number): Promise<import("./analytics.service").ThroughputMetrics>;
    getSprintScopeData(sprintId: number): Promise<{
        totalScope: number;
        completedWork: number;
        remainingWork: number;
        completionRate: number;
    }>;
    getSprintHealthMetrics(sprintId: number): Promise<import("./analytics.service").SprintHealthMetrics>;
    getCumulativeFlowData(projectId: number, days?: number): Promise<{
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
