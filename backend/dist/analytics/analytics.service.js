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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const issue_entity_1 = require("../issues/entities/issue.entity");
const sprint_entity_1 = require("../sprints/entities/sprint.entity");
const time_log_entity_1 = require("../issues/entities/time-log.entity");
const velocity_service_1 = require("./velocity.service");
let AnalyticsService = class AnalyticsService {
    constructor(issuesRepository, sprintsRepository, timeLogRepository, velocityService) {
        this.issuesRepository = issuesRepository;
        this.sprintsRepository = sprintsRepository;
        this.timeLogRepository = timeLogRepository;
        this.velocityService = velocityService;
    }
    async generateBurndownData(sprintId) {
        const sprint = await this.sprintsRepository.findOne({
            where: { id: sprintId },
            relations: ['issues'],
        });
        if (!sprint || !sprint.startDate || !sprint.endDate) {
            return [];
        }
        const startDate = new Date(sprint.startDate);
        const endDate = new Date(sprint.endDate);
        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        let allOriginalIssues = sprint.issues || [];
        if (sprint.status === 'completed') {
            const movedIssues = await this.issuesRepository
                .createQueryBuilder('issue')
                .where('issue.projectId = :projectId', { projectId: sprint.projectId })
                .andWhere('issue.sprintId IS NULL')
                .andWhere('issue.updatedAt BETWEEN :startTime AND :endTime', {
                startTime: new Date(sprint.updatedAt.getTime() - 300000),
                endTime: new Date(sprint.updatedAt.getTime() + 300000),
            })
                .getMany();
            allOriginalIssues = [...allOriginalIssues, ...movedIssues];
        }
        const originalTotalStoryPoints = this.calculateStoryPoints(allOriginalIssues);
        const currentSprintStoryPoints = this.calculateStoryPoints(sprint.issues || []);
        const scopeRemoved = originalTotalStoryPoints - currentSprintStoryPoints;
        const burndownData = [];
        for (let day = 0; day <= totalDays; day++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + day);
            const completedByDate = await this.getCompletedWorkByDate(sprintId, currentDate);
            const idealProgress = day / totalDays;
            const idealCompleted = originalTotalStoryPoints * idealProgress;
            const idealRemaining = originalTotalStoryPoints - idealCompleted;
            const scopeForDate = await this.getScopeForDate(sprintId, currentDate, sprint, allOriginalIssues);
            let actualRemaining;
            if (sprint.status === 'completed') {
                actualRemaining = Math.max(0, originalTotalStoryPoints - completedByDate);
            }
            else {
                actualRemaining = Math.max(0, scopeForDate - completedByDate);
            }
            burndownData.push({
                date: currentDate.toISOString().split('T')[0],
                remainingWork: actualRemaining,
                idealRemaining: Math.max(0, idealRemaining),
                actualCompleted: completedByDate,
                idealCompleted: idealCompleted,
            });
        }
        return burndownData;
    }
    async calculateCycleTimeMetrics(projectId, sprintCount = 6) {
        const sprints = await this.sprintsRepository
            .createQueryBuilder('sprint')
            .where('sprint.projectId = :projectId', { projectId })
            .andWhere('sprint.status = :status', { status: 'completed' })
            .orderBy('sprint.startDate', 'DESC')
            .limit(sprintCount)
            .getMany();
        if (sprints.length === 0) {
            return {
                averageCycleTime: 0,
                medianCycleTime: 0,
                cycleTimeByType: {},
                cycleTimeByPriority: {},
                cycleTimeTrend: [],
            };
        }
        const sprintIds = sprints.map(sprint => sprint.id);
        const completedIssues = await this.issuesRepository
            .createQueryBuilder('issue')
            .where('issue.sprintId IN (:...sprintIds)', { sprintIds })
            .andWhere('issue.status = :status', { status: 'done' })
            .getMany();
        const cycleTimes = [];
        const cycleTimesByType = {};
        const cycleTimesByPriority = {};
        completedIssues.forEach(issue => {
            const createdDate = new Date(issue.createdAt);
            const completedDate = new Date(issue.updatedAt);
            const cycleTimeDays = Math.ceil((completedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
            cycleTimes.push(cycleTimeDays);
            if (!cycleTimesByType[issue.type]) {
                cycleTimesByType[issue.type] = [];
            }
            cycleTimesByType[issue.type].push(cycleTimeDays);
            if (!cycleTimesByPriority[issue.priority]) {
                cycleTimesByPriority[issue.priority] = [];
            }
            cycleTimesByPriority[issue.priority].push(cycleTimeDays);
        });
        const averageCycleTime = cycleTimes.length > 0
            ? cycleTimes.reduce((sum, time) => sum + time, 0) / cycleTimes.length
            : 0;
        const medianCycleTime = this.calculateMedian(cycleTimes);
        const cycleTimeByType = {};
        Object.entries(cycleTimesByType).forEach(([type, times]) => {
            cycleTimeByType[type] = times.reduce((sum, time) => sum + time, 0) / times.length;
        });
        const cycleTimeByPriority = {};
        Object.entries(cycleTimesByPriority).forEach(([priority, times]) => {
            cycleTimeByPriority[priority] = times.reduce((sum, time) => sum + time, 0) / times.length;
        });
        const cycleTimeTrend = await this.generateCycleTimeTrend(projectId, sprintCount);
        return {
            averageCycleTime: Math.round(averageCycleTime * 100) / 100,
            medianCycleTime: Math.round(medianCycleTime * 100) / 100,
            cycleTimeByType,
            cycleTimeByPriority,
            cycleTimeTrend,
        };
    }
    async calculateThroughputMetrics(projectId, sprintCount = 6) {
        const velocityData = await this.velocityService.getProjectVelocity(projectId, sprintCount);
        if (velocityData.length === 0) {
            return {
                issuesPerSprint: 0,
                storyPointsPerSprint: 0,
                throughputTrend: [],
            };
        }
        const avgIssuesPerSprint = velocityData.reduce((sum, data) => sum + data.issuesCompleted, 0) / velocityData.length;
        const avgStoryPointsPerSprint = velocityData.reduce((sum, data) => sum + data.velocity, 0) / velocityData.length;
        const throughputTrend = velocityData.map(data => ({
            sprintName: data.sprintName,
            issuesCompleted: data.issuesCompleted,
            storyPointsCompleted: data.velocity,
        }));
        return {
            issuesPerSprint: Math.round(avgIssuesPerSprint * 100) / 100,
            storyPointsPerSprint: Math.round(avgStoryPointsPerSprint * 100) / 100,
            throughputTrend,
        };
    }
    async getSprintScopeData(sprintId) {
        const sprint = await this.sprintsRepository.findOne({
            where: { id: sprintId },
            relations: ['issues'],
        });
        if (!sprint) {
            return {
                totalScope: 0,
                completedWork: 0,
                remainingWork: 0,
                completionRate: 0,
                completedIssuesCount: 0,
                incompleteIssuesCount: 0,
                totalIssuesCount: 0
            };
        }
        let allSprintIssues = sprint.issues || [];
        if (sprint.status === 'completed') {
            const potentialMovedIssues = await this.issuesRepository
                .createQueryBuilder('issue')
                .where('issue.projectId = :projectId', { projectId: sprint.projectId })
                .andWhere('issue.sprintId IS NULL')
                .andWhere('issue.updatedAt BETWEEN :startTime AND :endTime', {
                startTime: new Date(sprint.updatedAt.getTime() - 300000),
                endTime: new Date(sprint.updatedAt.getTime() + 300000),
            })
                .getMany();
            allSprintIssues = [...allSprintIssues, ...potentialMovedIssues];
        }
        const totalScope = allSprintIssues.reduce((sum, issue) => {
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
        const completedIssues = allSprintIssues.filter(issue => issue.status === 'done');
        const incompleteIssues = allSprintIssues.filter(issue => issue.status !== 'done');
        const completedWork = completedIssues.reduce((sum, issue) => {
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
        const remainingWork = totalScope - completedWork;
        const completionRate = totalScope > 0 ? (completedWork / totalScope) * 100 : 0;
        return {
            totalScope,
            completedWork,
            remainingWork,
            completionRate: Math.round(completionRate * 10) / 10,
            completedIssuesCount: completedIssues.length,
            incompleteIssuesCount: incompleteIssues.length,
            totalIssuesCount: allSprintIssues.length
        };
    }
    async calculateSprintHealthMetrics(sprintId) {
        const sprint = await this.sprintsRepository.findOne({
            where: { id: sprintId },
            relations: ['issues'],
        });
        if (!sprint || !sprint.issues) {
            return {
                scopeCreepPercentage: 0,
                velocityVariance: 0,
                completionRate: 0,
                averageIssueAge: 0,
                blockedTimePercentage: 0,
                reworkRate: 0,
                qualityScore: 0,
            };
        }
        const issues = sprint.issues;
        const completedIssues = issues.filter(issue => issue.status === 'done');
        const completionRate = issues.length > 0 ? (completedIssues.length / issues.length) * 100 : 0;
        const issueAges = completedIssues.map(issue => {
            const created = new Date(issue.createdAt);
            const completed = new Date(issue.updatedAt);
            return Math.ceil((completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        });
        const averageIssueAge = issueAges.length > 0
            ? issueAges.reduce((sum, age) => sum + age, 0) / issueAges.length
            : 0;
        const qualityScore = completionRate * 0.6 + (issueAges.length > 0 ? Math.max(0, 100 - averageIssueAge * 2) : 50) * 0.4;
        return {
            scopeCreepPercentage: 0,
            velocityVariance: 0,
            completionRate: Math.round(completionRate * 100) / 100,
            averageIssueAge: Math.round(averageIssueAge * 100) / 100,
            blockedTimePercentage: 0,
            reworkRate: 0,
            qualityScore: Math.round(qualityScore * 100) / 100,
        };
    }
    async getDashboardAnalytics(projectId) {
        const [velocityTrends, velocityForecast, teamComparison, cycleTimeMetrics, throughputMetrics,] = await Promise.all([
            this.velocityService.getVelocityTrends(projectId),
            this.velocityService.generateVelocityForecast(projectId),
            this.velocityService.getTeamVelocityComparison(projectId),
            this.calculateCycleTimeMetrics(projectId),
            this.calculateThroughputMetrics(projectId),
        ]);
        return {
            velocityTrends,
            velocityForecast,
            teamComparison,
            cycleTimeMetrics,
            throughputMetrics,
            lastUpdated: new Date().toISOString(),
        };
    }
    async getCompletedWorkByDate(sprintId, date) {
        const sprint = await this.sprintsRepository.findOne({
            where: { id: sprintId },
            relations: ['issues'],
        });
        if (!sprint)
            return 0;
        let completedIssues = [];
        if (sprint.status === 'completed') {
            const currentSprintIssues = await this.issuesRepository
                .createQueryBuilder('issue')
                .where('issue.sprintId = :sprintId', { sprintId })
                .andWhere('issue.status = :status', { status: 'done' })
                .andWhere('issue.updatedAt <= :date', { date })
                .getMany();
            const movedBacklogIssues = await this.issuesRepository
                .createQueryBuilder('issue')
                .where('issue.projectId = :projectId', { projectId: sprint.projectId })
                .andWhere('issue.sprintId IS NULL')
                .andWhere('issue.status = :status', { status: 'done' })
                .andWhere('issue.updatedAt <= :date', { date })
                .andWhere('issue.updatedAt BETWEEN :startTime AND :endTime', {
                startTime: new Date(sprint.updatedAt.getTime() - 300000),
                endTime: new Date(sprint.updatedAt.getTime() + 300000),
            })
                .getMany();
            completedIssues = [...currentSprintIssues, ...movedBacklogIssues];
        }
        else {
            completedIssues = await this.issuesRepository
                .createQueryBuilder('issue')
                .where('issue.sprintId = :sprintId', { sprintId })
                .andWhere('issue.status = :status', { status: 'done' })
                .andWhere('issue.updatedAt <= :date', { date })
                .getMany();
        }
        return this.calculateStoryPoints(completedIssues);
    }
    calculateMedian(values) {
        if (values.length === 0)
            return 0;
        const sorted = [...values].sort((a, b) => a - b);
        const middle = Math.floor(sorted.length / 2);
        if (sorted.length % 2 === 0) {
            return (sorted[middle - 1] + sorted[middle]) / 2;
        }
        else {
            return sorted[middle];
        }
    }
    async generateCycleTimeTrend(projectId, sprintCount) {
        const velocityData = await this.velocityService.getProjectVelocity(projectId, sprintCount);
        return velocityData.map(data => ({
            period: data.sprintName,
            averageCycleTime: data.velocity > 0 ? Math.round((data.issuesCompleted / data.velocity) * 7) : 0,
        }));
    }
    async getScopeForDate(sprintId, date, sprint, originalIssues) {
        let scopeForDate = this.calculateStoryPoints(originalIssues);
        const movedOutIssues = await this.issuesRepository
            .createQueryBuilder('issue')
            .where('issue.projectId = :projectId', { projectId: sprint.projectId })
            .andWhere('issue.sprintId IS NULL')
            .andWhere('issue.updatedAt <= :date', { date })
            .andWhere('issue.updatedAt >= :sprintStart', { sprintStart: sprint.createdAt })
            .getMany();
        const relevantMovedIssues = movedOutIssues.filter(issue => originalIssues.some(original => original.id === issue.id));
        const scopeReduced = this.calculateStoryPoints(relevantMovedIssues);
        return scopeForDate - scopeReduced;
    }
    async generateCumulativeFlowData(projectId, days = 30) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);
        const chartData = [];
        const wipData = [];
        for (let day = 0; day <= days; day++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + day);
            currentDate.setHours(23, 59, 59, 999);
            const issuesCreated = await this.issuesRepository
                .createQueryBuilder('issue')
                .where('issue.projectId = :projectId', { projectId })
                .andWhere('issue.createdAt <= :date', { date: currentDate })
                .getCount();
            const issuesCompleted = await this.issuesRepository
                .createQueryBuilder('issue')
                .where('issue.projectId = :projectId', { projectId })
                .andWhere('issue.createdAt <= :date', { date: currentDate })
                .andWhere('issue.status = :status', { status: 'done' })
                .andWhere('issue.updatedAt <= :date', { date: currentDate })
                .getCount();
            const remainingWork = issuesCreated - issuesCompleted;
            const inProgressRatio = 0.15;
            const inProgressIssues = Math.round(remainingWork * inProgressRatio);
            const todoIssues = remainingWork - inProgressIssues;
            const doneIssues = issuesCompleted;
            const total = todoIssues + inProgressIssues + doneIssues;
            chartData.push({
                date: currentDate.toISOString().split('T')[0],
                todo: todoIssues,
                inProgress: inProgressIssues,
                done: doneIssues,
                total
            });
            wipData.push(inProgressIssues);
        }
        const currentWIP = chartData[chartData.length - 1]?.inProgress || 0;
        const recentCompletedIssues = await this.issuesRepository
            .createQueryBuilder('issue')
            .where('issue.projectId = :projectId', { projectId })
            .andWhere('issue.status = :status', { status: 'done' })
            .andWhere('issue.updatedAt >= :startDate', { startDate })
            .getMany();
        const cycleTimes = recentCompletedIssues.map(issue => {
            const created = new Date(issue.createdAt);
            const completed = new Date(issue.updatedAt);
            return Math.ceil((completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        });
        const avgCycleTime = cycleTimes.length > 0
            ? Math.round(cycleTimes.reduce((sum, time) => sum + time, 0) / cycleTimes.length)
            : 0;
        const weeksInPeriod = days / 7;
        const avgThroughput = weeksInPeriod > 0
            ? Math.round((recentCompletedIssues.length / weeksInPeriod) * 10) / 10
            : 0;
        const lastWeekData = chartData.slice(-7);
        const statusAccumulation = {
            todo: lastWeekData.reduce((sum, d) => sum + d.todo, 0) / lastWeekData.length,
            inProgress: lastWeekData.reduce((sum, d) => sum + d.inProgress, 0) / lastWeekData.length
        };
        let bottleneckStatus = null;
        if (statusAccumulation.inProgress > statusAccumulation.todo * 1.5) {
            bottleneckStatus = 'in_progress';
        }
        else if (statusAccumulation.todo > statusAccumulation.inProgress * 2) {
            bottleneckStatus = 'todo';
        }
        const firstHalfWIP = wipData.slice(0, Math.floor(wipData.length / 2));
        const secondHalfWIP = wipData.slice(Math.floor(wipData.length / 2));
        const firstAvg = firstHalfWIP.reduce((sum, wip) => sum + wip, 0) / firstHalfWIP.length;
        const secondAvg = secondHalfWIP.reduce((sum, wip) => sum + wip, 0) / secondHalfWIP.length;
        let wipTrend = 'stable';
        if (secondAvg > firstAvg * 1.2) {
            wipTrend = 'increasing';
        }
        else if (secondAvg < firstAvg * 0.8) {
            wipTrend = 'decreasing';
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
        };
    }
    calculateStoryPoints(issues) {
        return issues.reduce((sum, issue) => {
            const storyPoints = issue.storyPoints;
            if (typeof storyPoints === 'number') {
                return sum + storyPoints;
            }
            else if (typeof storyPoints === 'string' && !isNaN(Number(storyPoints))) {
                return sum + Number(storyPoints);
            }
            else {
                const storyPointMap = {
                    'XS': 1,
                    'S': 3,
                    'M': 5,
                    'L': 8,
                    'XL': 13,
                    'XXL': 21,
                    '?': 0
                };
                return sum + (storyPointMap[storyPoints] || 0);
            }
        }, 0);
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(issue_entity_1.Issue)),
    __param(1, (0, typeorm_1.InjectRepository)(sprint_entity_1.Sprint)),
    __param(2, (0, typeorm_1.InjectRepository)(time_log_entity_1.TimeLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        velocity_service_1.VelocityService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map