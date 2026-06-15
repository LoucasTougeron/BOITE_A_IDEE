import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@Req() req: any) {
    return this.usersService.getProfile(req.user.id);
  }

  @Put('me')
  updateMe(@Req() req: any, @Body() body: { specialty?: string; first_name?: string; last_name?: string }) {
    return this.usersService.updateProfile(req.user.id, body);
  }
}
