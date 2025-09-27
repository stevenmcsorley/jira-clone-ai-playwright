import { IsNumber, IsString, IsOptional, IsDateString, Min, Max } from 'class-validator'

export class CreateTimeLogDto {
  @IsNumber()
  @Min(0.1) // Minimum 6 minutes (0.1 hours)
  @Max(24) // Maximum 24 hours per day
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
  @Min(0.1) // Minimum 6 minutes (0.1 hours)
  @Max(24) // Maximum 24 hours per day
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