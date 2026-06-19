import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';

class AutoAssignTeamDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsUUID()
  @IsOptional()
  existingTeamId?: string;

  @IsArray()
  @IsUUID('all', { each: true })
  memberIds: string[];
}

export class AutoAssignDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AutoAssignTeamDto)
  teams: AutoAssignTeamDto[];
}
