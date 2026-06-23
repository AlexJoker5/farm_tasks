-- ============================================
-- Migration: Garden placements table
-- Stores where plants (from completed goals) are placed on the grid
-- ============================================

create table public.garden_placements (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  goal_id uuid references public.goals(id) on delete cascade not null,
  grid_x integer not null check (grid_x >= 0 and grid_x < 100),
  grid_y integer not null check (grid_y >= 0 and grid_y < 100),
  placed_at timestamptz default now(),

  -- One plant per grid cell per user
  constraint unique_cell_per_user unique (user_id, grid_x, grid_y),
  -- One placement per goal
  constraint unique_goal_placement unique (goal_id)
);

-- Enable RLS
alter table public.garden_placements enable row level security;

-- Anyone can view garden placements (for garden visiting)
create policy "Public can view garden placements"
  on garden_placements for select
  using (true);

-- Users can manage own placements
create policy "Users can manage own placements"
  on garden_placements for all
  using (auth.uid() = user_id);

-- Indexes
create index idx_placements_user_id on public.garden_placements(user_id);
create index idx_placements_grid on public.garden_placements(user_id, grid_x, grid_y);
