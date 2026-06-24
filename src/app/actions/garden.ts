"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function placePlant(goalId: string, gridX: number, gridY: number) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Validate grid bounds
  if (gridX < 0 || gridX >= 20 || gridY < 0 || gridY >= 20) {
    return { error: "Invalid grid position" };
  }

  // Check goal belongs to user and has reached at least SPROUT milestone
  const { data: goal, error: goalError } = await supabase
    .from("goals")
    .select("id, current_milestone, user_id")
    .eq("id", goalId)
    .eq("user_id", user.id)
    .single();

  if (goalError || !goal) {
    return { error: "Goal not found" };
  }

  if (goal.current_milestone === "SEED") {
    return { error: "Goal must reach at least SPROUT stage to place in garden" };
  }

  // Check if goal already placed
  const { data: existing } = await supabase
    .from("garden_placements")
    .select("id")
    .eq("goal_id", goalId)
    .single();

  if (existing) {
    return { error: "This goal is already placed in your garden" };
  }

  // Place the plant
  const { error } = await supabase.from("garden_placements").insert({
    user_id: user.id,
    goal_id: goalId,
    grid_x: gridX,
    grid_y: gridY,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "This grid cell is already occupied" };
    }
    return { error: error.message };
  }

  revalidatePath(`/garden/${user.id}`);
  return { success: true };
}

export async function getGardenData(userId: string) {
  const supabase = await createClient();

  // Fetch placements with goal data
  const { data, error } = await supabase
    .from("garden_placements")
    .select(
      `
      id,
      grid_x,
      grid_y,
      placed_at,
      goals (
        id,
        title,
        goal_type,
        current_milestone,
        plant_state,
        completion_rate
      )
    `
    )
    .eq("user_id", userId);

  if (error) {
    return { error: error.message, data: null };
  }

  return { data, error: null };
}
