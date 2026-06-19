import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsIn, IsUUID, ValidateNested } from 'class-validator';

class RankingItemDto {
  @IsUUID()
  project_id: string;

  @IsIn([1, 2, 3])
  rank: number;
}

export class SaveTopProjectsDto {
  @IsArray()
  @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => RankingItemDto)
  rankings: RankingItemDto[];
}
