"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VelocityService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const issue_entity_1 = require("../issues/entities/issue.entity");
const sprint_entity_1 = require("../sprints/entities/sprint.entity");
const project_entity_1 = require("../projects/entities/project.entity");
let VelocityService = class VelocityService {
    constructor(issuesRepository, sprintsRepository, projectsRepository) {
        this.issuesRepository = issuesRepository;
        this.sprintsRepository = sprintsRepository;
        this.projectsRepository = projectsRepository;
    }
    async getProjectVelocity(projectId, sprintCount = 12) {
        const sprints = await this.sprintsRepository
            .createQueryBuilder('sprint')
            .leftJoinAndSelect('sprint.issues', 'issue')
            .where('sprint.projectId = :projectId', { projectId })
            .andWhere('sprint.status IN (:...statuses)', { statuses: ['completed', 'active'] })
            .orderBy('sprint.startDate', 'DESC')
            .limit(sprintCount)
            .getMany();
        const velocityData = [];
        for (const sprint of sprints) {
            const sprintIssues = sprint.issues || [];
            const plannedPoints = sprintIssues.reduce((sum, issue) => {
                const storyPoints = issue.storyPoints;
                if (typeof storyPoints === 'number') {
                    return sum + storyPoints;
                }
                else if (typeof storyPoints === 'string' && !isNaN(Number(storyPoints))) {
                    return sum + Number(storyPoints);
                }
                else {
                    const storyPointMap = {
                        'XS': 1, 'S': 3, 'M': 5, 'L': 8, 'XL': 13, 'XXL': 21, '?': 0
                    };
                    return sum + (storyPointMap[storyPoints] || 0);
                }
            }, 0);
            const completedIssues = sprintIssues.filter(issue => issue.status === 'done');
            const completedPoints = completedIssues.reduce((sum, issue) => {
                const storyPoints = issue.storyPoints;
                if (typeof storyPoints === 'number') {
                    return sum + storyPoints;
                }
                else if (typeof storyPoints === 'string' && !isNaN(Number(storyPoints))) {
                    return sum + Number(storyPoints);
                }
                else {
                    const storyPointMap = {
                        'XS': 1, 'S': 3, 'M': 5, 'L': 8, 'XL': 13, 'XXL': 21, '?': 0
                    };
                    return sum + (storyPointMap[storyPoints] || 0);
                }
            }, 0);
            const completionRate = sprintIssues.length > 0
                ? (completedIssues.length / sprintIssues.length) * 100
                : 0;
            velocityData.push({
                sprintId: sprint.id,
                sprintName: sprint.name,
                startDate: sprint.startDate,
                endDate: sprint.endDate,
                plannedPoints,
                completedPoints,
                velocity: completedPoints,
                issuesCompleted: completedIssues.length,
                issuesPlanned: sprintIssues.length,
                completionRate: Math.round(completionRate * 100) / 100,
            });
        }
        return velocityData.reverse();
    }
    async getVelocityTrends(projectId) {
        const velocityData = await this.getProjectVelocity(projectId, 12);
        if (velocityData.length === 0) {
            return {
                average3Sprints: 0,
                average6Sprints: 0,
                average12Sprints: 0,
                currentTrend: 'stable',
                trendPercentage: 0,
                standardDeviation: 0,
                confidenceInterval: [0, 0],
            };
        }
        const velocities = velocityData.map(data => data.velocity);
        const average3Sprints = this.calculateAverage(velocities.slice(-3));
        const average6Sprints = this.calculateAverage(velocities.slice(-6));
        const average12Sprints = this.calculateAverage(velocities);
        const { trend, percentage } = this.calculateTrend(velocities);
        const standardDeviation = this.calculateStandardDeviation(velocities);
        const mean = average12Sprints;
        const margin = 1.96 * (standardDeviation / Math.sqrt(velocities.length));
        const confidenceInterval = [
            Math.max(0, mean - margin),
            mean + margin
        ];
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
        };
    }
    async generateVelocityForecast(projectId, remainingStoryPoints, targetDate) {
        const trends = await this.getVelocityTrends(projectId);
        const velocityData = await this.getProjectVelocity(projectId, 6);
        if (velocityData.length === 0) {
            return {
                projectedVelocity: 0,
                confidenceLevel: 0,
                riskAssessment: 'high',
                recommendations: ['Insufficient historical data for forecasting'],
            };
        }
        const projectedVelocity = trends.average3Sprints;
        const confidenceLevel = this.calculateConfidenceLevel(velocityData);
        const riskAssessment = this.assessRisk(trends, confidenceLevel);
        const recommendations = this.generateRecommendations(trends, velocityData, riskAssessment);
        const forecast = {
            projectedVelocity: Math.round(projectedVelocity * 100) / 100,
            confidenceLevel: Math.round(confidenceLevel * 100) / 100,
            riskAssessment,
            recommendations,
        };
        if (remainingStoryPoints && projectedVelocity > 0) {
            const sprintsNeeded = Math.ceil(remainingStoryPoints / projectedVelocity);
            forecast.remainingSprintsForScope = sprintsNeeded;
            if (velocityData.length > 0) {
                const averageSprintDuration = this.calculateAverageSprintDuration(velocityData);
                const estimatedReleaseDate = new Date();
                estimatedReleaseDate.setDate(estimatedReleaseDate.getDate() + (sprintsNeeded * averageSprintDuration));
                forecast.estimatedReleaseDate = estimatedReleaseDate;
            }
        }
        return forecast;
    }
    async getTeamVelocityComparison(projectId, sprintCount = 6) {
        const sprints = await this.sprintsRepository
            .createQueryBuilder('sprint')
            .where('sprint.projectId = :projectId', { projectId })
            .andWhere('sprint.status = :status', { status: 'completed' })
            .orderBy('sprint.startDate', 'DESC')
            .limit(sprintCount)
            .getMany();
        if (sprints.length === 0) {
            return [];
        }
        const sprintIds = sprints.map(sprint => sprint.id);
        const completedIssues = await this.issuesRepository
            .createQueryBuilder('issue')
            .leftJoinAndSelect('issue.assignee', 'assignee')
            .where('issue.sprintId IN (:...sprintIds)', { sprintIds })
            .andWhere('issue.status = :status', { status: 'done' })
            .andWhere('issue.assigneeId IS NOT NULL')
            .getMany();
        const teamStats = new Map();
        completedIssues.forEach(issue => {
            const assigneeId = issue.assigneeId;
            const storyPoints = issue.storyPoints;
            let points = 0;
            if (typeof storyPoints === 'number') {
                points = storyPoints;
            }
            else if (typeof storyPoints === 'string' && !isNaN(Number(storyPoints))) {
                points = Number(storyPoints);
            }
            else if (typeof storyPoints === 'string') {
                const storyPointMap = {
                    'XS': 1, 'S': 3, 'M': 5, 'L': 8, 'XL': 13, 'XXL': 21, '?': 0
                };
                points = storyPointMap[storyPoints] || 0;
            }
            if (!teamStats.has(assigneeId)) {
                teamStats.set(assigneeId, {
                    user: issue.assignee,
                    totalPoints: 0,
                    tasksCompleted: 0,
                    taskSizes: [],
                });
            }
            const stats = teamStats.get(assigneeId);
            stats.totalPoints += points;
            stats.tasksCompleted += 1;
            if (points > 0)
                stats.taskSizes.push(points);
        });
        const totalPoints = Array.from(teamStats.values()).reduce((sum, stats) => sum + stats.totalPoints, 0);
        const comparisons = Array.from(teamStats.entries()).map(([userId, stats]) => {
            const averageTaskSize = stats.taskSizes.length > 0
                ? stats.taskSizes.reduce((sum, size) => sum + size, 0) / stats.taskSizes.length
                : 0;
            const consistencyScore = stats.taskSizes.length > 1
                ? this.calculateConsistencyScore(stats.taskSizes)
                : 0;
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
            };
        });
        return comparisons.sort((a, b) => b.individualVelocity - a.individualVelocity);
    }
    calculateAverage(values) {
        if (values.length === 0)
            return 0;
        return values.reduce((sum, value) => sum + value, 0) / values.length;
    }
    calculateStandardDeviation(values) {
        if (values.length === 0)
            return 0;
        const mean = this.calculateAverage(values);
        const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
        return Math.sqrt(this.calculateAverage(squaredDifferences));
    }
    calculateTrend(velocities) {
        if (velocities.length < 2) {
            return { trend: 'stable', percentage: 0 };
        }
        const recentVelocities = velocities.slice(-3);
        const earlierVelocities = velocities.slice(-6, -3);
        if (earlierVelocities.length === 0) {
            return { trend: 'stable', percentage: 0 };
        }
        const recentAverage = this.calculateAverage(recentVelocities);
        const earlierAverage = this.calculateAverage(earlierVelocities);
        if (earlierAverage === 0) {
            return { trend: 'stable', percentage: 0 };
        }
        const percentageChange = ((recentAverage - earlierAverage) / earlierAverage) * 100;
        if (Math.abs(percentageChange) < 5) {
            return { trend: 'stable', percentage: 0 };
        }
        return {
            trend: percentageChange > 0 ? 'increasing' : 'decreasing',
            percentage: Math.abs(percentageChange),
        };
    }
    calculateConfidenceLevel(velocityData) {
        if (velocityData.length === 0)
            return 0;
        const completionRates = velocityData.map(data => data.completionRate);
        const velocities = velocityData.map(data => data.velocity);
        const avgCompletionRate = this.calculateAverage(completionRates);
        const completionRateStability = 100 - this.calculateStandardDeviation(completionRates);
        const velocityStability = velocities.length > 1
            ? 100 - (this.calculateStandardDeviation(velocities) / this.calculateAverage(velocities)) * 100
            : 50;
        const confidence = (avgCompletionRate * 0.4) + (completionRateStability * 0.3) + (velocityStability * 0.3);
        return Math.max(0, Math.min(100, confidence));
    }
    assessRisk(trends, confidenceLevel) {
        if (confidenceLevel > 80 && trends.currentTrend !== 'decreasing') {
            return 'low';
        }
        else if (confidenceLevel > 60 && trends.trendPercentage < 20) {
            return 'medium';
        }
        else {
            return 'high';
        }
    }
    generateRecommendations(trends, velocityData, riskAssessment) {
        const recommendations = [];
        if (riskAssessment === 'high') {
            recommendations.push('Consider reviewing sprint planning process due to high variance in velocity');
        }
        if (trends.currentTrend === 'decreasing') {
            recommendations.push('Velocity is declining - investigate potential blockers or team capacity issues');
        }
        if (trends.average3Sprints < trends.average12Sprints * 0.8) {
            recommendations.push('Recent velocity is significantly below historical average - review team workload');
        }
        const avgCompletionRate = this.calculateAverage(velocityData.map(d => d.completionRate));
        if (avgCompletionRate < 70) {
            recommendations.push('Low completion rate detected - consider reducing sprint scope or improving estimation');
        }
        if (trends.standardDeviation > trends.average12Sprints * 0.4) {
            recommendations.push('High velocity variance - focus on consistent sprint planning and estimation accuracy');
        }
        if (recommendations.length === 0) {
            recommendations.push('Velocity trends look healthy - maintain current sprint planning practices');
        }
        return recommendations;
    }
    calculateAverageSprintDuration(velocityData) {
        if (velocityData.length === 0)
            return 14;
        const durations = velocityData
            .filter(data => data.startDate && data.endDate)
            .map(data => {
            const start = new Date(data.startDate);
            const end = new Date(data.endDate);
            return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        });
        return durations.length > 0 ? this.calculateAverage(durations) : 14;
    }
    calculateConsistencyScore(taskSizes) {
        if (taskSizes.length < 2)
            return 100;
        const mean = this.calculateAverage(taskSizes);
        const standardDeviation = this.calculateStandardDeviation(taskSizes);
        const coefficientOfVariation = mean > 0 ? (standardDeviation / mean) : 0;
        return Math.max(0, 100 - (coefficientOfVariation * 50));
    }
};
exports.VelocityService = VelocityService;
exports.VelocityService = VelocityService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(issue_entity_1.Issue)),
    __param(1, (0, typeorm_1.InjectRepository)(sprint_entity_1.Sprint)),
    __param(2, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], VelocityService);
//# sourceMappingURL=velocity.service.js.map