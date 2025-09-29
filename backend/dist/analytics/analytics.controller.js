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
const analytics_service_1 = require("./analytics.service");
const velocity_service_1 = require("./velocity.service");
let AnalyticsController = class AnalyticsController {
    constructor(analyticsService, velocityService) {
        this.analyticsService = analyticsService;
        this.velocityService = velocityService;
    }
    async getDashboardAnalytics(projectId) {
        return this.analyticsService.getDashboardAnalytics(projectId);
    }
    async getProjectVelocity(projectId, sprintCount = 12) {
        return this.velocityService.getProjectVelocity(projectId, sprintCount);
    }
    async getVelocityTrends(projectId) {
        return this.velocityService.getVelocityTrends(projectId);
    }
    async getVelocityForecast(projectId, remainingStoryPoints, targetDate) {
        const targetDateObj = targetDate ? new Date(targetDate) : undefined;
        return this.velocityService.generateVelocityForecast(projectId, remainingStoryPoints, targetDateObj);
    }
    async getTeamVelocityComparison(projectId, sprintCount = 6) {
        return this.velocityService.getTeamVelocityComparison(projectId, sprintCount);
    }
    async getBurndownChart(sprintId) {
        return this.analyticsService.generateBurndownData(sprintId);
    }
    async getCycleTimeMetrics(projectId, sprintCount = 6) {
        return this.analyticsService.calculateCycleTimeMetrics(projectId, sprintCount);
    }
    async getThroughputMetrics(projectId, sprintCount = 6) {
        return this.analyticsService.calculateThroughputMetrics(projectId, sprintCount);
    }
    async getSprintScopeData(sprintId) {
        return this.analyticsService.getSprintScopeData(sprintId);
    }
    async getSprintHealthMetrics(sprintId) {
        return this.analyticsService.calculateSprintHealthMetrics(sprintId);
    }
    async getCumulativeFlowData(projectId, days = 30) {
        return this.analyticsService.generateCumulativeFlowData(projectId, days);
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Get)('dashboard/:projectId'),
    __param(0, (0, common_1.Param)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getDashboardAnalytics", null);
__decorate([
    (0, common_1.Get)('velocity/:projectId'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Query)('sprintCount')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getProjectVelocity", null);
__decorate([
    (0, common_1.Get)('velocity/:projectId/trends'),
    __param(0, (0, common_1.Param)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getVelocityTrends", null);
__decorate([
    (0, common_1.Get)('velocity/:projectId/forecast'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Query)('remainingStoryPoints')),
    __param(2, (0, common_1.Query)('targetDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getVelocityForecast", null);
__decorate([
    (0, common_1.Get)('velocity/:projectId/team-comparison'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Query)('sprintCount')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getTeamVelocityComparison", null);
__decorate([
    (0, common_1.Get)('burndown/:sprintId'),
    __param(0, (0, common_1.Param)('sprintId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getBurndownChart", null);
__decorate([
    (0, common_1.Get)('cycle-time/:projectId'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Query)('sprintCount')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getCycleTimeMetrics", null);
__decorate([
    (0, common_1.Get)('throughput/:projectId'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Query)('sprintCount')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getThroughputMetrics", null);
__decorate([
    (0, common_1.Get)('sprint-scope/:sprintId'),
    __param(0, (0, common_1.Param)('sprintId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getSprintScopeData", null);
__decorate([
    (0, common_1.Get)('sprint-health/:sprintId'),
    __param(0, (0, common_1.Param)('sprintId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getSprintHealthMetrics", null);
__decorate([
    (0, common_1.Get)('cumulative-flow/:projectId'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getCumulativeFlowData", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, common_1.Controller)('api/analytics'),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService,
        velocity_service_1.VelocityService])
], AnalyticsController);
//# sourceMappingURL=analytics.controller.js.map