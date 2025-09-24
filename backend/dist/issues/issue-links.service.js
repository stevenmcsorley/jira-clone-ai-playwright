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
exports.IssueLinksService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const issue_link_entity_1 = require("./entities/issue-link.entity");
const issue_entity_1 = require("./entities/issue.entity");
let IssueLinksService = class IssueLinksService {
    constructor(issueLinksRepository, issuesRepository) {
        this.issueLinksRepository = issueLinksRepository;
        this.issuesRepository = issuesRepository;
    }
    async create(createIssueLinkDto) {
        const [sourceIssue, targetIssue] = await Promise.all([
            this.issuesRepository.findOne({ where: { id: createIssueLinkDto.sourceIssueId } }),
            this.issuesRepository.findOne({ where: { id: createIssueLinkDto.targetIssueId } }),
        ]);
        if (!sourceIssue || !targetIssue) {
            throw new Error('One or both issues not found');
        }
        const existingLink = await this.issueLinksRepository.findOne({
            where: [
                {
                    sourceIssueId: createIssueLinkDto.sourceIssueId,
                    targetIssueId: createIssueLinkDto.targetIssueId,
                    linkType: createIssueLinkDto.linkType,
                },
                {
                    sourceIssueId: createIssueLinkDto.targetIssueId,
                    targetIssueId: createIssueLinkDto.sourceIssueId,
                    linkType: this.getReverseLinkType(createIssueLinkDto.linkType),
                },
            ],
        });
        if (existingLink) {
            throw new Error('Issue link already exists');
        }
        const issueLink = this.issueLinksRepository.create(createIssueLinkDto);
        return this.issueLinksRepository.save(issueLink);
    }
    async findByIssueId(issueId) {
        return this.issueLinksRepository.find({
            where: [
                { sourceIssueId: issueId },
                { targetIssueId: issueId },
            ],
            relations: ['sourceIssue', 'targetIssue', 'createdBy'],
        });
    }
    async remove(id) {
        await this.issueLinksRepository.delete(id);
    }
    async searchIssues(query, projectId) {
        const queryBuilder = this.issuesRepository
            .createQueryBuilder('issue')
            .leftJoinAndSelect('issue.assignee', 'assignee')
            .leftJoinAndSelect('issue.reporter', 'reporter');
        const isNumericQuery = /^\d+$/.test(query.trim());
        if (isNumericQuery) {
            const idPrefix = query.trim();
            queryBuilder.where('CAST(issue.id AS TEXT) LIKE :idPrefix', { idPrefix: `${idPrefix}%` });
        }
        else {
            const issueKeyMatch = query.match(/^(?:JC-?)(\d+)/i);
            if (issueKeyMatch) {
                const idPrefix = issueKeyMatch[1];
                queryBuilder.where('CAST(issue.id AS TEXT) LIKE :idPrefix', { idPrefix: `${idPrefix}%` });
            }
            else {
                queryBuilder.where('LOWER(issue.title) LIKE LOWER(:query)', { query: `%${query}%` });
            }
        }
        if (projectId) {
            queryBuilder.andWhere('issue.projectId = :projectId', { projectId });
        }
        return queryBuilder
            .orderBy('issue.id', 'ASC')
            .limit(10)
            .getMany();
    }
    getReverseLinkType(linkType) {
        const reverseMap = {
            [issue_link_entity_1.IssueLinkType.BLOCKS]: issue_link_entity_1.IssueLinkType.BLOCKED_BY,
            [issue_link_entity_1.IssueLinkType.BLOCKED_BY]: issue_link_entity_1.IssueLinkType.BLOCKS,
            [issue_link_entity_1.IssueLinkType.DUPLICATES]: issue_link_entity_1.IssueLinkType.DUPLICATED_BY,
            [issue_link_entity_1.IssueLinkType.DUPLICATED_BY]: issue_link_entity_1.IssueLinkType.DUPLICATES,
            [issue_link_entity_1.IssueLinkType.RELATES_TO]: issue_link_entity_1.IssueLinkType.RELATES_TO,
            [issue_link_entity_1.IssueLinkType.CAUSES]: issue_link_entity_1.IssueLinkType.CAUSED_BY,
            [issue_link_entity_1.IssueLinkType.CAUSED_BY]: issue_link_entity_1.IssueLinkType.CAUSES,
            [issue_link_entity_1.IssueLinkType.CLONES]: issue_link_entity_1.IssueLinkType.CLONED_BY,
            [issue_link_entity_1.IssueLinkType.CLONED_BY]: issue_link_entity_1.IssueLinkType.CLONES,
            [issue_link_entity_1.IssueLinkType.CHILD_OF]: issue_link_entity_1.IssueLinkType.PARENT_OF,
            [issue_link_entity_1.IssueLinkType.PARENT_OF]: issue_link_entity_1.IssueLinkType.CHILD_OF,
        };
        return reverseMap[linkType];
    }
};
exports.IssueLinksService = IssueLinksService;
exports.IssueLinksService = IssueLinksService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(issue_link_entity_1.IssueLink)),
    __param(1, (0, typeorm_1.InjectRepository)(issue_entity_1.Issue)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], IssueLinksService);
//# sourceMappingURL=issue-links.service.js.map