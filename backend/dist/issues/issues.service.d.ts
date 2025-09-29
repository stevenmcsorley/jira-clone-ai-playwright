import { Repository } from 'typeorm';
import { Issue } from './entities/issue.entity';
import { CreateIssueDto } from './dto/create-issue.dto';
import { TimeTrackingService } from './time-tracking.service';
export declare class IssuesService {
    private issuesRepository;
    private timeTrackingService;
    constructor(issuesRepository: Repository<Issue>, timeTrackingService: TimeTrackingService);
    create(createIssueDto: CreateIssueDto): Promise<Issue>;
    findAll(): Promise<Issue[]>;
    findByProject(projectId: number): Promise<Issue[]>;
    findForBoard(projectId: number): Promise<Issue[]>;
    findOne(id: number): Promise<Issue>;
    update(id: number, updateData: Partial<Issue>): Promise<Issue>;
    private calculateTimeSpent;
    updatePositions(updates: {
        id: number;
        position: number;
        status: string;
    }[]): Promise<void>;
    remove(id: number): Promise<void>;
    search(query: string, projectId?: number): Promise<{
        results: Issue[];
        totalResults: number;
    }>;
    private parseSearchQuery;
    bulkUpdate(issueIds: number[], operation: {
        type: 'assign' | 'status' | 'labels' | 'priority' | 'sprint' | 'estimate' | 'component' | 'version';
        field: string;
        value: any;
    }): Promise<{
        successCount: number;
        failureCount: number;
        errors: Array<{
            issueId: number;
            error: string;
        }>;
    }>;
}
