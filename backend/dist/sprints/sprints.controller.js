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
exports.SprintsController = void 0;
const common_1 = require("@nestjs/common");
const sprints_service_1 = require("./sprints.service");
const events_gateway_1 = require("../events/events.gateway");
const workspace_scope_service_1 = require("../workspaces/workspace-scope.service");
let SprintsController = class SprintsController {
    constructor(sprintsService, eventsGateway, workspaceScope) {
        this.sprintsService = sprintsService;
        this.eventsGateway = eventsGateway;
        this.workspaceScope = workspaceScope;
    }
    async assertSprint(id, workspaceId) {
        const sprint = await this.sprintsService.findOne(id);
        await this.workspaceScope.assertProject(sprint.projectId, workspaceId);
        return sprint;
    }
    async create(createSprintDto, req) {
        await this.workspaceScope.assertProject(createSprintDto.projectId, req.workspaceId);
        const sprint = await this.sprintsService.create(createSprintDto);
        this.eventsGateway.emitSprintCreated(sprint);
        return sprint;
    }
    async findByProject(projectId, req) {
        await this.workspaceScope.assertProject(+projectId, req.workspaceId);
        return this.sprintsService.findByProject(+projectId);
    }
    async getBacklog(projectId, req) {
        await this.workspaceScope.assertProject(+projectId, req.workspaceId);
        return this.sprintsService.getBacklogIssues(+projectId);
    }
    async findOne(id, req) {
        return this.assertSprint(+id, req.workspaceId);
    }
    async update(id, updateSprintDto, req) {
        await this.assertSprint(+id, req.workspaceId);
        const sprint = await this.sprintsService.update(+id, updateSprintDto);
        this.eventsGateway.emitSprintUpdated(sprint);
        return sprint;
    }
    async startSprint(id, startSprintDto, req) {
        await this.assertSprint(+id, req.workspaceId);
        const sprint = await this.sprintsService.startSprint(+id, startSprintDto.startDate, startSprintDto.endDate);
        this.eventsGateway.emitSprintStarted(sprint);
        return sprint;
    }
    async completeSprint(id, req) {
        await this.assertSprint(+id, req.workspaceId);
        const sprint = await this.sprintsService.completeSprint(+id);
        this.eventsGateway.emitSprintCompleted(sprint);
        return sprint;
    }
    async addIssueToSprint(id, issueId, req) {
        await this.assertSprint(+id, req.workspaceId);
        await this.workspaceScope.assertIssue(+issueId, req.workspaceId);
        await this.sprintsService.addIssueToSprint(+id, +issueId);
        const sprint = await this.sprintsService.findOne(+id);
        this.eventsGateway.emitSprintUpdated(sprint);
    }
    async removeIssueFromSprint(issueId, req) {
        await this.workspaceScope.assertIssue(+issueId, req.workspaceId);
        await this.sprintsService.removeIssueFromSprint(+issueId);
        this.eventsGateway.emitIssueUpdated({ id: +issueId });
    }
    async remove(id, req) {
        const sprint = await this.assertSprint(+id, req.workspaceId);
        await this.sprintsService.remove(+id);
        this.eventsGateway.emitSprintDeleted(+id, sprint.projectId);
        return { message: 'Sprint deleted successfully' };
    }
};
exports.SprintsController = SprintsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SprintsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('projectId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SprintsController.prototype, "findByProject", null);
__decorate([
    (0, common_1.Get)('backlog'),
    __param(0, (0, common_1.Query)('projectId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SprintsController.prototype, "getBacklog", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SprintsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SprintsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/start'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SprintsController.prototype, "startSprint", null);
__decorate([
    (0, common_1.Post)(':id/complete'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SprintsController.prototype, "completeSprint", null);
__decorate([
    (0, common_1.Post)(':id/add-issue/:issueId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('issueId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], SprintsController.prototype, "addIssueToSprint", null);
__decorate([
    (0, common_1.Post)('remove-issue/:issueId'),
    __param(0, (0, common_1.Param)('issueId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SprintsController.prototype, "removeIssueFromSprint", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SprintsController.prototype, "remove", null);
exports.SprintsController = SprintsController = __decorate([
    (0, common_1.Controller)('api/sprints'),
    __metadata("design:paramtypes", [sprints_service_1.SprintsService,
        events_gateway_1.EventsGateway,
        workspace_scope_service_1.WorkspaceScopeService])
], SprintsController);
//# sourceMappingURL=sprints.controller.js.map