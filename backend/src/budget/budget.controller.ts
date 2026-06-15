import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { BudgetService } from './budget.service';

@Controller('projects/:projectId/budget')
@UseGuards(AuthGuard, RolesGuard)
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Get()
  findAll(@Param('projectId') projectId: string) {
    return this.budgetService.findAll(projectId);
  }

  @Post()
  @Roles('admin')
  create(
    @Param('projectId') projectId: string,
    @Body() body: { type: string; amount: number; category: string; phase: 'build' | 'run'; capex_opex: 'capex' | 'opex' },
  ) {
    return this.budgetService.create(projectId, body);
  }
}
