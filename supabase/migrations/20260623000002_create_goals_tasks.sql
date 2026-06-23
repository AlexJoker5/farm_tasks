-- ============================================
-- Migration: Create goals and tasks tables
-- Core productivity loop: goals → tasks → milestones
-- ============================================

-- Enums for goal system
create type goal_type as enum ('SHORT_TERM', 'MEDIUM_TERM', 'LONG_TERM');
create type milestone as enum ('SEED', 'SPROUT', 'SAPLING', 'MATURE');
create type plant_state as enum ('GROWING', 'STANDARD', 'MATURE_STATE', 'LIGHTENED', 'WITHERED');

-- Goals table
create table public.goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  goal_type goal_type not null,
  seed_type text default 'default',
  start_date date not null default current_date,
  end_date date not null,
  current_milestone milestone default 'SEED',
  plant_state plant_state default 'GROWING',
  completion_rate real default 0.0,
  total_tasks_expected integer default 0,
  total_tasks_completed integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  constraint valid_dates check (end_date > start_date)
);

-- Tasks table (daily completions)
create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  goal_id uuid references public.goals(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  completed_at timestamptz default now(),
  notes text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.goals enable row level security;
alter table public.tasks enable row level security;

-- Goals RLS: owners can manage, anyone can view (for garden visitors)
create policy "Users can manage own goals"
  on goals for all
  using (auth.uid() = user_id);

create policy "Public can view goals"
  on goals for select
  using (true);

-- Tasks RLS: owners only
create policy "Users can manage own tasks"
  on tasks for all
  using (auth.uid() = user_id);

create policy "Public can view tasks"
  on tasks for select
  using (true);

-- Auto-calculate goal_type based on date range
create or replace function public.calculate_goal_type(p_start date, p_end date)
returns goal_type
language plpgsql
as $$
declare
  days_diff integer;
begin
  days_diff := p_end - p_start;
  if days_diff < 30 then
    return 'SHORT_TERM';
  elsif days_diff <= 180 then
    return 'MEDIUM_TERM';
  else
    return 'LONG_TERM';
  end if;
end;
$$;

-- Auto-calculate total expected tasks (one per day)
create or replace function public.set_goal_defaults()
returns trigger
language plpgsql
as $$
begin
  -- Auto-set goal_type from dates
  new.goal_type := public.calculate_goal_type(new.start_date, new.end_date);
  -- Expected tasks = number of days in the goal
  new.total_tasks_expected := new.end_date - new.start_date;
  return new;
end;
$$;

create trigger on_goal_insert
  before insert on public.goals
  for each row execute function public.set_goal_defaults();

-- Updated_at trigger for goals
create trigger on_goal_updated
  before update on public.goals
  for each row execute function public.handle_updated_at();

-- Index for faster lookups
create index idx_goals_user_id on public.goals(user_id);
create index idx_tasks_goal_id on public.tasks(goal_id);
create index idx_tasks_user_id on public.tasks(user_id);
