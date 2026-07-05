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
exports.TimeTrackingController = void 0;
const common_1 = require("@nestjs/common");
const time_tracking_service_1 = require("./time-tracking.service");
const time_log_dto_1 = require("./dto/time-log.dto");
const workspace_scope_service_1 = require("../workspaces/workspace-scope.service");
let TimeTrackingController = class TimeTrackingController {
    constructor(timeTrackingService, workspaceScope) {
        this.timeTrackingService = timeTrackingService;
        this.workspaceScope = workspaceScope;
    }
    async logTime(createTimeLogDto, req) {
        await this.workspaceScope.assertIssue(createTimeLogDto.issueId, req.workspaceId);
        const userId = req.user?.id || 1;
        return this.timeTrackingService.logTime(createTimeLogDto, userId);
    }
    async getTimeLogsByIssue(issueId, req) {
        await this.workspaceScope.assertIssue(issueId, req.workspaceId);
        return this.timeTrackingService.getTimeLogsByIssue(issueId);
    }
    async getTimeTrackingSummary(issueId, req) {
        await this.workspaceScope.assertIssue(issueId, req.workspaceId);
        return this.timeTrackingService.getTimeTrackingSummary(issueId);
    }
    async findOne(id, req) {
        const timeLog = await this.timeTrackingService.findOne(id);
        await this.workspaceScope.assertIssue(timeLog.issueId, req.workspaceId);
        return timeLog;
    }
    async updateTimeLog(id, updateTimeLogDto, req) {
        const timeLog = await this.timeTrackingService.findOne(id);
        await this.workspaceScope.assertIssue(timeLog.issueId, req.workspaceId);
        const userId = req.user?.id || 1;
        return this.timeTrackingService.updateTimeLog(id, updateTimeLogDto, userId);
    }
    async deleteTimeLog(id, req) {
        const timeLog = await this.timeTrackingService.findOne(id);
        await this.workspaceScope.assertIssue(timeLog.issueId, req.workspaceId);
        const userId = req.user?.id || 1;
        return this.timeTrackingService.deleteTimeLog(id, userId);
    }
    parseTimeInput(body) {
        try {
            const hours = this.timeTrackingService.parseTimeInput(body.timeStr);
            return { hours, formatted: this.timeTrackingService.formatTime(hours) };
        }
        catch (error) {
            return { error: error.message };
        }
    }
};
exports.TimeTrackingController = TimeTrackingController;
__decorate([
    (0, common_1.Post)('log'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [time_log_dto_1.CreateTimeLogDto, Object]),
    __metadata("design:returntype", Promise)
], TimeTrackingController.prototype, "logTime", null);
__decorate([
    (0, common_1.Get)('issue/:issueId'),
    __param(0, (0, common_1.Param)('issueId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], TimeTrackingController.prototype, "getTimeLogsByIssue", null);
__decorate([
    (0, common_1.Get)('issue/:issueId/summary'),
    __param(0, (0, common_1.Param)('issueId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], TimeTrackingController.prototype, "getTimeTrackingSummary", null);
__decorate([
    (0, common_1.Get)('log/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], TimeTrackingController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)('log/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, time_log_dto_1.UpdateTimeLogDto, Object]),
    __metadata("design:returntype", Promise)
], TimeTrackingController.prototype, "updateTimeLog", null);
__decorate([
    (0, common_1.Delete)('log/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], TimeTrackingController.prototype, "deleteTimeLog", null);
__decorate([
    (0, common_1.Post)('parse-time'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TimeTrackingController.prototype, "parseTimeInput", null);
exports.TimeTrackingController = TimeTrackingController = __decorate([
    (0, common_1.Controller)('api/time-tracking'),
    __metadata("design:paramtypes", [time_tracking_service_1.TimeTrackingService,
        workspace_scope_service_1.WorkspaceScopeService])
], TimeTrackingController);
//# sourceMappingURL=time-tracking.controller.js.map