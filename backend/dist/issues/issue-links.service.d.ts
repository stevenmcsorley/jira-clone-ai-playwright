import { Repository } from 'typeorm';
import { IssueLink, IssueLinkType } from './entities/issue-link.entity';
import { Issue } from './entities/issue.entity';
interface CreateIssueLinkDto {
    sourceIssueId: number;
    targetIssueId: number;
    linkType: IssueLinkType;
    createdById: number;
}
export declare class IssueLinksService {
    private issueLinksRepository;
    private issuesRepository;
    constructor(issueLinksRepository: Repository<IssueLink>, issuesRepository: Repository<Issue>);
    create(createIssueLinkDto: CreateIssueLinkDto): Promise<IssueLink>;
    findByIssueId(issueId: number): Promise<IssueLink[]>;
    remove(id: number): Promise<void>;
    searchIssues(query: string, projectId?: number): Promise<Issue[]>;
    private getReverseLinkType;
}
export {};
