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
exports.IssuesController = void 0;
const common_1 = require("@nestjs/common");
const issues_service_1 = require("./issues.service");
const create_issue_dto_1 = require("./dto/create-issue.dto");
const events_gateway_1 = require("../events/events.gateway");
const workspace_scope_service_1 = require("../workspaces/workspace-scope.service");
const notifications_service_1 = require("../notifications/notifications.service");
let IssuesController = class IssuesController {
    constructor(issuesService, eventsGateway, workspaceScope, notificationsService) {
        this.issuesService = issuesService;
        this.eventsGateway = eventsGateway;
        this.workspaceScope = workspaceScope;
        this.notificationsService = notificationsService;
    }
    async create(createIssueDto, req) {
        await this.workspaceScope.assertProject(createIssueDto.projectId, req.workspaceId);
        const issue = await this.issuesService.create(createIssueDto);
        this.eventsGateway.emitIssueCreated(issue);
        return issue;
    }
    async findAll(req, projectId, boardView) {
        if (projectId) {
            await this.workspaceScope.assertProject(+projectId, req.workspaceId);
            if (boardView === 'true') {
                return this.issuesService.findForBoard(+projectId);
            }
            return this.issuesService.findByProject(+projectId);
        }
        const workspaceProjectIds = await this.workspaceScope.projectIds(req.workspaceId);
        const issues = await this.issuesService.findAll();
        return issues.filter(issue => workspaceProjectIds.includes(issue.projectId));
    }
    async findOne(id, req) {
        await this.workspaceScope.assertIssue(+id, req.workspaceId);
        return this.issuesService.findOne(+id);
    }
    async history(id, req) {
        await this.workspaceScope.assertIssue(+id, req.workspaceId);
        return this.notificationsService.issueHistory(+id);
    }
    async update(id, updateData, req) {
        await this.workspaceScope.assertIssue(+id, req.workspaceId);
        if (updateData.projectId) {
            await this.workspaceScope.assertProject(updateData.projectId, req.workspaceId);
        }
        const issue = await this.issuesService.update(+id, updateData, req.user?.id ?? null);
        this.eventsGateway.emitIssueUpdated(issue);
        return issue;
    }
    async updatePositions(updates, req) {
        for (const update of updates) {
            await this.workspaceScope.assertIssue(update.id, req.workspaceId);
        }
        const result = await this.issuesService.updatePositions(updates);
        for (const update of updates) {
            const issue = await this.issuesService.findOne(update.id);
            this.eventsGateway.emitIssueUpdated(issue);
        }
        return result;
    }
    async remove(id, req) {
        await this.workspaceScope.assertIssue(+id, req.workspaceId);
        const issue = await this.issuesService.findOne(+id);
        await this.issuesService.remove(+id);
        this.eventsGateway.emitIssueDeleted(+id, issue.projectId);
        return { message: 'Issue deleted successfully' };
    }
    async search(searchData, req) {
        if (searchData.projectId) {
            await this.workspaceScope.assertProject(searchData.projectId, req.workspaceId);
            return this.issuesService.search(searchData.query, searchData.projectId);
        }
        const workspaceProjectIds = await this.workspaceScope.projectIds(req.workspaceId);
        const { results } = await this.issuesService.search(searchData.query);
        const scoped = results.filter(issue => workspaceProjectIds.includes(issue.projectId));
        return { results: scoped, totalResults: scoped.length };
    }
    async bulkUpdate(bulkUpdateData, req) {
        for (const issueId of bulkUpdateData.issueIds) {
            await this.workspaceScope.assertIssue(issueId, req.workspaceId);
        }
        return this.issuesService.bulkUpdate(bulkUpdateData.issueIds, bulkUpdateData.operation, req.user?.id ?? null);
    }
};
exports.IssuesController = IssuesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_issue_dto_1.CreateIssueDto, Object]),
    __metadata("design:returntype", Promise)
], IssuesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('projectId')),
    __param(2, (0, common_1.Query)('boardView')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], IssuesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], IssuesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/history'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], IssuesController.prototype, "history", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], IssuesController.prototype, "update", null);
__decorate([
    (0, common_1.Post)('reorder'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Object]),
    __metadata("design:returntype", Promise)
], IssuesController.prototype, "updatePositions", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], IssuesController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('search'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], IssuesController.prototype, "search", null);
__decorate([
    (0, common_1.Post)('bulk-update'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], IssuesController.prototype, "bulkUpdate", null);
exports.IssuesController = IssuesController = __decorate([
    (0, common_1.Controller)('api/issues'),
    __metadata("design:paramtypes", [issues_service_1.IssuesService,
        events_gateway_1.EventsGateway,
        workspace_scope_service_1.WorkspaceScopeService,
        notifications_service_1.NotificationsService])
], IssuesController);
//# sourceMappingURL=issues.controller.js.map