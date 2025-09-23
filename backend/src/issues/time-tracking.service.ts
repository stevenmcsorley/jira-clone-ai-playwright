import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { TimeLog } from './entities/time-log.entity'
import { Issue } from './entities/issue.entity'
import { User } from '../users/entities/user.entity'
import { CreateTimeLogDto, UpdateTimeLogDto, TimeTrackingSummaryDto } from './dto/time-log.dto'

@Injectable()
export class TimeTrackingService {
  constructor(
    @InjectRepository(TimeLog)
    private timeLogsRepository: Repository<TimeLog>,
    @InjectRepository(Issue)
    private issuesRepository: Repository<Issue>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async logTime(createTimeLogDto: CreateTimeLogDto, userId: number): Promise<TimeLog> {
    const issue = await this.issuesRepository.findOne({
      where: { id: createTimeLogDto.issueId }
    })
    if (!issue) {
      throw new NotFoundException('Issue not found')
    }

    const user = await this.usersRepository.findOne({
      where: { id: userId }
    })
    if (!user) {
      throw new NotFoundException('User not found')
    }

    const timeLog = this.timeLogsRepository.create({
      ...createTimeLogDto,
      hours: createTimeLogDto.hours,
      issue,
      user,
      userId,
    })

    return this.timeLogsRepository.save(timeLog)
  }

  async getTimeLogsByIssue(issueId: number): Promise<TimeLog[]> {
    return this.timeLogsRepository.find({
      where: { issueId },
      relations: ['user'],
      order: { hours: 'DESC', createdAt: 'DESC' }
    })
  }

  async getTimeTrackingSummary(issueId: number): Promise<TimeTrackingSummaryDto> {
    const timeLogs = await this.timeLogsRepository.find({
      where: { issueId },
      relations: ['user'],
      order: { createdAt: 'DESC' }
    })

    const totalTimeSpent = timeLogs.reduce((sum, log) => sum + log.hours, 0)

    const timeSpentByUser = timeLogs.reduce((acc, log) => {
      const existing = acc.find(item => item.userId === log.userId)
      if (existing) {
        existing.hours += log.hours
      } else {
        acc.push({
          userId: log.userId,
          userName: log.user.name,
          hours: log.hours
        })
      }
      return acc
    }, [] as Array<{ userId: number; userName: string; hours: number }>)

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
    }))

    return {
      totalTimeSpent,
      originalEstimate: 0, // TODO: Get from issue estimate
      remainingEstimate: 0, // TODO: Calculate based on estimate - timeSpent
      timeSpentByUser,
      recentTimeLogs
    }
  }

  async findOne(id: number): Promise<TimeLog> {
    const timeLog = await this.timeLogsRepository.findOne({
      where: { id },
      relations: ['user', 'issue']
    })

    if (!timeLog) {
      throw new NotFoundException('Time log not found')
    }

    return timeLog
  }

  async updateTimeLog(id: number, updateTimeLogDto: UpdateTimeLogDto, userId: number): Promise<TimeLog> {
    const timeLog = await this.findOne(id)

    if (timeLog.userId !== userId) {
      throw new NotFoundException('You can only edit your own time logs')
    }

    if (updateTimeLogDto.date) {
      timeLog.date = new Date(updateTimeLogDto.date)
    }

    Object.assign(timeLog, updateTimeLogDto)

    return this.timeLogsRepository.save(timeLog)
  }

  async deleteTimeLog(id: number, userId: number): Promise<void> {
    const timeLog = await this.findOne(id)

    if (timeLog.userId !== userId) {
      throw new NotFoundException('You can only delete your own time logs')
    }

    await this.timeLogsRepository.remove(timeLog)
  }

  formatTime(hours: number): string {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`
    }
    const wholeHours = Math.floor(hours)
    const minutes = Math.round((hours - wholeHours) * 60)

    if (minutes === 0) {
      return `${wholeHours}h`
    }
    return `${wholeHours}h ${minutes}m`
  }

  parseTimeInput(timeStr: string): number {
    // Parse formats like "2h 30m", "1.5h", "90m", "2h", "30m"
    const cleaned = timeStr.toLowerCase().trim()

    // Match patterns like "2h 30m" or "2h30m"
    const hoursMinutesMatch = cleaned.match(/(\d+(?:\.\d+)?)h\s*(\d+(?:\.\d+)?)m/)
    if (hoursMinutesMatch) {
      const hours = parseFloat(hoursMinutesMatch[1])
      const minutes = parseFloat(hoursMinutesMatch[2])
      return hours + minutes / 60
    }

    // Match hours only like "2h" or "1.5h"
    const hoursMatch = cleaned.match(/(\d+(?:\.\d+)?)h/)
    if (hoursMatch) {
      return parseFloat(hoursMatch[1])
    }

    // Match minutes only like "30m" or "90m"
    const minutesMatch = cleaned.match(/(\d+(?:\.\d+)?)m/)
    if (minutesMatch) {
      return parseFloat(minutesMatch[1]) / 60
    }

    // Try to parse as decimal hours
    const decimal = parseFloat(cleaned)
    if (!isNaN(decimal)) {
      return decimal
    }

    throw new Error('Invalid time format. Use formats like "2h 30m", "1.5h", or "90m"')
  }
}