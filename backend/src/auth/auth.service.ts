import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { LoginDto } from './dto/login.dto';
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

    const profile = await this.fetchProfile(data.user.id);

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: profile,
    };
  }

  async login(dto: LoginDto) {
    const { data, error } = await this.supabase.db.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (error || !data.session) throw new UnauthorizedException('Email ou mot de passe incorrect');

    const profile = await this.fetchProfile(data.user.id);

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: profile,
    };
  }

  private async fetchProfile(userId: string) {
    const { data, error } = await this.supabase.db
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) throw new NotFoundException('Profil introuvable');
    return data;
  }
}
