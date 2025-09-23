export declare class CreateTimeLogDto {
    hours: number;
    description?: string;
    date: string;
    issueId: number;
}
export declare class UpdateTimeLogDto {
    hours?: number;
    description?: string;
    date?: string;
}
export declare class TimeLogResponseDto {
    id: number;
    hours: number;
    description?: string;
    date: Date;
    issueId: number;
    userId: number;
    createdAt: Date;
    user: {
        id: number;
        name: string;
        email: string;
    };
}
export declare class TimeTrackingSummaryDto {
    totalTimeSpent: number;
    originalEstimate?: number;
    remainingEstimate?: number;
    timeSpentByUser: Array<{
        userId: number;
        userName: string;
        hours: number;
    }>;
    recentTimeLogs: TimeLogResponseDto[];
}
