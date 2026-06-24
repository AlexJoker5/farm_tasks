"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

import { RRule, rrulestr } from "rrule";

export interface CreateGoalPayload {
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  is_all_day: boolean;
  start_time?: string;
  end_time?: string;
  rrule_string?: string;
  project_type: 'SINGLE' | 'MULTIPLE';
  sub_tasks?: { title: string; start_time?: string; end_time?: string }[];
}

export async function createGoal(payload: CreateGoalPayload) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  if (!payload.title || !payload.end_date) {
    return { error: "Title and end date are required" };
  }

  let total_tasks_expected = 0;
  
  // Calculate total tasks expected using rrule
  let occurrences = 1; // Default to 1 for one-off tasks
  
  const startD = new Date(payload.start_date);
  const endD = new Date(payload.end_date);
  const days = Math.max(1, Math.ceil((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24)));
  
  if (payload.rrule_string) {
    try {
      const rule = rrulestr(payload.rrule_string);
      // For "Ends: Never", we cap the calculation at end_date
      occurrences = rule.between(startD, endD, true).length;
      if (occurrences === 0) occurrences = 1; // Failsafe
    } catch (e) {
      console.error("Invalid rrule", e);
      occurrences = days; // Fallback to days if invalid
    }
  } else {
    // If no rrule, it means 'Does not repeat', so it only has 1 occurrence
    occurrences = 1;
  }

  if (payload.project_type === 'MULTIPLE') {
    const numSubTasks = payload.sub_tasks?.length || 1;
    total_tasks_expected = occurrences * numSubTasks;
  } else {
    total_tasks_expected = occurrences;
  }

  // Insert Goal
  const { data: goalData, error: goalError } = await supabase
    .from("goals")
    .insert({
      user_id: user.id,
      title: payload.title,
      description: payload.description || null,
      start_date: payload.start_date,
      end_date: payload.end_date,
      is_all_day: payload.is_all_day,
      start_time: payload.start_time || null,
      end_time: payload.end_time || null,
      rrule_string: payload.rrule_string || null,
      project_type: payload.project_type,
      total_tasks_expected,
      goal_type: "SHORT_TERM", // placeholder
    })
    .select()
    .single();

  if (goalError) {
    return { error: goalError.message };
  }

  // Insert Sub-Tasks
  if (payload.project_type === 'MULTIPLE' && payload.sub_tasks && payload.sub_tasks.length > 0) {
    const subTasksToInsert = payload.sub_tasks.map(st => ({
      goal_id: goalData.id,
      title: st.title,
      start_time: st.start_time || null,
      end_time: st.end_time || null,
    }));
    
    const { error: subTasksError } = await supabase
      .from("sub_tasks")
      .insert(subTasksToInsert);

    if (subTasksError) {
      // Best effort cleanup if subtasks fail
      await supabase.from("goals").delete().eq("id", goalData.id);
      return { error: subTasksError.message };
    }
  }

  revalidatePath("/dashboard");
  return { data: goalData };
}

export async function completeTask(goalId: string, completedSubTaskIds: string[] = [], notes?: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data, error } = await supabase.rpc("complete_task", {
    p_goal_id: goalId,
    p_notes: notes || null,
    p_completed_sub_task_ids: completedSubTaskIds,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { data };
}

export async function deleteGoal(goalId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("goals")
    .delete()
    .eq("id", goalId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateGoalTime(goalId: string, isAllDay: boolean, startTime?: string, endTime?: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("goals")
    .update({
      is_all_day: isAllDay,
      start_time: startTime || null,
      end_time: endTime || null,
    })
    .eq("id", goalId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateSubTaskTime(subTaskId: string, isAllDay: boolean, startTime?: string, endTime?: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("sub_tasks")
    .update({
      start_time: !isAllDay ? (startTime || null) : null,
      end_time: !isAllDay ? (endTime || null) : null,
    })
    .eq("id", subTaskId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}
