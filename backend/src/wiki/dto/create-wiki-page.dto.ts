import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class CreateWikiPageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string

  @IsOptional()
  @IsString()
  @MaxLength(200)
  slug?: string

  @IsOptional()
  @IsString()
  content?: string
}

export class UpdateWikiPageDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string

  @IsOptional()
  @IsString()
  @MaxLength(200)
  slug?: string

  @IsOptional()
  @IsString()
  content?: string
}
