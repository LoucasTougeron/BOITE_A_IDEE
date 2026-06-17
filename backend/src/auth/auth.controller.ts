import { Body, Controller, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Put('password')
  @UseGuards(AuthGuard)
  updatePassword(@Req() req: any, @Body() body: { password: string }) {
    return this.authService.updatePassword(req.user.id, body.password);
  }
}
