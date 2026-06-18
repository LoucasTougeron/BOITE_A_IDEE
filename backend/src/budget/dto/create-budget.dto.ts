import { IsIn, IsNumber, IsPositive, IsString } from 'class-validator';

export class CreateBudgetDto {
  @IsString()
  type: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  category: string;

  @IsIn(['build', 'run'])
  phase: 'build' | 'run';

  @IsIn(['capex', 'opex'])
  capex_opex: 'capex' | 'opex';
}
