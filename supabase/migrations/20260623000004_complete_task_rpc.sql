-- ============================================
-- Database function: complete_task RPC
-- Handles task completion + milestone advancement
-- Called via supabase.rpc('complete_task', ...)
-- ============================================

create or replace function public.complete_task(
  p_goal_id uuid,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer set search_path = ''
as $$
declare
  v_user_id uuid;
  v_goal record;
  v_new_completed integer;
  v_new_rate real;
  v_new_milestone public.milestone;
  v_task_id uuid;
  v_currency_earned integer := 0;
begin
  -- Get current user
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Fetch the goal
  select * into v_goal from public.goals where id = p_goal_id and user_id = v_user_id;
  if not found then
    raise exception 'Goal not found or not owned by user';
  end if;

  -- Check goal isn't already mature or withered
  if v_goal.plant_state in ('MATURE_STATE', 'WITHERED') then
    raise exception 'Goal plant is already in final state';
  end if;

  -- Insert the task
  insert into public.tasks (goal_id, user_id, notes)
  values (p_goal_id, v_user_id, p_notes)
  returning id into v_task_id;

  -- Calculate new completion rate
  v_new_completed := v_goal.total_tasks_completed + 1;
  if v_goal.total_tasks_expected > 0 then
    v_new_rate := v_new_completed::real / v_goal.total_tasks_expected::real;
  else
    v_new_rate := 1.0;
  end if;

  -- Clamp at 1.0
  if v_new_rate > 1.0 then
    v_new_rate := 1.0;
  end if;

  -- Calculate milestone based on completion rate
  if v_new_rate >= 0.75 then
    v_new_milestone := 'MATURE';
  elsif v_new_rate >= 0.50 then
    v_new_milestone := 'SAPLING';
  elsif v_new_rate >= 0.25 then
    v_new_milestone := 'SPROUT';
  else
    v_new_milestone := 'SEED';
  end if;

  -- Award currency for milestone transitions
  if v_new_milestone != v_goal.current_milestone then
    case v_new_milestone
      when 'SPROUT' then v_currency_earned := 10;
      when 'SAPLING' then v_currency_earned := 25;
      when 'MATURE' then v_currency_earned := 50;
      else v_currency_earned := 0;
    end case;

    -- Add currency to profile
    if v_currency_earned > 0 then
      update public.profiles
      set currency_balance = currency_balance + v_currency_earned
      where id = v_user_id;
    end if;
  end if;

  -- Update goal
  update public.goals
  set
    total_tasks_completed = v_new_completed,
    completion_rate = v_new_rate,
    current_milestone = v_new_milestone,
    plant_state = case
      when v_new_rate >= 1.0 then 'MATURE_STATE'::public.plant_state
      else 'GROWING'::public.plant_state
    end
  where id = p_goal_id;

  return jsonb_build_object(
    'task_id', v_task_id,
    'new_completed', v_new_completed,
    'completion_rate', v_new_rate,
    'milestone', v_new_milestone,
    'currency_earned', v_currency_earned
  );
end;
$$;
