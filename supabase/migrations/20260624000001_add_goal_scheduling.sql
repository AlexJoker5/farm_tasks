-- ============================================
-- Migration: Add scheduling and multiple to-do goals
-- ============================================

-- 1. Wipe all goals and tasks (clean slate as requested)
DELETE FROM public.tasks;
DELETE FROM public.goals;

-- 2. Modify `goals` table
ALTER TABLE public.goals
  ADD COLUMN is_all_day boolean DEFAULT true,
  ADD COLUMN start_time time,
  ADD COLUMN end_time time,
  ADD COLUMN rrule_string text,
  ADD COLUMN project_type text DEFAULT 'SINGLE' CHECK (project_type IN ('SINGLE', 'MULTIPLE'));

-- 3. Update `set_goal_defaults` trigger to NOT overwrite `total_tasks_expected` if explicitly set
CREATE OR REPLACE FUNCTION public.set_goal_defaults()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Auto-set goal_type from dates
  NEW.goal_type := public.calculate_goal_type(NEW.start_date, NEW.end_date);
  
  -- If rrule is null and total_tasks_expected is 0, default to days difference
  IF NEW.rrule_string IS NULL AND NEW.total_tasks_expected = 0 THEN
    NEW.total_tasks_expected := NEW.end_date - NEW.start_date;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 4. Create `sub_tasks` table for "Multiple to-do goals"
CREATE TABLE public.sub_tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id uuid REFERENCES public.goals(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  start_time time,
  end_time time,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for sub_tasks
ALTER TABLE public.sub_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sub_tasks"
  ON public.sub_tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.goals
      WHERE goals.id = sub_tasks.goal_id
      AND goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view sub_tasks"
  ON public.sub_tasks FOR SELECT
  USING (true);

-- 5. Add completed sub-tasks array to daily tasks completion record
ALTER TABLE public.tasks
  ADD COLUMN completed_sub_task_ids jsonb DEFAULT '[]'::jsonb;
