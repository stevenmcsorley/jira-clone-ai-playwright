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
exports.CommentsController = void 0;
const common_1 = require("@nestjs/common");
const comments_service_1 = require("./comments.service");
const comment_dto_1 = require("./dto/comment.dto");
const workspace_scope_service_1 = require("../workspaces/workspace-scope.service");
let CommentsController = class CommentsController {
    constructor(commentsService, workspaceScope) {
        this.commentsService = commentsService;
        this.workspaceScope = workspaceScope;
    }
    async create(createCommentDto, req) {
        await this.workspaceScope.assertIssue(createCommentDto.issueId, req.workspaceId);
        const userId = req.user?.id || 1;
        return this.commentsService.create(createCommentDto, userId);
    }
    async findByIssue(issueId, req) {
        await this.workspaceScope.assertIssue(issueId, req.workspaceId);
        return this.commentsService.findByIssue(issueId);
    }
    async findOne(id, req) {
        const comment = await this.commentsService.findOne(id);
        await this.workspaceScope.assertIssue(comment.issueId, req.workspaceId);
        return comment;
    }
    async update(id, updateCommentDto, req) {
        const comment = await this.commentsService.findOne(id);
        await this.workspaceScope.assertIssue(comment.issueId, req.workspaceId);
        const userId = req.user?.id || 1;
        return this.commentsService.update(id, updateCommentDto, userId);
    }
    async remove(id, req) {
        const comment = await this.commentsService.findOne(id);
        await this.workspaceScope.assertIssue(comment.issueId, req.workspaceId);
        const userId = req.user?.id || 1;
        return this.commentsService.remove(id, userId);
    }
};
exports.CommentsController = CommentsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [comment_dto_1.CreateCommentDto, Object]),
    __metadata("design:returntype", Promise)
], CommentsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('issue/:issueId'),
    __param(0, (0, common_1.Param)('issueId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], CommentsController.prototype, "findByIssue", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], CommentsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, comment_dto_1.UpdateCommentDto, Object]),
    __metadata("design:returntype", Promise)
], CommentsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], CommentsController.prototype, "remove", null);
exports.CommentsController = CommentsController = __decorate([
    (0, common_1.Controller)('api/comments'),
    __metadata("design:paramtypes", [comments_service_1.CommentsService,
        workspace_scope_service_1.WorkspaceScopeService])
], CommentsController);
//# sourceMappingURL=comments.controller.js.map