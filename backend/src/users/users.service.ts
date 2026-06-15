import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class UsersService {
  constructor(private supabase: SupabaseService) {}

  async getProfile(userId: string) {
    const { data, error } = await this.supabase.db
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  }

  async updateProfile(userId: string, updates: Record<string, any>) {
    const { data, error } = await this.supabase.db
      .from('profiles')
      .upsert({ id: userId, ...updates })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}
