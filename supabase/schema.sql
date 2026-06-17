-- =====================
-- Teams (Classes)
-- =====================
create table public.teams (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamptz default now()
);

-- =====================
-- Users (liés à auth.users)
-- =====================
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  first_name text,
  last_name text,
  email text,
  role text not null default 'user' check (role in ('user', 'admin')),
  specialty text,
  team_id uuid references public.teams(id) on delete set null,
  points integer not null default 0,
  level text not null default 'Nouvel arrivant',
  created_at timestamptz default now()
);

-- Trigger pour créer automatiquement un utilisateur à l'inscription
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =====================
-- Projects
-- =====================
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text not null,
  objective text not null,
  theme text not null,
  tags text[] default '{}',
  link text,
  team_name text,
  specialty text,
  status text not null default 'idea' check (status in ('idea', 'in_progress', 'completed')),
  creator_id uuid references public.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =====================
-- Votes
-- =====================
create table public.votes (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique (project_id, user_id)
);

-- =====================
-- Budgets
-- =====================
create table public.budgets (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  type text not null,
  amount numeric(12, 2) not null,
  category text not null,
  phase text not null check (phase in ('build', 'run')),
  capex_opex text not null check (capex_opex in ('capex', 'opex')),
  created_at timestamptz default now()
);

-- =====================
-- RLS (Row Level Security)
-- =====================
alter table public.teams enable row level security;
alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.votes enable row level security;
alter table public.budgets enable row level security;

-- Teams: lecture publique, écriture admin
create policy "teams_select" on public.teams for select using (true);
create policy "teams_all" on public.teams for all using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- Users : lecture publique, modification uniquement par le propriétaire ou admin
create policy "users_select" on public.users for select using (true);
create policy "users_update" on public.users for update using (
  auth.uid() = id or 
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- Projects : lecture publique, création/modif/suppression pour authentifiés
create policy "projects_select" on public.projects for select using (true);
create policy "projects_insert" on public.projects for insert with check (auth.uid() is not null);
create policy "projects_update" on public.projects for update using (
  auth.uid() = creator_id or
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);
create policy "projects_delete" on public.projects for delete using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- Votes : lecture publique, vote uniquement authentifié
create policy "votes_select" on public.votes for select using (true);
create policy "votes_insert" on public.votes for insert with check (auth.uid() = user_id);
create policy "votes_delete" on public.votes for delete using (auth.uid() = user_id);

-- Budgets : lecture publique, écriture admin uniquement
create policy "budgets_select" on public.budgets for select using (true);
create policy "budgets_insert" on public.budgets for insert with check (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- =====================
-- Rewards / Trophées
-- =====================
create table public.reward_trophies (
  id uuid default gen_random_uuid() primary key,
  key text not null unique,
  title text not null,
  description text not null,
  category text not null check (category in ('ideas', 'votes', 'likes', 'participation')),
  threshold integer not null,
  rarity text not null check (rarity in ('commun', 'rare', 'epique', 'legendaire')),
  points integer not null,
  created_at timestamptz default now()
);

create table public.user_trophies (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  trophy_id uuid references public.reward_trophies(id) on delete cascade not null,
  awarded_at timestamptz default now(),
  unique (user_id, trophy_id)
);

create table public.rewards_participations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  status text not null check (status in ('won', 'lost')),
  prize text not null,
  entry_data jsonb,
  created_at timestamptz default now()
);

alter table public.reward_trophies enable row level security;
alter table public.user_trophies enable row level security;
alter table public.rewards_participations enable row level security;

create policy "reward_trophies_select" on public.reward_trophies for select using (true);
create policy "user_trophies_select" on public.user_trophies for select using (auth.uid() = user_id);
create policy "user_trophies_insert" on public.user_trophies for insert with check (auth.uid() = user_id);
create policy "user_trophies_delete" on public.user_trophies for delete using (false);
create policy "rewards_participations_select" on public.rewards_participations for select using (auth.uid() = user_id);
create policy "rewards_participations_insert" on public.rewards_participations for insert with check (auth.uid() = user_id);
create policy "rewards_participations_delete" on public.rewards_participations for delete using (false);
