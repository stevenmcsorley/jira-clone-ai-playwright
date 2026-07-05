import { TimeTrackingService } from './time-tracking.service';
import { CreateTimeLogDto, UpdateTimeLogDto } from './dto/time-log.dto';
import { WorkspaceScopeService } from '../workspaces/workspace-scope.service';
export declare class TimeTrackingController {
    private readonly timeTrackingService;
    private readonly workspaceScope;
    constructor(timeTrackingService: TimeTrackingService, workspaceScope: WorkspaceScopeService);
    logTime(createTimeLogDto: CreateTimeLogDto, req: any): Promise<import("./entities/time-log.entity").TimeLog>;
    getTimeLogsByIssue(issueId: number, req: any): Promise<import("./entities/time-log.entity").TimeLog[]>;
    getTimeTrackingSummary(issueId: number, req: any): Promise<import("./dto/time-log.dto").TimeTrackingSummaryDto>;
    findOne(id: number, req: any): Promise<import("./entities/time-log.entity").TimeLog>;
    updateTimeLog(id: number, updateTimeLogDto: UpdateTimeLogDto, req: any): Promise<import("./entities/time-log.entity").TimeLog>;
    deleteTimeLog(id: number, req: any): Promise<void>;
    parseTimeInput(body: {
        timeStr: string;
    }): {
        hours: number;
        formatted: string;
        error?: undefined;
    } | {
        error: any;
        hours?: undefined;
        formatted?: undefined;
    };
}
