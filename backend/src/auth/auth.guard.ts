import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);
    if (!token) throw new UnauthorizedException();

    const { data, error } = await this.supabase.db.auth.getUser(token);
    if (error || !data.user) throw new UnauthorizedException();

    const { data: profile } = await this.supabase.db
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .single();

    request.user = {
      ...data.user,
      role: profile?.role ?? 'user',
    };
    return true;
  }

  private extractToken(request: any): string | null {
    const auth = request.headers['authorization'];
    if (!auth) return null;
    const [type, token] = auth.split(' ');
    return type === 'Bearer' ? token : null;
  }
}
