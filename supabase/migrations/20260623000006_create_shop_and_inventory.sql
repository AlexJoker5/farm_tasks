-- ============================================
-- Migration: Shop & Inventory
-- Implements the economy system where users can buy items with their currency
-- ============================================

-- 1. Shop Items Table (Global catalog)
create table public.shop_items (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  price integer not null check (price >= 0),
  item_type text not null check (item_type in ('DECORATION', 'SEED', 'THEME')),
  texture_key text not null, -- references the phaser texture (e.g. 'fountain', 'statue')
  created_at timestamptz default now()
);

-- Seed some initial shop items
insert into public.shop_items (name, description, price, item_type, texture_key) values
  ('Stone Fountain', 'A beautiful pixel-art water fountain.', 150, 'DECORATION', 'fountain'),
  ('Golden Statue', 'A shiny monument to productivity.', 500, 'DECORATION', 'golden_statue'),
  ('Wooden Bench', 'A place to rest in your garden.', 50, 'DECORATION', 'bench'),
  ('Cherry Blossom Seed', 'Grows into a rare pink tree.', 300, 'SEED', 'cherry_seed');

-- 2. Inventory Table (User's owned items)
create table public.inventory (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  item_id uuid references public.shop_items(id) on delete cascade not null,
  quantity integer default 1 check (quantity >= 1),
  acquired_at timestamptz default now(),
  
  -- Users have one row per item type, tracking quantity
  constraint unique_user_item unique (user_id, item_id)
);

-- Enable RLS
alter table public.shop_items enable row level security;
alter table public.inventory enable row level security;

-- Shop Items: Everyone can view the catalog
create policy "Anyone can view shop items"
  on shop_items for select
  using (true);

-- Inventory: Users can view their own inventory
create policy "Users can view own inventory"
  on inventory for select
  using (auth.uid() = user_id);

-- 3. Secure Purchase RPC Function
-- Handles currency deduction and inventory insertion in a single transaction
create or replace function public.purchase_item(p_item_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
  v_price integer;
  v_balance integer;
begin
  -- Get current user
  v_user_id := auth.uid();
  if v_user_id is null then
    return json_build_object('error', 'Not authenticated');
  end if;

  -- Get item price
  select price into v_price
  from public.shop_items
  where id = p_item_id;

  if not found then
    return json_build_object('error', 'Item not found');
  end if;

  -- Check user balance and lock row
  select currency_balance into v_balance
  from public.profiles
  where id = v_user_id
  for update;

  if v_balance < v_price then
    return json_build_object('error', 'Insufficient funds');
  end if;

  -- Deduct currency
  update public.profiles
  set currency_balance = currency_balance - v_price
  where id = v_user_id;

  -- Add to inventory (upsert)
  insert into public.inventory (user_id, item_id, quantity)
  values (v_user_id, p_item_id, 1)
  on conflict (user_id, item_id) 
  do update set quantity = inventory.quantity + 1;

  return json_build_object(
    'success', true,
    'new_balance', v_balance - v_price
  );
end;
$$;
