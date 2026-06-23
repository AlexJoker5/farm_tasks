import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import GardenClient from "@/components/GardenClient";

export default async function GardenPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const supabase = await createClient();

  // Get current user to check ownership
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isOwner = user?.id === userId;

  // Fetch garden owner profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .single();

  if (!profile) {
    notFound();
  }

  // Fetch garden placements with goal data
  const { data: placements } = await supabase
    .from("garden_placements")
    .select(
      `
      id,
      grid_x,
      grid_y,
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

  // Transform for Phaser
  const plants = (placements ?? [])
    .filter((p: any) => p.goals)
    .map((p: any) => ({
      gridX: p.grid_x,
      gridY: p.grid_y,
      milestone: p.goals.current_milestone,
      title: p.goals.title,
      goalId: p.goals.id,
    }));

  // Fetch unplaced goals (for the owner's plant picker)
  let unplacedGoals: any[] = [];
  if (isOwner) {
    const placedGoalIds = plants.map((p: any) => p.goalId);

    const { data: goals } = await supabase
      .from("goals")
      .select("id, title, current_milestone, goal_type")
      .eq("user_id", userId)
      .in("current_milestone", ["SPROUT", "SAPLING", "MATURE"]);

    unplacedGoals = (goals ?? []).filter(
      (g: any) => !placedGoalIds.includes(g.id)
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)] bg-[var(--bg-primary)]/80 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link href={isOwner ? "/dashboard" : "/"} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent-green)] to-[var(--accent-cyan)] flex items-center justify-center">
              <span className="text-sm">🌱</span>
            </div>
            <span className="pixel-text text-[10px] text-[var(--text-primary)]">
              Farm Tasks
            </span>
          </Link>
          <span className="text-[var(--text-muted)]">→</span>
          <span className="pixel-text-sm text-[var(--text-secondary)]">
            {isOwner ? "My Garden" : `${profile.username}'s Garden`}
          </span>
        </div>

        {isOwner && (
          <Link href="/dashboard" className="btn-secondary !py-2 !px-4 !text-[0.5rem]">
            ← Dashboard
          </Link>
        )}
      </nav>

      {/* Garden Content */}
      <main className="flex-1 px-6 py-6 max-w-7xl mx-auto w-full">
        <GardenClient
          plants={plants}
          unplacedGoals={unplacedGoals}
          isOwner={isOwner}
          ownerName={profile.username}
        />
      </main>
    </div>
  );
}
