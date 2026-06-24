import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import DashboardClient from "@/components/DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch profile, goals, and world tree in parallel
  const [profileRes, goalsRes, worldTreeRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("world_trees").select("*").eq("user_id", user.id).single(),
  ]);

  const profile = profileRes.data;
  const goals = goalsRes.data ?? [];
  const worldTree = worldTreeRes.data;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Nav */}
      <nav className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)] bg-[var(--bg-primary)]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent-green)] to-[var(--accent-cyan)] flex items-center justify-center">
              <span className="text-sm">🌱</span>
            </div>
            <span className="pixel-text text-[10px] text-[var(--text-primary)]">
              Farm Tasks
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {/* Currency Display */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-default)]">
            <span className="text-sm">🪙</span>
            <span className="pixel-text-sm text-[var(--accent-amber)]">
              {profile?.currency_balance ?? 0}
            </span>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-purple)] to-[var(--accent-pink)] flex items-center justify-center">
              <span className="pixel-text text-[8px] text-white">
                {profile?.username?.charAt(0).toUpperCase() ?? "?"}
              </span>
            </div>
            <span className="text-sm text-[var(--text-secondary)] hidden sm:block">
              {profile?.username ?? "farmer"}
            </span>
          </div>

          {/* Logout */}
          <form action="/auth/signout" method="POST">
            <button
              type="submit"
              className="pixel-text-sm text-[var(--text-muted)] hover:text-red-400 transition-colors"
            >
              Logout
            </button>
          </form>
        </div>
      </nav>

      {/* Dashboard Content */}
      <DashboardClient
        goals={goals}
        worldTree={worldTree}
        username={profile?.username ?? "Farmer"}
        currencyBalance={profile?.currency_balance ?? 0}
      />
    </div>
  );
}
