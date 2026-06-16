export interface Project {
  id: string;
  title: string;
  description: string;
  objective: string;
  theme: string;
  tags: string[];
  link?: string;
  file_url?: string;
  team_name?: string;
  specialty?: string;
  status: string;
  creator_id: string;
  created_at: string;
  votes?: { count: number }[];
}

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'admin' | 'user';
  specialty?: string;
}

export interface BudgetEntry {
  id: string;
  project_id: string;
  type: string;
  amount: number;
  category: string;
  phase: 'build' | 'run';
  capex_opex: 'capex' | 'opex';
}
