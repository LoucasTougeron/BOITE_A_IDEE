import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { BudgetService } from './budget.service';
import { CreateBudgetDto } from './dto/create-budget.dto';

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
  create(@Param('projectId') projectId: string, @Body() dto: CreateBudgetDto) {
    return this.budgetService.create(projectId, dto);
  }
}
