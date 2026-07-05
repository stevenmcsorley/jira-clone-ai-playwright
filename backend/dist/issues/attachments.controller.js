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
exports.AttachmentsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const attachments_service_1 = require("./attachments.service");
const fs_1 = require("fs");
const workspace_scope_service_1 = require("../workspaces/workspace-scope.service");
let AttachmentsController = class AttachmentsController {
    constructor(attachmentsService, workspaceScope) {
        this.attachmentsService = attachmentsService;
        this.workspaceScope = workspaceScope;
    }
    async uploadFile(issueId, file, req) {
        await this.workspaceScope.assertIssue(issueId, req.workspaceId);
        if (!file) {
            throw new common_1.NotFoundException('No file uploaded');
        }
        const createAttachmentDto = {
            filename: file.filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            path: file.path,
            issueId,
        };
        const userId = req.user?.id || 1;
        return this.attachmentsService.create(createAttachmentDto, userId);
    }
    async findByIssue(issueId, req) {
        await this.workspaceScope.assertIssue(issueId, req.workspaceId);
        return this.attachmentsService.findByIssue(issueId);
    }
    async findOne(id, req) {
        const attachment = await this.attachmentsService.findOne(id);
        await this.workspaceScope.assertIssue(attachment.issueId, req.workspaceId);
        return attachment;
    }
    async downloadFile(id, res, req) {
        const attachment = await this.attachmentsService.findOne(id);
        await this.workspaceScope.assertIssue(attachment.issueId, req.workspaceId);
        if (!(0, fs_1.existsSync)(attachment.path)) {
            throw new common_1.NotFoundException('File not found on disk');
        }
        res.setHeader('Content-Type', attachment.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName}"`);
        const file = (0, fs_1.createReadStream)(attachment.path);
        file.pipe(res);
    }
    async remove(id, req) {
        const attachment = await this.attachmentsService.findOne(id);
        await this.workspaceScope.assertIssue(attachment.issueId, req.workspaceId);
        const userId = req.user?.id || 1;
        return this.attachmentsService.remove(id, userId);
    }
};
exports.AttachmentsController = AttachmentsController;
__decorate([
    (0, common_1.Post)('upload/:issueId'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads',
            filename: (req, file, callback) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                const extension = (0, path_1.extname)(file.originalname);
                callback(null, `${uniqueSuffix}${extension}`);
            },
        }),
        limits: {
            fileSize: 10 * 1024 * 1024,
        },
    })),
    __param(0, (0, common_1.Param)('issueId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", Promise)
], AttachmentsController.prototype, "uploadFile", null);
__decorate([
    (0, common_1.Get)('issue/:issueId'),
    __param(0, (0, common_1.Param)('issueId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AttachmentsController.prototype, "findByIssue", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AttachmentsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('download/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Response)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", Promise)
], AttachmentsController.prototype, "downloadFile", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AttachmentsController.prototype, "remove", null);
exports.AttachmentsController = AttachmentsController = __decorate([
    (0, common_1.Controller)('api/attachments'),
    __metadata("design:paramtypes", [attachments_service_1.AttachmentsService,
        workspace_scope_service_1.WorkspaceScopeService])
], AttachmentsController);
//# sourceMappingURL=attachments.controller.js.map