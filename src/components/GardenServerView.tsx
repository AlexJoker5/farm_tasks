import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import GardenClient from "@/components/GardenClient";

export default async function GardenServerView({ targetUserId }: { targetUserId: string }) {
  const supabase = await createClient();

  // Get current user to check ownership
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isOwner = user?.id === targetUserId;

  // Fetch garden owner profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", targetUserId)
    .single();

  if (!profile) {
    notFound();
  }

  // Fetch current user's profile for username
  let currentUsername = "Visitor";
  if (user) {
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();
    currentUsername = currentProfile?.username ?? "Visitor";
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
    .eq("user_id", targetUserId);

  type PlacementWithGoal = {
    grid_x: number;
    grid_y: number;
    goals: {
      id: string;
      title: string;
      current_milestone: string;
    } | null;
  };

  type GoalData = {
    id: string;
    title: string;
    current_milestone: string;
    goal_type: string;
  };

  // Transform for Phaser
  const plants = (placements as unknown as PlacementWithGoal[] ?? [])
    .filter((p) => p.goals)
    .map((p) => ({
      gridX: p.grid_x,
      gridY: p.grid_y,
      milestone: p.goals!.current_milestone,
      title: p.goals!.title,
      goalId: p.goals!.id,
    }));

  // Fetch unplaced goals (for the owner's plant picker)
  let unplacedGoals: GoalData[] = [];
  if (isOwner) {
    const placedGoalIds = plants.map((p) => p.goalId);

    const { data: goals } = await supabase
      .from("goals")
      .select("id, title, current_milestone, goal_type")
      .eq("user_id", targetUserId)
      .in("current_milestone", ["SPROUT", "SAPLING", "MATURE"]);

    unplacedGoals = (goals as unknown as GoalData[] ?? []).filter(
      (g) => !placedGoalIds.includes(g.id)
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden relative bg-black">
      {/* Nav */}
      <nav className="absolute top-0 w-full z-40 flex items-center justify-between px-6 py-4 pointer-events-none">
        <div className="flex items-center gap-4 bg-[var(--bg-primary)]/60 backdrop-blur-md px-4 py-2 rounded-xl border border-[var(--border-default)] pointer-events-auto">
          <Link
            href={isOwner ? "/dashboard" : "/"}
            className="flex items-center gap-3"
          >
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
          <div className="pointer-events-auto">
            <Link
              href="/dashboard"
              className="btn-secondary !py-2 !px-4 !text-[0.5rem] bg-[var(--bg-primary)]/60 backdrop-blur-md border border-[var(--border-default)]"
            >
              ← Dashboard
            </Link>
          </div>
        )}
      </nav>

      {/* Garden Content */}
      <main className="absolute inset-0 z-10 w-full h-full pt-20 px-6 pb-6 pointer-events-none">
        <GardenClient
          plants={plants}
          unplacedGoals={unplacedGoals}
          isOwner={isOwner}
          ownerName={profile.username}
          gardenOwnerId={targetUserId}
          currentUserId={user?.id ?? null}
          currentUsername={currentUsername}
        />
      </main>
    </div>
  );
}
