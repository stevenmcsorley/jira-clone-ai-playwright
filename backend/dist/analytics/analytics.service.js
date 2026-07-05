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
const issue_status_enum_1 = require("../issues/enums/issue-status.enum");
const sprint_entity_1 = require("../sprints/entities/sprint.entity");
const time_log_entity_1 = require("../issues/entities/time-log.entity");
const issue_event_entity_1 = require("../notifications/entities/issue-event.entity");
const velocity_service_1 = require("./velocity.service");
let AnalyticsService = class AnalyticsService {
    constructor(issuesRepository, sprintsRepository, timeLogRepository, issueEventsRepository, velocityService) {
        this.issuesRepository = issuesRepository;
        this.sprintsRepository = sprintsRepository;
        this.timeLogRepository = timeLogRepository;
        this.issueEventsRepository = issueEventsRepository;
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
    async getCycleTimeReport(projectId, days = 180) {
        const since = new Date();
        since.setDate(since.getDate() - days);
        const doneIssues = await this.issuesRepository
            .createQueryBuilder('issue')
            .where('issue.projectId = :projectId', { projectId })
            .andWhere('issue.status = :status', { status: issue_status_enum_1.IssueStatus.DONE })
            .orderBy('issue.updatedAt', 'ASC')
            .getMany();
        const eventsByIssue = await this.getStatusEventsByIssue(doneIssues.map(i => i.id));
        const datapoints = [];
        for (const issue of doneIssues) {
            const window = this.resolveCycleWindow(issue, eventsByIssue.get(issue.id) || []);
            if (!window)
                continue;
            if (window.completedAt < since)
                continue;
            const elapsedDays = (window.completedAt.getTime() - window.startedAt.getTime()) / (1000 * 60 * 60 * 24);
            datapoints.push({
                issueId: issue.id,
                title: issue.title,
                type: issue.type,
                priority: issue.priority,
                completedAt: window.completedAt.toISOString(),
                cycleTimeDays: Math.round(Math.max(elapsedDays, 0) * 100) / 100,
                source: window.source,
            });
        }
        datapoints.sort((a, b) => a.completedAt.localeCompare(b.completedAt));
        const times = datapoints.map(d => d.cycleTimeDays);
        const averageDays = times.length > 0 ? times.reduce((sum, t) => sum + t, 0) / times.length : 0;
        const byMonth = new Map();
        for (const d of datapoints) {
            const period = d.completedAt.slice(0, 7);
            const bucket = byMonth.get(period) || [];
            bucket.push(d.cycleTimeDays);
            byMonth.set(period, bucket);
        }
        const trend = [...byMonth.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([period, values]) => ({
            period,
            averageDays: Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 100) / 100,
            count: values.length,
        }));
        return {
            datapoints,
            stats: {
                count: datapoints.length,
                averageDays: Math.round(averageDays * 100) / 100,
                medianDays: Math.round(this.calculateMedian(times) * 100) / 100,
                p85Days: Math.round(this.calculatePercentile(times, 85) * 100) / 100,
            },
            trend,
        };
    }
    async getStatusEventsByIssue(issueIds) {
        const map = new Map();
        if (issueIds.length === 0)
            return map;
        const events = await this.issueEventsRepository.find({
            where: { issueId: (0, typeorm_2.In)(issueIds), field: 'status' },
            order: { createdAt: 'ASC', id: 'ASC' },
        });
        for (const event of events) {
            const bucket = map.get(event.issueId) || [];
            bucket.push(event);
            map.set(event.issueId, bucket);
        }
        return map;
    }
    resolveCycleWindow(issue, statusEvents) {
        const doneEvents = statusEvents.filter(e => e.newValue === issue_status_enum_1.IssueStatus.DONE);
        if (doneEvents.length > 0) {
            const completedAt = new Date(doneEvents[doneEvents.length - 1].createdAt);
            const startEvent = statusEvents.find(e => e.newValue === issue_status_enum_1.IssueStatus.IN_PROGRESS || e.newValue === issue_status_enum_1.IssueStatus.CODE_REVIEW);
            const startedAt = startEvent ? new Date(startEvent.createdAt) : new Date(issue.createdAt);
            return { startedAt, completedAt, source: 'events' };
        }
        if (issue.status !== issue_status_enum_1.IssueStatus.DONE)
            return null;
        return {
            startedAt: new Date(issue.createdAt),
            completedAt: new Date(issue.updatedAt),
            source: 'timestamps',
        };
    }
    calculatePercentile(values, percentile) {
        if (values.length === 0)
            return 0;
        const sorted = [...values].sort((a, b) => a - b);
        const index = Math.min(sorted.length - 1, Math.ceil((percentile / 100) * sorted.length) - 1);
        return sorted[Math.max(0, index)];
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
        const issues = await this.issuesRepository
            .createQueryBuilder('issue')
            .where('issue.projectId = :projectId', { projectId })
            .getMany();
        const eventsByIssue = await this.getStatusEventsByIssue(issues.map(i => i.id));
        const chartData = [];
        const wipData = [];
        for (let day = 0; day <= days; day++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + day);
            currentDate.setHours(23, 59, 59, 999);
            const counts = {
                [issue_status_enum_1.IssueStatus.TODO]: 0,
                [issue_status_enum_1.IssueStatus.IN_PROGRESS]: 0,
                [issue_status_enum_1.IssueStatus.CODE_REVIEW]: 0,
                [issue_status_enum_1.IssueStatus.DONE]: 0,
            };
            for (const issue of issues) {
                const status = this.statusAtDate(issue, eventsByIssue.get(issue.id) || [], currentDate);
                if (status)
                    counts[status]++;
            }
            const total = counts[issue_status_enum_1.IssueStatus.TODO] +
                counts[issue_status_enum_1.IssueStatus.IN_PROGRESS] +
                counts[issue_status_enum_1.IssueStatus.CODE_REVIEW] +
                counts[issue_status_enum_1.IssueStatus.DONE];
            chartData.push({
                date: currentDate.toISOString().split('T')[0],
                todo: counts[issue_status_enum_1.IssueStatus.TODO],
                inProgress: counts[issue_status_enum_1.IssueStatus.IN_PROGRESS],
                codeReview: counts[issue_status_enum_1.IssueStatus.CODE_REVIEW],
                done: counts[issue_status_enum_1.IssueStatus.DONE],
                total,
            });
            wipData.push(counts[issue_status_enum_1.IssueStatus.IN_PROGRESS] + counts[issue_status_enum_1.IssueStatus.CODE_REVIEW]);
        }
        const lastDay = chartData[chartData.length - 1];
        const currentWIP = lastDay ? lastDay.inProgress + lastDay.codeReview : 0;
        const cycleTimes = [];
        let completedInPeriod = 0;
        for (const issue of issues) {
            const window = this.resolveCycleWindow(issue, eventsByIssue.get(issue.id) || []);
            if (!window || window.completedAt < startDate)
                continue;
            completedInPeriod++;
            cycleTimes.push((window.completedAt.getTime() - window.startedAt.getTime()) / (1000 * 60 * 60 * 24));
        }
        const avgCycleTime = cycleTimes.length > 0
            ? Math.round((cycleTimes.reduce((sum, time) => sum + time, 0) / cycleTimes.length) * 10) / 10
            : 0;
        const weeksInPeriod = days / 7;
        const avgThroughput = weeksInPeriod > 0
            ? Math.round((completedInPeriod / weeksInPeriod) * 10) / 10
            : 0;
        const lastWeekData = chartData.slice(-7);
        const statusAccumulation = {
            todo: lastWeekData.reduce((sum, d) => sum + d.todo, 0) / Math.max(lastWeekData.length, 1),
            inProgress: lastWeekData.reduce((sum, d) => sum + d.inProgress, 0) / Math.max(lastWeekData.length, 1),
            codeReview: lastWeekData.reduce((sum, d) => sum + d.codeReview, 0) / Math.max(lastWeekData.length, 1),
        };
        let bottleneckStatus = null;
        if (statusAccumulation.codeReview > Math.max(statusAccumulation.inProgress, 1) * 1.5) {
            bottleneckStatus = 'code_review';
        }
        else if (statusAccumulation.inProgress > Math.max(statusAccumulation.todo, 1) * 1.5) {
            bottleneckStatus = 'in_progress';
        }
        else if (statusAccumulation.todo > Math.max(statusAccumulation.inProgress + statusAccumulation.codeReview, 1) * 2) {
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
    statusAtDate(issue, statusEvents, date) {
        if (new Date(issue.createdAt) > date)
            return null;
        const validStatuses = new Set(Object.values(issue_status_enum_1.IssueStatus));
        const toStatus = (value) => value && validStatuses.has(value) ? value : issue_status_enum_1.IssueStatus.TODO;
        if (statusEvents.length > 0) {
            let lastBefore = null;
            for (const event of statusEvents) {
                if (new Date(event.createdAt) <= date)
                    lastBefore = event;
                else
                    break;
            }
            if (lastBefore)
                return toStatus(lastBefore.newValue);
            return toStatus(statusEvents[0].oldValue);
        }
        if (issue.status === issue_status_enum_1.IssueStatus.DONE) {
            return new Date(issue.updatedAt) <= date ? issue_status_enum_1.IssueStatus.DONE : issue_status_enum_1.IssueStatus.TODO;
        }
        return issue.status;
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
    __param(3, (0, typeorm_1.InjectRepository)(issue_event_entity_1.IssueEvent)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        velocity_service_1.VelocityService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map