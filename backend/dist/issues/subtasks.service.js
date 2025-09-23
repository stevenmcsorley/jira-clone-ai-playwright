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
exports.SubtasksService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const subtask_entity_1 = require("./entities/subtask.entity");
const issue_entity_1 = require("./entities/issue.entity");
const user_entity_1 = require("../users/entities/user.entity");
let SubtasksService = class SubtasksService {
    constructor(subtasksRepository, issuesRepository, usersRepository) {
        this.subtasksRepository = subtasksRepository;
        this.issuesRepository = issuesRepository;
        this.usersRepository = usersRepository;
    }
    async create(createSubtaskDto) {
        const issue = await this.issuesRepository.findOne({
            where: { id: createSubtaskDto.issueId }
        });
        if (!issue) {
            throw new common_1.NotFoundException('Issue not found');
        }
        let assignee = null;
        if (createSubtaskDto.assigneeId) {
            assignee = await this.usersRepository.findOne({
                where: { id: createSubtaskDto.assigneeId }
            });
            if (!assignee) {
                throw new common_1.NotFoundException('Assignee not found');
            }
        }
        const maxPosition = await this.subtasksRepository
            .createQueryBuilder('subtask')
            .select('MAX(subtask.position)', 'maxPosition')
            .where('subtask.issueId = :issueId', { issueId: createSubtaskDto.issueId })
            .getRawOne();
        const position = (maxPosition?.maxPosition || 0) + 1;
        const subtask = this.subtasksRepository.create({
            ...createSubtaskDto,
            issue,
            assignee,
            position,
        });
        return this.subtasksRepository.save(subtask);
    }
    async findByIssue(issueId) {
        return this.subtasksRepository.find({
            where: { issueId },
            relations: ['assignee'],
            order: { position: 'ASC' }
        });
    }
    async findOne(id) {
        const subtask = await this.subtasksRepository.findOne({
            where: { id },
            relations: ['assignee', 'issue']
        });
        if (!subtask) {
            throw new common_1.NotFoundException('Subtask not found');
        }
        return subtask;
    }
    async update(id, updateSubtaskDto) {
        const subtask = await this.findOne(id);
        if (updateSubtaskDto.assigneeId !== undefined) {
            if (updateSubtaskDto.assigneeId === null) {
                subtask.assignee = null;
                subtask.assigneeId = null;
            }
            else {
                const assignee = await this.usersRepository.findOne({
                    where: { id: updateSubtaskDto.assigneeId }
                });
                if (!assignee) {
                    throw new common_1.NotFoundException('Assignee not found');
                }
                subtask.assignee = assignee;
                subtask.assigneeId = updateSubtaskDto.assigneeId;
            }
        }
        Object.assign(subtask, updateSubtaskDto);
        return this.subtasksRepository.save(subtask);
    }
    async remove(id) {
        const subtask = await this.findOne(id);
        await this.subtasksRepository.remove(subtask);
    }
    async reorderSubtasks(issueId, subtaskIds) {
        const subtasks = await this.findByIssue(issueId);
        for (let i = 0; i < subtaskIds.length; i++) {
            const subtask = subtasks.find(s => s.id === subtaskIds[i]);
            if (subtask) {
                subtask.position = i + 1;
                await this.subtasksRepository.save(subtask);
            }
        }
    }
    async getSubtaskProgress(issueId) {
        const subtasks = await this.findByIssue(issueId);
        const total = subtasks.length;
        const completed = subtasks.filter(subtask => subtask.status === 'done').length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { completed, total, percentage };
    }
};
exports.SubtasksService = SubtasksService;
exports.SubtasksService = SubtasksService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(subtask_entity_1.Subtask)),
    __param(1, (0, typeorm_1.InjectRepository)(issue_entity_1.Issue)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], SubtasksService);
//# sourceMappingURL=subtasks.service.js.map