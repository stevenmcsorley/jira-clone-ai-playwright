import { IsNumber, IsString, IsOptional, IsDateString } from 'class-validator'

export class CreateTimeLogDto {
  @IsNumber()
  hours: number

  @IsString()
  @IsOptional()
  description?: string

  @IsDateString()
  date: string

  @IsNumber()
  issueId: number
}

export class UpdateTimeLogDto {
  @IsNumber()
  @IsOptional()
  hours?: number

  @IsString()
  @IsOptional()
  description?: string

  @IsDateString()
  @IsOptional()
  date?: string
}

export class TimeLogResponseDto {
  id: number
  hours: number
  description?: string
  date: Date
  issueId: number
  userId: number
  createdAt: Date
  user: {
    id: number
    name: string
    email: string
  }
}

export class TimeTrackingSummaryDto {
  totalTimeSpent: number
  originalEstimate?: number
  remainingEstimate?: number
  timeSpentByUser: Array<{
    userId: number
    userName: string
    hours: number
  }>
  recentTimeLogs: TimeLogResponseDto[]
}