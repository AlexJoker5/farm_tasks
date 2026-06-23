-- ============================================
-- Migration: Create world_tree table
-- Account-level progression, decoupled from goals
-- ============================================

create table public.world_trees (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade unique not null,
  start_date date not null default current_date,
  current_day integer default 1,
  current_size real default 1.0,
  is_frozen boolean default false,
  last_harvest_month integer default 0,
  last_harvest_year integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.world_trees enable row level security;

create policy "Users can view own world tree"
  on world_trees for select
  using (auth.uid() = user_id);

create policy "Users can update own world tree"
  on world_trees for update
  using (auth.uid() = user_id);

create policy "Public can view world trees"
  on world_trees for select
  using (true);

-- Auto-create world tree when profile is created
create or replace function public.handle_new_world_tree()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.world_trees (user_id)
  values (new.id);
  return new;
end;
$$;

create trigger on_profile_created_world_tree
  after insert on public.profiles
  for each row execute function public.handle_new_world_tree();

-- Updated_at trigger
create trigger on_world_tree_updated
  before update on public.world_trees
  for each row execute function public.handle_updated_at();

-- Index
create index idx_world_trees_user_id on public.world_trees(user_id);
