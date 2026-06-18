import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { TeamsService } from './teams.service';

@Controller('teams')
@UseGuards(AuthGuard)
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  @Roles('admin')
  @UseGuards(RolesGuard)
  findAll() {
    return this.teamsService.findAll();
  }

  @Post()
  @Roles('admin')
  @UseGuards(RolesGuard)
  create(@Body() body: { name: string }, @Req() req: any) {
    return this.teamsService.create(body.name, req.user.id);
  }

  @Delete(':id')
  @Roles('admin')
  @UseGuards(RolesGuard)
  delete(@Param('id') id: string) {
    return this.teamsService.delete(id);
  }

  @Post('auto-generate')
  @Roles('admin')
  @UseGuards(RolesGuard)
  autoGenerate(@Body() body: { teamSize: number; filterPromo?: string; filterSpecialty?: string }) {
    return this.teamsService.autoGenerate(body.teamSize ?? 4, body.filterPromo, body.filterSpecialty);
  }

  @Post('auto-assign')
  @Roles('admin')
  @UseGuards(RolesGuard)
  autoAssign(@Body() body: { teams: { name?: string; existingTeamId?: string; memberIds: string[] }[] }) {
    return this.teamsService.autoAssign(body.teams);
  }
}
