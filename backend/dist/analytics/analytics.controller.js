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
exports.AnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const analytics_service_1 = require("./analytics.service");
const velocity_service_1 = require("./velocity.service");
const sprint_entity_1 = require("../sprints/entities/sprint.entity");
const workspace_scope_service_1 = require("../workspaces/workspace-scope.service");
let AnalyticsController = class AnalyticsController {
    constructor(analyticsService, velocityService, workspaceScope, sprintsRepository) {
        this.analyticsService = analyticsService;
        this.velocityService = velocityService;
        this.workspaceScope = workspaceScope;
        this.sprintsRepository = sprintsRepository;
    }
    async assertSprint(sprintId, workspaceId) {
        const sprint = await this.sprintsRepository.findOne({
            where: { id: sprintId },
            select: ['id', 'projectId'],
        });
        if (!sprint)
            throw new common_1.NotFoundException('Sprint not found');
        await this.workspaceScope.assertProject(sprint.projectId, workspaceId);
    }
    async getDashboardAnalytics(projectId, req) {
        await this.workspaceScope.assertProject(+projectId, req.workspaceId);
        return this.analyticsService.getDashboardAnalytics(projectId);
    }
    async getProjectVelocity(projectId, req, sprintCount = 12) {
        await this.workspaceScope.assertProject(+projectId, req.workspaceId);
        return this.velocityService.getProjectVelocity(projectId, sprintCount);
    }
    async getVelocityTrends(projectId, req) {
        await this.workspaceScope.assertProject(+projectId, req.workspaceId);
        return this.velocityService.getVelocityTrends(projectId);
    }
    async getVelocityForecast(projectId, req, remainingStoryPoints, targetDate) {
        await this.workspaceScope.assertProject(+projectId, req.workspaceId);
        const targetDateObj = targetDate ? new Date(targetDate) : undefined;
        return this.velocityService.generateVelocityForecast(projectId, remainingStoryPoints, targetDateObj);
    }
    async getTeamVelocityComparison(projectId, req, sprintCount = 6) {
        await this.workspaceScope.assertProject(+projectId, req.workspaceId);
        return this.velocityService.getTeamVelocityComparison(projectId, sprintCount);
    }
    async getBurndownChart(sprintId, req) {
        await this.assertSprint(+sprintId, req.workspaceId);
        return this.analyticsService.generateBurndownData(sprintId);
    }
    async getCycleTimeMetrics(projectId, req, days = 180) {
        await this.workspaceScope.assertProject(+projectId, req.workspaceId);
        return this.analyticsService.getCycleTimeReport(+projectId, +days || 180);
    }
    async getThroughputMetrics(projectId, req, sprintCount = 6) {
        await this.workspaceScope.assertProject(+projectId, req.workspaceId);
        return this.analyticsService.calculateThroughputMetrics(projectId, sprintCount);
    }
    async getSprintScopeData(sprintId, req) {
        await this.assertSprint(+sprintId, req.workspaceId);
        return this.analyticsService.getSprintScopeData(sprintId);
    }
    async getSprintHealthMetrics(sprintId, req) {
        await this.assertSprint(+sprintId, req.workspaceId);
        return this.analyticsService.calculateSprintHealthMetrics(sprintId);
    }
    async getCumulativeFlowData(projectId, req, days = 30) {
        await this.workspaceScope.assertProject(+projectId, req.workspaceId);
        return this.analyticsService.generateCumulativeFlowData(projectId, days);
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Get)('dashboard/:projectId'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getDashboardAnalytics", null);
__decorate([
    (0, common_1.Get)('velocity/:projectId'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Query)('sprintCount')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Number]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getProjectVelocity", null);
__decorate([
    (0, common_1.Get)('velocity/:projectId/trends'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getVelocityTrends", null);
__decorate([
    (0, common_1.Get)('velocity/:projectId/forecast'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Query)('remainingStoryPoints')),
    __param(3, (0, common_1.Query)('targetDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Number, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getVelocityForecast", null);
__decorate([
    (0, common_1.Get)('velocity/:projectId/team-comparison'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Query)('sprintCount')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Number]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getTeamVelocityComparison", null);
__decorate([
    (0, common_1.Get)('burndown/:sprintId'),
    __param(0, (0, common_1.Param)('sprintId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getBurndownChart", null);
__decorate([
    (0, common_1.Get)('cycle-time/:projectId'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Number]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getCycleTimeMetrics", null);
__decorate([
    (0, common_1.Get)('throughput/:projectId'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Query)('sprintCount')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Number]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getThroughputMetrics", null);
__decorate([
    (0, common_1.Get)('sprint-scope/:sprintId'),
    __param(0, (0, common_1.Param)('sprintId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getSprintScopeData", null);
__decorate([
    (0, common_1.Get)('sprint-health/:sprintId'),
    __param(0, (0, common_1.Param)('sprintId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getSprintHealthMetrics", null);
__decorate([
    (0, common_1.Get)('cumulative-flow/:projectId'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Number]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getCumulativeFlowData", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, common_1.Controller)('api/analytics'),
    __param(3, (0, typeorm_1.InjectRepository)(sprint_entity_1.Sprint)),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService,
        velocity_service_1.VelocityService,
        workspace_scope_service_1.WorkspaceScopeService,
        typeorm_2.Repository])
], AnalyticsController);
//# sourceMappingURL=analytics.controller.js.map