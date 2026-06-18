import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateBudgetDto } from './dto/create-budget.dto';

@Injectable()
export class BudgetService {
  constructor(private supabase: SupabaseService) {}

  async findAll(projectId: string) {
    const { data, error } = await this.supabase.db
      .from('budgets')
      .select('*')
      .eq('project_id', projectId);
    if (error) throw error;
    return data;
  }

  async create(projectId: string, entry: CreateBudgetDto) {
    const { data, error } = await this.supabase.db
      .from('budgets')
      .insert({ project_id: projectId, ...entry })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}
