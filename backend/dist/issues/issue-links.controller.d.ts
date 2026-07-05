import { IssueLinksService } from './issue-links.service';
import { IssueLinkType } from './entities/issue-link.entity';
import { WorkspaceScopeService } from '../workspaces/workspace-scope.service';
interface CreateIssueLinkDto {
    sourceIssueId: number;
    targetIssueId: number;
    linkType: IssueLinkType;
    createdById: number;
}
export declare class IssueLinksController {
    private readonly issueLinksService;
    private readonly workspaceScope;
    constructor(issueLinksService: IssueLinksService, workspaceScope: WorkspaceScopeService);
    create(createIssueLinkDto: CreateIssueLinkDto, req: any): Promise<import("./entities/issue-link.entity").IssueLink>;
    findByIssueId(issueId: string, req: any): Promise<import("./entities/issue-link.entity").IssueLink[]>;
    remove(id: string, req: any): Promise<void>;
    searchIssues(query: string, projectId: string | undefined, req: any): Promise<import("./entities/issue.entity").Issue[]>;
}
export {};
