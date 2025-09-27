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
exports.ProjectsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const project_entity_1 = require("./entities/project.entity");
const issue_entity_1 = require("../issues/entities/issue.entity");
const sprint_entity_1 = require("../sprints/entities/sprint.entity");
const comment_entity_1 = require("../issues/entities/comment.entity");
const attachment_entity_1 = require("../issues/entities/attachment.entity");
const time_log_entity_1 = require("../issues/entities/time-log.entity");
const issue_link_entity_1 = require("../issues/entities/issue-link.entity");
const subtask_entity_1 = require("../issues/entities/subtask.entity");
let ProjectsService = class ProjectsService {
    constructor(projectsRepository, issuesRepository, sprintsRepository, commentsRepository, attachmentsRepository, timeLogsRepository, issueLinksRepository, subtasksRepository) {
        this.projectsRepository = projectsRepository;
        this.issuesRepository = issuesRepository;
        this.sprintsRepository = sprintsRepository;
        this.commentsRepository = commentsRepository;
        this.attachmentsRepository = attachmentsRepository;
        this.timeLogsRepository = timeLogsRepository;
        this.issueLinksRepository = issueLinksRepository;
        this.subtasksRepository = subtasksRepository;
    }
    async create(createProjectDto) {
        const project = this.projectsRepository.create(createProjectDto);
        return this.projectsRepository.save(project);
    }
    async findAll() {
        return this.projectsRepository.find({
            relations: ['lead', 'issues'],
        });
    }
    async findOne(id) {
        return this.projectsRepository.findOne({
            where: { id },
            relations: ['lead', 'issues', 'issues.assignee', 'issues.reporter'],
        });
    }
    async update(id, updateData) {
        await this.projectsRepository.update(id, updateData);
        return this.findOne(id);
    }
    async remove(id) {
        const issues = await this.issuesRepository.find({
            where: { projectId: id },
            select: ['id']
        });
        const issueIds = issues.map(issue => issue.id);
        if (issueIds.length > 0) {
            await this.commentsRepository.delete({ issueId: (0, typeorm_2.In)(issueIds) });
            await this.attachmentsRepository.delete({ issueId: (0, typeorm_2.In)(issueIds) });
            await this.timeLogsRepository.delete({ issueId: (0, typeorm_2.In)(issueIds) });
            await this.subtasksRepository.delete({ issueId: (0, typeorm_2.In)(issueIds) });
            await this.issueLinksRepository.delete({ sourceIssueId: (0, typeorm_2.In)(issueIds) });
            await this.issueLinksRepository.delete({ targetIssueId: (0, typeorm_2.In)(issueIds) });
        }
        await this.sprintsRepository.delete({ projectId: id });
        await this.issuesRepository.delete({ projectId: id });
        await this.projectsRepository.delete(id);
    }
};
exports.ProjectsService = ProjectsService;
exports.ProjectsService = ProjectsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __param(1, (0, typeorm_1.InjectRepository)(issue_entity_1.Issue)),
    __param(2, (0, typeorm_1.InjectRepository)(sprint_entity_1.Sprint)),
    __param(3, (0, typeorm_1.InjectRepository)(comment_entity_1.Comment)),
    __param(4, (0, typeorm_1.InjectRepository)(attachment_entity_1.Attachment)),
    __param(5, (0, typeorm_1.InjectRepository)(time_log_entity_1.TimeLog)),
    __param(6, (0, typeorm_1.InjectRepository)(issue_link_entity_1.IssueLink)),
    __param(7, (0, typeorm_1.InjectRepository)(subtask_entity_1.Subtask)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ProjectsService);
//# sourceMappingURL=projects.service.js.map