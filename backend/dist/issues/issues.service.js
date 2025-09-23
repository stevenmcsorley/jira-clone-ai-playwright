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
            relations: ['project', 'assignee', 'reporter'],
        });
    }
    async findByProject(projectId) {
        return this.issuesRepository.find({
            where: { projectId },
            relations: ['project', 'assignee', 'reporter'],
            order: { position: 'ASC', createdAt: 'DESC' },
        });
    }
    async findOne(id) {
        return this.issuesRepository.findOne({
            where: { id },
            relations: ['project', 'assignee', 'reporter'],
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
};
exports.IssuesService = IssuesService;
exports.IssuesService = IssuesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(issue_entity_1.Issue)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], IssuesService);
//# sourceMappingURL=issues.service.js.map