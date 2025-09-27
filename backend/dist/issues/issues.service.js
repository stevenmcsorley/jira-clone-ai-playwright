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
exports.IssuesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const issue_entity_1 = require("./entities/issue.entity");
let IssuesService = class IssuesService {
    constructor(issuesRepository) {
        this.issuesRepository = issuesRepository;
    }
    async create(createIssueDto) {
        const issue = this.issuesRepository.create(createIssueDto);
        return this.issuesRepository.save(issue);
    }
    async findAll() {
        return this.issuesRepository.find({
            relations: ['project', 'assignee', 'reporter', 'epic', 'epicIssues'],
        });
    }
    async findByProject(projectId) {
        return this.issuesRepository.find({
            where: { projectId },
            relations: ['project', 'assignee', 'reporter', 'epic', 'epicIssues'],
            order: { position: 'ASC', createdAt: 'DESC' },
        });
    }
    async findForBoard(projectId) {
        const activeSprint = await this.issuesRepository.manager
            .getRepository('Sprint')
            .findOne({
            where: { projectId, status: 'active' }
        });
        if (!activeSprint) {
            return [];
        }
        return this.issuesRepository
            .createQueryBuilder('issue')
            .leftJoinAndSelect('issue.project', 'project')
            .leftJoinAndSelect('issue.assignee', 'assignee')
            .leftJoinAndSelect('issue.reporter', 'reporter')
            .leftJoinAndSelect('issue.epic', 'epic')
            .leftJoinAndSelect('issue.epicIssues', 'epicIssues')
            .leftJoinAndSelect('epicIssues.assignee', 'epicIssuesAssignee')
            .where('issue.projectId = :projectId', { projectId })
            .andWhere('issue.sprintId = :sprintId', { sprintId: activeSprint.id })
            .orderBy('issue.position', 'ASC')
            .addOrderBy('issue.createdAt', 'DESC')
            .getMany();
    }
    async findOne(id) {
        return this.issuesRepository.findOne({
            where: { id },
            relations: ['project', 'assignee', 'reporter', 'epic', 'epicIssues', 'epicIssues.assignee'],
        });
    }
    async update(id, updateData) {
        await this.issuesRepository.update(id, updateData);
        return this.findOne(id);
    }
    async updatePositions(updates) {
        for (const update of updates) {
            await this.issuesRepository.update(update.id, {
                position: update.position,
                status: update.status
            });
        }
    }
    async remove(id) {
        await this.issuesRepository.delete(id);
    }
    async search(query, projectId) {
        const queryBuilder = this.issuesRepository
            .createQueryBuilder('issue')
            .leftJoinAndSelect('issue.project', 'project')
            .leftJoinAndSelect('issue.assignee', 'assignee')
            .leftJoinAndSelect('issue.reporter', 'reporter')
            .leftJoinAndSelect('issue.epic', 'epic');
        const conditions = this.parseSearchQuery(query, queryBuilder);
        if (projectId) {
            queryBuilder.andWhere('issue.projectId = :projectId', { projectId });
        }
        conditions.forEach(condition => {
            queryBuilder.andWhere(condition.sql, condition.params);
        });
        const totalResults = await queryBuilder.getCount();
        const results = await queryBuilder
            .orderBy('issue.updatedAt', 'DESC')
            .limit(20)
            .getMany();
        return { results, totalResults };
    }
    parseSearchQuery(query, queryBuilder) {
        const conditions = [];
        if (!query)
            return conditions;
        if (!query.includes('=') && !query.includes('IN')) {
            conditions.push({
                sql: '("issue"."title" ILIKE :searchText OR "issue"."description" ILIKE :searchText)',
                params: { searchText: `%${query}%` }
            });
            return conditions;
        }
        const parts = query.split(/\s+AND\s+/i);
        parts.forEach((part, index) => {
            const trimmed = part.trim();
            const projectMatch = trimmed.match(/project\s*=\s*([A-Z]+)/i);
            if (projectMatch) {
                conditions.push({
                    sql: `"project"."key" = :projectKey${index}`,
                    params: { [`projectKey${index}`]: projectMatch[1] }
                });
                return;
            }
            const assigneeMatch = trimmed.match(/assignee\s*=\s*['"]*([^'"]+)['"]*$/i);
            if (assigneeMatch) {
                conditions.push({
                    sql: `"assignee"."name" = :assigneeUsername${index}`,
                    params: { [`assigneeUsername${index}`]: assigneeMatch[1] }
                });
                return;
            }
            const statusInMatch = trimmed.match(/status\s+IN\s*\(([^)]+)\)/i);
            if (statusInMatch) {
                const statuses = statusInMatch[1].split(',').map(s => s.trim().replace(/['"]/g, ''));
                conditions.push({
                    sql: `"issue"."status" IN (:...statuses${index})`,
                    params: { [`statuses${index}`]: statuses }
                });
                return;
            }
            const statusMatch = trimmed.match(/status\s*=\s*(\w+)/i);
            if (statusMatch) {
                conditions.push({
                    sql: `"issue"."status" = :status${index}`,
                    params: { [`status${index}`]: statusMatch[1] }
                });
                return;
            }
            const priorityMatch = trimmed.match(/priority\s*=\s*(\w+)/i);
            if (priorityMatch) {
                conditions.push({
                    sql: `"issue"."priority" = :priority${index}`,
                    params: { [`priority${index}`]: priorityMatch[1] }
                });
                return;
            }
            const typeMatch = trimmed.match(/type\s*=\s*(\w+)/i);
            if (typeMatch) {
                conditions.push({
                    sql: `"issue"."type" = :type${index}`,
                    params: { [`type${index}`]: typeMatch[1] }
                });
                return;
            }
        });
        return conditions;
    }
};
exports.IssuesService = IssuesService;
exports.IssuesService = IssuesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(issue_entity_1.Issue)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], IssuesService);
//# sourceMappingURL=issues.service.js.map