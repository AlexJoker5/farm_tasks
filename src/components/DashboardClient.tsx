"use client";

import { useState } from "react";
import GoalCard from "@/components/GoalCard";
import CreateGoalForm from "@/components/CreateGoalForm";

interface Goal {
  id: string;
  title: string;
  description: string | null;
  goal_type: string;
  current_milestone: string;
  plant_state: string;
  completion_rate: number;
  total_tasks_expected: number;
  total_tasks_completed: number;
  start_date: string;
  end_date: string;
}

interface WorldTree {
  current_day: number;
  current_size: number;
  is_frozen: boolean;
}

interface DashboardClientProps {
  goals: Goal[];
  worldTree: WorldTree | null;
  username: string;
  currencyBalance: number;
  userId: string;
}

export default function DashboardClient({
  goals,
  worldTree,
  username,
  currencyBalance,
  userId,
}: DashboardClientProps) {
  const [showCreateGoal, setShowCreateGoal] = useState(false);

  const activeGoals = goals.filter((g) => g.plant_state === "GROWING");
  const completedGoals = goals.filter((g) => g.plant_state === "MATURE_STATE");

  return (
    <>
      {/* Main Content */}
      <main className="flex-1 px-6 py-8 max-w-6xl mx-auto w-full">
        {/* Welcome Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-in-up">
          <div>
            <h1 className="pixel-text text-xl gradient-text mb-2">
              Welcome, {username}!
            </h1>
            <p className="text-[var(--text-secondary)]">
              {activeGoals.length > 0
                ? `You have ${activeGoals.length} active goal${activeGoals.length > 1 ? "s" : ""} growing.`
                : "Plant your first seed to start growing."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/shop"
              className="btn-secondary flex items-center gap-2 border-[var(--accent-amber)]/30 hover:border-[var(--accent-amber)]"
            >
              <span>🏪</span>
              <span>Shop</span>
            </a>
            <a
              href="/garden"
              className="btn-secondary flex items-center gap-2"
            >
              <span>🌳</span>
              <span>My Garden</span>
            </a>
            <button
              onClick={() => setShowCreateGoal(true)}
              className="btn-primary"
            >
              🎯 New Goal
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div
            className="glass-card p-5 animate-fade-in-up delay-100"
            style={{ opacity: 0 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🌳</span>
              <h3 className="pixel-text-sm text-[var(--text-secondary)]">
                Active Goals
              </h3>
            </div>
            <p className="text-3xl font-bold text-[var(--text-primary)]">
              {activeGoals.length}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              {completedGoals.length} completed
            </p>
          </div>

          <div
            className="glass-card p-5 animate-fade-in-up delay-200"
            style={{ opacity: 0 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🌍</span>
              <h3 className="pixel-text-sm text-[var(--text-secondary)]">
                World Tree
              </h3>
            </div>
            <p className="text-3xl font-bold text-[var(--text-primary)]">
              Day {worldTree?.current_day ?? 1}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              {worldTree?.is_frozen
                ? "⚠️ Frozen — complete a task to unfreeze"
                : "365-day journey"}
            </p>
          </div>

          <div
            className="glass-card p-5 animate-fade-in-up delay-300"
            style={{ opacity: 0 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🪙</span>
              <h3 className="pixel-text-sm text-[var(--text-secondary)]">
                Currency
              </h3>
            </div>
            <p className="text-3xl font-bold text-[var(--accent-amber)]">
              {currencyBalance}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Earn by hitting milestones
            </p>
          </div>
        </div>

        {/* Active Goals */}
        {activeGoals.length > 0 && (
          <div className="mb-8">
            <h2 className="pixel-text text-sm text-[var(--text-primary)] mb-4">
              🌱 Active Goals
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeGoals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          </div>
        )}

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <div className="mb-8">
            <h2 className="pixel-text text-sm text-[var(--text-primary)] mb-4">
              🎉 Completed
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedGoals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {goals.length === 0 && (
          <div
            className="glass-card p-12 text-center animate-fade-in-up delay-400"
            style={{ opacity: 0 }}
          >
            <span className="text-6xl block mb-4">🌱</span>
            <h2 className="pixel-text text-sm text-[var(--text-primary)] mb-3">
              No goals yet
            </h2>
            <p className="text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
              Create your first goal to plant a seed. Complete daily tasks to
              watch it grow from a tiny seedling into a magnificent tree.
            </p>
            <button
              onClick={() => setShowCreateGoal(true)}
              className="btn-primary"
            >
              🎯 Create Your First Goal
            </button>
          </div>
        )}
      </main>

      {/* Create Goal Modal */}
      {showCreateGoal && (
        <CreateGoalForm onClose={() => setShowCreateGoal(false)} />
      )}
    </>
  );
}
