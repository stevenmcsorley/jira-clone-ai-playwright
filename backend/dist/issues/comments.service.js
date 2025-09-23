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
exports.CommentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const comment_entity_1 = require("./entities/comment.entity");
const issue_entity_1 = require("./entities/issue.entity");
const user_entity_1 = require("../users/entities/user.entity");
let CommentsService = class CommentsService {
    constructor(commentsRepository, issuesRepository, usersRepository) {
        this.commentsRepository = commentsRepository;
        this.issuesRepository = issuesRepository;
        this.usersRepository = usersRepository;
    }
    async create(createCommentDto, authorId) {
        const issue = await this.issuesRepository.findOne({
            where: { id: createCommentDto.issueId }
        });
        if (!issue) {
            throw new common_1.NotFoundException('Issue not found');
        }
        const author = await this.usersRepository.findOne({
            where: { id: authorId }
        });
        if (!author) {
            throw new common_1.NotFoundException('Author not found');
        }
        let parent = null;
        if (createCommentDto.parentId) {
            parent = await this.commentsRepository.findOne({
                where: { id: createCommentDto.parentId }
            });
            if (!parent) {
                throw new common_1.NotFoundException('Parent comment not found');
            }
        }
        const comment = this.commentsRepository.create({
            content: createCommentDto.content,
            issue,
            author,
            parent,
            issueId: createCommentDto.issueId,
            authorId,
            parentId: createCommentDto.parentId,
        });
        return this.commentsRepository.save(comment);
    }
    async findByIssue(issueId) {
        return this.commentsRepository.find({
            where: { issueId },
            relations: ['author', 'replies', 'replies.author'],
            order: { createdAt: 'ASC' }
        });
    }
    async findOne(id) {
        const comment = await this.commentsRepository.findOne({
            where: { id },
            relations: ['author', 'issue', 'parent', 'replies']
        });
        if (!comment) {
            throw new common_1.NotFoundException('Comment not found');
        }
        return comment;
    }
    async update(id, updateCommentDto, userId) {
        const comment = await this.findOne(id);
        if (comment.authorId !== userId) {
            throw new common_1.NotFoundException('You can only edit your own comments');
        }
        if (updateCommentDto.content) {
            comment.content = updateCommentDto.content;
            comment.isEdited = true;
            comment.editedAt = new Date();
        }
        return this.commentsRepository.save(comment);
    }
    async remove(id, userId) {
        const comment = await this.findOne(id);
        if (comment.authorId !== userId) {
            throw new common_1.NotFoundException('You can only delete your own comments');
        }
        await this.commentsRepository.remove(comment);
    }
};
exports.CommentsService = CommentsService;
exports.CommentsService = CommentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(comment_entity_1.Comment)),
    __param(1, (0, typeorm_1.InjectRepository)(issue_entity_1.Issue)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], CommentsService);
//# sourceMappingURL=comments.service.js.map