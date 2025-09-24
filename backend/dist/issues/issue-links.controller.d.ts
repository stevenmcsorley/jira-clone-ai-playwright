import { IssueLinksService } from './issue-links.service';
import { IssueLinkType } from './entities/issue-link.entity';
interface CreateIssueLinkDto {
    sourceIssueId: number;
    targetIssueId: number;
    linkType: IssueLinkType;
    createdById: number;
}
export declare class IssueLinksController {
    private readonly issueLinksService;
    constructor(issueLinksService: IssueLinksService);
    create(createIssueLinkDto: CreateIssueLinkDto): Promise<import("./entities/issue-link.entity").IssueLink>;
    findByIssueId(issueId: string): Promise<import("./entities/issue-link.entity").IssueLink[]>;
    remove(id: string): Promise<void>;
    searchIssues(query: string, projectId?: string): Promise<import("./entities/issue.entity").Issue[]>;
}
export {};
