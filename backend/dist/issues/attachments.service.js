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
exports.AttachmentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const attachment_entity_1 = require("./entities/attachment.entity");
const issue_entity_1 = require("./entities/issue.entity");
const user_entity_1 = require("../users/entities/user.entity");
let AttachmentsService = class AttachmentsService {
    constructor(attachmentsRepository, issuesRepository, usersRepository) {
        this.attachmentsRepository = attachmentsRepository;
        this.issuesRepository = issuesRepository;
        this.usersRepository = usersRepository;
    }
    async create(createAttachmentDto, uploadedById) {
        const issue = await this.issuesRepository.findOne({
            where: { id: createAttachmentDto.issueId }
        });
        if (!issue) {
            throw new common_1.NotFoundException('Issue not found');
        }
        const user = await this.usersRepository.findOne({
            where: { id: uploadedById }
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const attachment = this.attachmentsRepository.create({
            ...createAttachmentDto,
            uploadedById,
            issue,
            uploadedBy: user,
        });
        return this.attachmentsRepository.save(attachment);
    }
    async findByIssue(issueId) {
        return this.attachmentsRepository.find({
            where: { issueId },
            relations: ['uploadedBy'],
            order: { createdAt: 'DESC' }
        });
    }
    async findOne(id) {
        const attachment = await this.attachmentsRepository.findOne({
            where: { id },
            relations: ['uploadedBy', 'issue']
        });
        if (!attachment) {
            throw new common_1.NotFoundException('Attachment not found');
        }
        return attachment;
    }
    async remove(id, userId) {
        const attachment = await this.findOne(id);
        if (attachment.uploadedById !== userId) {
            throw new common_1.NotFoundException('You can only delete your own attachments');
        }
        await this.attachmentsRepository.remove(attachment);
    }
    formatFileSize(bytes) {
        if (bytes === 0)
            return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    isImageFile(mimeType) {
        return mimeType.startsWith('image/');
    }
    getFileIcon(mimeType) {
        if (mimeType.startsWith('image/'))
            return '🖼️';
        if (mimeType.includes('pdf'))
            return '📄';
        if (mimeType.includes('word') || mimeType.includes('document'))
            return '📝';
        if (mimeType.includes('sheet') || mimeType.includes('excel'))
            return '📊';
        if (mimeType.includes('presentation') || mimeType.includes('powerpoint'))
            return '📽️';
        if (mimeType.includes('zip') || mimeType.includes('archive'))
            return '📦';
        if (mimeType.includes('video'))
            return '🎬';
        if (mimeType.includes('audio'))
            return '🎵';
        return '📎';
    }
};
exports.AttachmentsService = AttachmentsService;
exports.AttachmentsService = AttachmentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(attachment_entity_1.Attachment)),
    __param(1, (0, typeorm_1.InjectRepository)(issue_entity_1.Issue)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AttachmentsService);
//# sourceMappingURL=attachments.service.js.map