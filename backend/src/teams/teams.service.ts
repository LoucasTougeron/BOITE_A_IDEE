import { Injectable, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class TeamsService {
  constructor(private supabase: SupabaseService) {}

  async findAll() {
    const { data, error } = await this.supabase.db
      .from('teams')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async create(name: string, userId: string) {
    // Check if user is admin is done by RLS, but we can also do it here if needed
    const { data, error } = await this.supabase.db
      .from('teams')
      .insert({ name })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async delete(id: string) {
    const { data, error } = await this.supabase.db
      .from('teams')
      .delete()
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}
