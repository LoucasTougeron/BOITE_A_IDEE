import { Controller, Get, Post, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('teams')
@UseGuards(AuthGuard)
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  findAll() {
    return this.teamsService.findAll();
  }

  @Post()
  create(@Body() body: { name: string }, @Req() req: any) {
    return this.teamsService.create(body.name, req.user.id);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.teamsService.delete(id);
  }
}
