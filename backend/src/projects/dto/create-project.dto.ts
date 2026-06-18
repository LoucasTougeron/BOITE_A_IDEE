import { IsArray, IsIn, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

const VALID_THEMES = ['Tech', 'Design', 'Business', 'Social', 'Science', 'Art'];
const VALID_STATUSES = ['idea', 'in_progress', 'completed'];

export class CreateProjectDto {
  @IsString()
  @MaxLength(100)
  title: string;

  @IsString()
  @MaxLength(2000)
  description: string;

  @IsString()
  @MaxLength(1000)
  objective: string;

  @IsString()
  @IsIn(VALID_THEMES)
  theme: string;

  @IsArray()
  @IsOptional()
  tags: string[];

  @IsUrl()
  @IsOptional()
  link?: string;

  @IsString()
  @IsOptional()
  file_url?: string;

  @IsString()
  @IsOptional()
  team_name?: string;

  @IsString()
  @IsOptional()
  specialty?: string;

  @IsString()
  @IsIn(VALID_STATUSES)
  @IsOptional()
  status?: string;
}
