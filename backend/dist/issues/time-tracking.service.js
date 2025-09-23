"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeTrackingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const time_log_entity_1 = require("./entities/time-log.entity");
const issue_entity_1 = require("./entities/issue.entity");
const user_entity_1 = require("../users/entities/user.entity");
let TimeTrackingService = class TimeTrackingService {
    constructor(timeLogsRepository, issuesRepository, usersRepository) {
        this.timeLogsRepository = timeLogsRepository;
        this.issuesRepository = issuesRepository;
        this.usersRepository = usersRepository;
    }
    async logTime(createTimeLogDto, userId) {
        const issue = await this.issuesRepository.findOne({
            where: { id: createTimeLogDto.issueId }
        });
        if (!issue) {
            throw new common_1.NotFoundException('Issue not found');
        }
        const user = await this.usersRepository.findOne({
            where: { id: userId }
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const timeLog = this.timeLogsRepository.create({
            ...createTimeLogDto,
            hours: createTimeLogDto.hours,
            issue,
            user,
            userId,
        });
        return this.timeLogsRepository.save(timeLog);
    }
    async getTimeLogsByIssue(issueId) {
        return this.timeLogsRepository.find({
            where: { issueId },
            relations: ['user'],
            order: { hours: 'DESC', createdAt: 'DESC' }
        });
    }
    async getTimeTrackingSummary(issueId) {
        const timeLogs = await this.timeLogsRepository.find({
            where: { issueId },
            relations: ['user'],
            order: { createdAt: 'DESC' }
        });
        const totalTimeSpent = timeLogs.reduce((sum, log) => sum + log.hours, 0);
        const timeSpentByUser = timeLogs.reduce((acc, log) => {
            const existing = acc.find(item => item.userId === log.userId);
            if (existing) {
                existing.hours += log.hours;
            }
            else {
                acc.push({
                    userId: log.userId,
                    userName: log.user.name,
                    hours: log.hours
                });
            }
            return acc;
        }, []);
        const recentTimeLogs = timeLogs.slice(0, 5).map(log => ({
            id: log.id,
            hours: log.hours,
            description: log.description,
            date: log.date,
            issueId: log.issueId,
            userId: log.userId,
            createdAt: log.createdAt,
            user: {
                id: log.user.id,
                name: log.user.name,
                email: log.user.email
            }
        }));
        return {
            totalTimeSpent,
            originalEstimate: 0,
            remainingEstimate: 0,
            timeSpentByUser,
            recentTimeLogs
        };
    }
    async findOne(id) {
        const timeLog = await this.timeLogsRepository.findOne({
            where: { id },
            relations: ['user', 'issue']
        });
        if (!timeLog) {
            throw new common_1.NotFoundException('Time log not found');
        }
        return timeLog;
    }
    async updateTimeLog(id, updateTimeLogDto, userId) {
        const timeLog = await this.findOne(id);
        if (timeLog.userId !== userId) {
            throw new common_1.NotFoundException('You can only edit your own time logs');
        }
        if (updateTimeLogDto.date) {
            timeLog.date = new Date(updateTimeLogDto.date);
        }
        Object.assign(timeLog, updateTimeLogDto);
        return this.timeLogsRepository.save(timeLog);
    }
    async deleteTimeLog(id, userId) {
        const timeLog = await this.findOne(id);
        if (timeLog.userId !== userId) {
            throw new common_1.NotFoundException('You can only delete your own time logs');
        }
        await this.timeLogsRepository.remove(timeLog);
    }
    formatTime(hours) {
        if (hours < 1) {
            return `${Math.round(hours * 60)}m`;
        }
        const wholeHours = Math.floor(hours);
        const minutes = Math.round((hours - wholeHours) * 60);
        if (minutes === 0) {
            return `${wholeHours}h`;
        }
        return `${wholeHours}h ${minutes}m`;
    }
    parseTimeInput(timeStr) {
        const cleaned = timeStr.toLowerCase().trim();
        const hoursMinutesMatch = cleaned.match(/(\d+(?:\.\d+)?)h\s*(\d+(?:\.\d+)?)m/);
        if (hoursMinutesMatch) {
            const hours = parseFloat(hoursMinutesMatch[1]);
            const minutes = parseFloat(hoursMinutesMatch[2]);
            return hours + minutes / 60;
        }
        const hoursMatch = cleaned.match(/(\d+(?:\.\d+)?)h/);
        if (hoursMatch) {
            return parseFloat(hoursMatch[1]);
        }
        const minutesMatch = cleaned.match(/(\d+(?:\.\d+)?)m/);
        if (minutesMatch) {
            return parseFloat(minutesMatch[1]) / 60;
        }
        const decimal = parseFloat(cleaned);
        if (!isNaN(decimal)) {
            return decimal;
        }
        throw new Error('Invalid time format. Use formats like "2h 30m", "1.5h", or "90m"');
    }
};
exports.TimeTrackingService = TimeTrackingService;
exports.TimeTrackingService = TimeTrackingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(time_log_entity_1.TimeLog)),
    __param(1, (0, typeorm_1.InjectRepository)(issue_entity_1.Issue)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], TimeTrackingService);
//# sourceMappingURL=time-tracking.service.js.map