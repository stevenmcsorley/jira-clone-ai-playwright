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
exports.SprintsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const sprint_entity_1 = require("./entities/sprint.entity");
const issue_entity_1 = require("../issues/entities/issue.entity");
let SprintsService = class SprintsService {
    constructor(sprintsRepository, issuesRepository) {
        this.sprintsRepository = sprintsRepository;
        this.issuesRepository = issuesRepository;
    }
    async create(createSprintDto) {
        const lastSprint = await this.sprintsRepository.findOne({
            where: { projectId: createSprintDto.projectId },
            order: { position: 'DESC' },
        });
        const position = lastSprint ? lastSprint.position + 1 : 0;
        const sprint = this.sprintsRepository.create({
            ...createSprintDto,
            position,
        });
        return this.sprintsRepository.save(sprint);
    }
    async findByProject(projectId) {
        return this.sprintsRepository.find({
            where: { projectId },
            relations: ['issues', 'issues.assignee', 'issues.reporter', 'issues.project'],
            order: { position: 'ASC' },
        });
    }
    async findOne(id) {
        const sprint = await this.sprintsRepository.findOne({
            where: { id },
            relations: ['issues', 'issues.assignee', 'issues.reporter', 'project'],
        });
        if (!sprint) {
            throw new Error('Sprint not found');
        }
        return sprint;
    }
    async update(id, updateSprintDto) {
        await this.sprintsRepository.update(id, updateSprintDto);
        return this.findOne(id);
    }
    async remove(id) {
        await this.issuesRepository.update({ sprintId: id }, { sprintId: null });
        await this.sprintsRepository.delete(id);
    }
    async startSprint(id, startDate, endDate) {
        return this.update(id, {
            status: sprint_entity_1.SprintStatus.ACTIVE,
            startDate,
            endDate,
        });
    }
    async completeSprint(id) {
        const sprint = await this.findOne(id);
        if (!sprint.startDate || !sprint.endDate) {
            throw new Error('Cannot complete a sprint that has not been started. Please start the sprint first with start and end dates.');
        }
        await this.issuesRepository.update({
            sprintId: id,
            status: (0, typeorm_2.Not)('done')
        }, { sprintId: null });
        return this.update(id, {
            status: sprint_entity_1.SprintStatus.COMPLETED,
        });
    }
    async addIssueToSprint(sprintId, issueId) {
        await this.issuesRepository.update(issueId, { sprintId });
    }
    async removeIssueFromSprint(issueId) {
        await this.issuesRepository.update(issueId, { sprintId: null });
    }
    async getBacklogIssues(projectId) {
        return this.issuesRepository.find({
            where: {
                projectId,
                sprintId: (0, typeorm_2.IsNull)(),
            },
            relations: ['assignee', 'reporter', 'epic'],
            order: { position: 'ASC' },
        });
    }
};
exports.SprintsService = SprintsService;
exports.SprintsService = SprintsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(sprint_entity_1.Sprint)),
    __param(1, (0, typeorm_1.InjectRepository)(issue_entity_1.Issue)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], SprintsService);
//# sourceMappingURL=sprints.service.js.map