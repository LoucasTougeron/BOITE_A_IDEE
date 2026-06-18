export interface TeamMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  promo?: string;
  specialty?: string;
  affinityScore: number;
}

export interface ProposedTeam {
  name: string;
  members: TeamMember[];
  sharedProjects: string[];
}

export interface AutoGenerateResult {
  teams: ProposedTeam[];
  unassigned: Omit<TeamMember, 'affinityScore'>[];
  stats: {
    totalStudents: number;
    studentsWithPreferences: number;
    studentsWithoutPreferences: number;
    mode: 'affinity' | 'balanced';
  };
}

export interface StudentRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  promo?: string;
  specialty?: string;
}
