import { IssuesService } from './issues.service';
import { CreateIssueDto } from './dto/create-issue.dto';
import { EventsGateway } from '../events/events.gateway';
export declare class IssuesController {
    private readonly issuesService;
    private readonly eventsGateway;
    constructor(issuesService: IssuesService, eventsGateway: EventsGateway);
    create(createIssueDto: CreateIssueDto): Promise<import("./entities/issue.entity").Issue>;
    findAll(projectId?: string, boardView?: string): Promise<import("./entities/issue.entity").Issue[]>;
    findOne(id: string): Promise<import("./entities/issue.entity").Issue>;
    update(id: string, updateData: Partial<CreateIssueDto>): Promise<import("./entities/issue.entity").Issue>;
    updatePositions(updates: {
        id: number;
        position: number;
        status: string;
    }[]): Promise<void>;
    remove(id: string): Promise<{
        message: string;
    }>;
    search(searchData: {
        query: string;
        projectId?: number;
    }): Promise<{
        results: import("./entities/issue.entity").Issue[];
        totalResults: number;
    }>;
    bulkUpdate(bulkUpdateData: {
        issueIds: number[];
        operation: {
            type: 'assign' | 'status' | 'labels' | 'priority' | 'sprint' | 'estimate' | 'component' | 'version';
            field: string;
            value: any;
        };
    }): Promise<{
        successCount: number;
        failureCount: number;
        errors: Array<{
            issueId: number;
            error: string;
        }>;
    }>;
}
