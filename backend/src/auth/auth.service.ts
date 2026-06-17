import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { SignupDto } from './dto/signup.dto';

@Injectable()
export class AuthService {
  constructor(private supabase: SupabaseService) {}

  async signup(dto: SignupDto) {
    const { data, error } = await this.supabase.db.auth.signUp({
      email: dto.email,
      password: dto.password,
      options: {
        data: {
          first_name: dto.first_name,
          last_name: dto.last_name,
          promo: dto.promo,
          specialty: dto.specialty,
        },
      },
    });

    if (error) throw new BadRequestException(error.message);
    if (!data.user || !data.session) throw new BadRequestException('Signup failed');

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    };
  }

  async updatePassword(userId: string, password: string) {
    const { error } = await this.supabase.db.auth.admin.updateUserById(userId, { password });
    if (error) throw new InternalServerErrorException(error.message);
  }
}
