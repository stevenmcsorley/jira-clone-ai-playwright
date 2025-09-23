import { Repository } from 'typeorm';
import { TimeLog } from './entities/time-log.entity';
import { Issue } from './entities/issue.entity';
import { User } from '../users/entities/user.entity';
import { CreateTimeLogDto, UpdateTimeLogDto, TimeTrackingSummaryDto } from './dto/time-log.dto';
export declare class TimeTrackingService {
    private timeLogsRepository;
    private issuesRepository;
    private usersRepository;
    constructor(timeLogsRepository: Repository<TimeLog>, issuesRepository: Repository<Issue>, usersRepository: Repository<User>);
    logTime(createTimeLogDto: CreateTimeLogDto, userId: number): Promise<TimeLog>;
    getTimeLogsByIssue(issueId: number): Promise<TimeLog[]>;
    getTimeTrackingSummary(issueId: number): Promise<TimeTrackingSummaryDto>;
    findOne(id: number): Promise<TimeLog>;
    updateTimeLog(id: number, updateTimeLogDto: UpdateTimeLogDto, userId: number): Promise<TimeLog>;
    deleteTimeLog(id: number, userId: number): Promise<void>;
    formatTime(hours: number): string;
    parseTimeInput(timeStr: string): number;
}
