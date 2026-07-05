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
exports.SubtasksController = void 0;
const common_1 = require("@nestjs/common");
const subtasks_service_1 = require("./subtasks.service");
const subtask_dto_1 = require("./dto/subtask.dto");
const workspace_scope_service_1 = require("../workspaces/workspace-scope.service");
let SubtasksController = class SubtasksController {
    constructor(subtasksService, workspaceScope) {
        this.subtasksService = subtasksService;
        this.workspaceScope = workspaceScope;
    }
    async create(createSubtaskDto, req) {
        await this.workspaceScope.assertIssue(createSubtaskDto.issueId, req.workspaceId);
        return this.subtasksService.create(createSubtaskDto);
    }
    async findByIssue(issueId, req) {
        await this.workspaceScope.assertIssue(issueId, req.workspaceId);
        return this.subtasksService.findByIssue(issueId);
    }
    async getProgress(issueId, req) {
        await this.workspaceScope.assertIssue(issueId, req.workspaceId);
        return this.subtasksService.getSubtaskProgress(issueId);
    }
    async findOne(id, req) {
        const subtask = await this.subtasksService.findOne(id);
        await this.workspaceScope.assertIssue(subtask.issueId, req.workspaceId);
        return subtask;
    }
    async update(id, updateSubtaskDto, req) {
        const subtask = await this.subtasksService.findOne(id);
        await this.workspaceScope.assertIssue(subtask.issueId, req.workspaceId);
        return this.subtasksService.update(id, updateSubtaskDto);
    }
    async reorderSubtasks(issueId, body, req) {
        await this.workspaceScope.assertIssue(issueId, req.workspaceId);
        return this.subtasksService.reorderSubtasks(issueId, body.subtaskIds);
    }
    async remove(id, req) {
        const subtask = await this.subtasksService.findOne(id);
        await this.workspaceScope.assertIssue(subtask.issueId, req.workspaceId);
        return this.subtasksService.remove(id);
    }
};
exports.SubtasksController = SubtasksController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [subtask_dto_1.CreateSubtaskDto, Object]),
    __metadata("design:returntype", Promise)
], SubtasksController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('issue/:issueId'),
    __param(0, (0, common_1.Param)('issueId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], SubtasksController.prototype, "findByIssue", null);
__decorate([
    (0, common_1.Get)('issue/:issueId/progress'),
    __param(0, (0, common_1.Param)('issueId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], SubtasksController.prototype, "getProgress", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], SubtasksController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, subtask_dto_1.UpdateSubtaskDto, Object]),
    __metadata("design:returntype", Promise)
], SubtasksController.prototype, "update", null);
__decorate([
    (0, common_1.Post)('issue/:issueId/reorder'),
    __param(0, (0, common_1.Param)('issueId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", Promise)
], SubtasksController.prototype, "reorderSubtasks", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], SubtasksController.prototype, "remove", null);
exports.SubtasksController = SubtasksController = __decorate([
    (0, common_1.Controller)('api/subtasks'),
    __metadata("design:paramtypes", [subtasks_service_1.SubtasksService,
        workspace_scope_service_1.WorkspaceScopeService])
], SubtasksController);
//# sourceMappingURL=subtasks.controller.js.map