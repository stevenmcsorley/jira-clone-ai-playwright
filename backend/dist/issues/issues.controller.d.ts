import { IssuesService } from './issues.service';
import { CreateIssueDto } from './dto/create-issue.dto';
import { EventsGateway } from '../events/events.gateway';
import { WorkspaceScopeService } from '../workspaces/workspace-scope.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class IssuesController {
    private readonly issuesService;
    private readonly eventsGateway;
    private readonly workspaceScope;
    private readonly notificationsService;
    constructor(issuesService: IssuesService, eventsGateway: EventsGateway, workspaceScope: WorkspaceScopeService, notificationsService: NotificationsService);
    create(createIssueDto: CreateIssueDto, req: any): Promise<import("./entities/issue.entity").Issue>;
    findAll(req: any, projectId?: string, boardView?: string): Promise<import("./entities/issue.entity").Issue[]>;
    findOne(id: string, req: any): Promise<import("./entities/issue.entity").Issue>;
    history(id: string, req: any): Promise<{
        id: number;
        issueId: number;
        field: string;
        oldValue: string;
        newValue: string;
        createdAt: Date;
        actor: {
            id: number;
            name: string;
        };
    }[]>;
    update(id: string, updateData: Partial<CreateIssueDto>, req: any): Promise<import("./entities/issue.entity").Issue>;
    updatePositions(updates: {
        id: number;
        position: number;
        status: string;
    }[], req: any): Promise<void>;
    remove(id: string, req: any): Promise<{
        message: string;
    }>;
    search(searchData: {
        query: string;
        projectId?: number;
    }, req: any): Promise<{
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
    }, req: any): Promise<{
        successCount: number;
        failureCount: number;
        errors: Array<{
            issueId: number;
            error: string;
        }>;
    }>;
}
