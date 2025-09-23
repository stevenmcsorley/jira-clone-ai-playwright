import { BaseApiService } from './base.service'

export interface TimeLog {
  id: number
  hours: number // Changed from timeSpent to match backend
  description?: string
  date: string // Changed from workDate to match backend
  issueId: number
  userId: number
  createdAt: string
  user: {
    id: number
    name: string
    email: string
  }
}

export interface CreateTimeLogRequest {
  hours: number // Changed from timeSpent to match backend
  description?: string
  date: string // Changed from workDate to match backend
  issueId: number
}

export interface UpdateTimeLogRequest {
  hours?: number // Changed from timeSpent to match backend
  description?: string
  date?: string // Changed from workDate to match backend
}

export interface TimeTrackingSummary {
  totalTimeSpent: number
  originalEstimate?: number
  remainingEstimate?: number
  timeSpentByUser: Array<{
    userId: number
    userName: string
    hours: number // Changed from timeSpent to match backend
  }>
  recentTimeLogs: TimeLog[]
}

export class TimeTrackingService extends BaseApiService {
  static async logTime(data: CreateTimeLogRequest): Promise<TimeLog> {
    return this.post<TimeLog>('/time-tracking/log', data)
  }

  static async getTimeLogsByIssue(issueId: number): Promise<TimeLog[]> {
    return this.get<TimeLog[]>(`/time-tracking/issue/${issueId}`)
  }

  static async getTimeTrackingSummary(issueId: number): Promise<TimeTrackingSummary> {
    return this.get<TimeTrackingSummary>(`/time-tracking/issue/${issueId}/summary`)
  }

  static async getTimeLogById(id: number): Promise<TimeLog> {
    return this.get<TimeLog>(`/time-tracking/log/${id}`)
  }

  static async updateTimeLog(id: number, data: UpdateTimeLogRequest): Promise<TimeLog> {
    return this.patch<TimeLog>(`/time-tracking/log/${id}`, data)
  }

  static async deleteTimeLog(id: number): Promise<void> {
    return this.delete<void>(`/time-tracking/log/${id}`)
  }

  static async parseTimeInput(timeStr: string): Promise<{ hours?: number; formatted?: string; error?: string }> {
    return this.post<{ hours?: number; formatted?: string; error?: string }>('/time-tracking/parse-time', { timeStr })
  }

  static formatTime(hours: number): string {
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

  static parseTimeInput_client(timeStr: string): number {
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