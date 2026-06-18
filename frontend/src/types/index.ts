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
  dislikes?: { count: number }[];
  ai_score?: number | null;
  completeness_score?: number | null;
  score_reasoning?: string | null;
  score_updated_at?: string | null;
  final_score?: number;
}

export interface Team {
  id: string;
  name: string;
  created_at: string;
}

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'admin' | 'user';
  specialty?: string;
  promo?: string;
  team_id?: string;
  teams?: { name: string };
}

export interface UserTopProject {
  id: string;
  rank: number;
  project_id: string;
  projects: Project;
}

export interface AdminVote {
  id: string;
  created_at: string;
  users: {
    first_name: string;
    last_name: string;
    email: string;
    teams?: { name: string };
  };
  projects: {
    title: string;
    theme: string;
  };
}

export interface ProjectStat {
  project_id: string;
  title: string;
  theme: string;
  specialty: string;
  likes: number;
  topScore: number;
  top1Count: number;
  top2Count: number;
  top3Count: number;
}

export interface TeamStats {
  team_id: string;
  team_name: string;
  byLikes: ProjectStat[];
  byTopScore: ProjectStat[];
}

export interface Trophy {
  id: string;
  title: string;
  description: string;
  rarity: 'commun' | 'rare' | 'epique' | 'legendaire';
  progress: number;
  threshold: number;
  points: number;
  awarded_at?: string;
}

export interface RewardData {
  level: string;
  nextLevel: string;
  points: number;
  pointsForNextLevel: number;
  progressToNextLevel: number;
  stats: {
    ideaCount: number;
    votesGivenCount: number;
    totalLikes: number;
    participationCount: number;
    mostLikedProject: { title: string; likes: number } | null;
  };
  progress: Trophy[];
  earned: Trophy[];
  notifications?: {
    newTrophies?: Trophy[];
    levelChanged?: { level: string };
  };
}
