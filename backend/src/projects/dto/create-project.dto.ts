import { IsString, IsNumber, IsOptional } from 'class-validator'

export class CreateProjectDto {
  @IsString()
  name: string

  @IsString()
  key: string

  @IsOptional()
  @IsString()
  description?: string

  @IsNumber()
  leadId: number
}