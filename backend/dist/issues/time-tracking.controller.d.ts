import { TimeTrackingService } from './time-tracking.service';
import { CreateTimeLogDto, UpdateTimeLogDto } from './dto/time-log.dto';
export declare class TimeTrackingController {
    private readonly timeTrackingService;
    constructor(timeTrackingService: TimeTrackingService);
    logTime(createTimeLogDto: CreateTimeLogDto, req: any): Promise<import("./entities/time-log.entity").TimeLog>;
    getTimeLogsByIssue(issueId: number): Promise<import("./entities/time-log.entity").TimeLog[]>;
    getTimeTrackingSummary(issueId: number): Promise<import("./dto/time-log.dto").TimeTrackingSummaryDto>;
    findOne(id: number): Promise<import("./entities/time-log.entity").TimeLog>;
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
