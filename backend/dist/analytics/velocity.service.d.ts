import { Repository } from 'typeorm';
import { Issue } from '../issues/entities/issue.entity';
import { Sprint } from '../sprints/entities/sprint.entity';
import { Project } from '../projects/entities/project.entity';
export interface VelocityData {
    sprintId: number;
    sprintName: string;
    startDate: Date;
    endDate: Date;
    plannedPoints: number;
    completedPoints: number;
    velocity: number;
    issuesCompleted: number;
    issuesPlanned: number;
    completionRate: number;
}
export interface VelocityTrends {
    average3Sprints: number;
    average6Sprints: number;
    average12Sprints: number;
    currentTrend: 'increasing' | 'decreasing' | 'stable';
    trendPercentage: number;
    standardDeviation: number;
    confidenceInterval: [number, number];
}
export interface VelocityForecast {
    projectedVelocity: number;
    confidenceLevel: number;
    estimatedReleaseDate?: Date;
    remainingSprintsForScope?: number;
    riskAssessment: 'low' | 'medium' | 'high';
    recommendations: string[];
}
export interface TeamVelocityComparison {
    teamMember: {
        id: number;
        name: string;
        email: string;
    };
    individualVelocity: number;
    contributionPercentage: number;
    tasksCompleted: number;
    averageTaskSize: number;
    consistencyScore: number;
}
export declare class VelocityService {
    private issuesRepository;
    private sprintsRepository;
    private projectsRepository;
    constructor(issuesRepository: Repository<Issue>, sprintsRepository: Repository<Sprint>, projectsRepository: Repository<Project>);
    getProjectVelocity(projectId: number, sprintCount?: number): Promise<VelocityData[]>;
    getVelocityTrends(projectId: number): Promise<VelocityTrends>;
    generateVelocityForecast(projectId: number, remainingStoryPoints?: number, targetDate?: Date): Promise<VelocityForecast>;
    getTeamVelocityComparison(projectId: number, sprintCount?: number): Promise<TeamVelocityComparison[]>;
    private calculateAverage;
    private calculateStandardDeviation;
    private calculateTrend;
    private calculateConfidenceLevel;
    private assessRisk;
    private generateRecommendations;
    private calculateAverageSprintDuration;
    private calculateConsistencyScore;
}
