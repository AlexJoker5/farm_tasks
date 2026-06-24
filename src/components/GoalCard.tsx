"use client";

import { completeTask, deleteGoal } from "@/app/actions/goals";
import { useState } from "react";

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

const MILESTONE_EMOJI: Record<string, string> = {
  SEED: "🌰",
  SPROUT: "🌱",
  SAPLING: "🌿",
  MATURE: "🌳",
};

const MILESTONE_LABELS: Record<string, string> = {
  SEED: "Seed",
  SPROUT: "Sprout",
  SAPLING: "Sapling",
  MATURE: "Mature",
};

const GOAL_TYPE_LABELS: Record<string, string> = {
  SHORT_TERM: "Short-term",
  MEDIUM_TERM: "Medium-term",
  LONG_TERM: "Long-term",
};

const GOAL_TYPE_COLORS: Record<string, string> = {
  SHORT_TERM: "var(--accent-green)",
  MEDIUM_TERM: "var(--accent-amber)",
  LONG_TERM: "var(--accent-purple)",
};

export default function GoalCard({ goal }: { goal: Goal }) {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [result, setResult] = useState<{
    currency_earned?: number;
    milestone?: string;
  } | null>(null);
  const [now] = useState(() => Date.now());

  const progressPercent = Math.round(goal.completion_rate * 100);
  const daysLeft = Math.max(
    0,
    Math.ceil(
      (new Date(goal.end_date).getTime() - now) / (1000 * 60 * 60 * 24)
    )
  );

  async function handleComplete() {
    setLoading(true);
    setResult(null);

    const res = await completeTask(goal.id);

    if (res.error) {
      alert(res.error);
      setLoading(false);
      return;
    }

    if (res.data) {
      setResult(res.data as { currency_earned?: number; milestone?: string });
    }
    setLoading(false);
  }

  async function handleDelete() {
    setDeleting(true);
    await deleteGoal(goal.id);
    setDeleting(false);
  }

  return (
    <div className="glass-card p-5 relative overflow-hidden group">
      {/* Goal type badge */}
      <div className="flex items-center justify-between mb-3">
        <span
          className="pixel-text-sm px-2 py-1 rounded-md"
          style={{
            color: GOAL_TYPE_COLORS[goal.goal_type],
            backgroundColor: `${GOAL_TYPE_COLORS[goal.goal_type]}15`,
            border: `1px solid ${GOAL_TYPE_COLORS[goal.goal_type]}30`,
          }}
        >
          {GOAL_TYPE_LABELS[goal.goal_type] ?? goal.goal_type}
        </span>

        {/* Delete button */}
        <div className="relative">
          {showConfirmDelete ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="pixel-text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                {deleting ? "..." : "Yes"}
              </button>
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="pixel-text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirmDelete(true)}
              className="text-[var(--text-muted)] hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-sm"
              title="Delete goal"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {/* Title + milestone */}
      <div className="flex items-start gap-3 mb-3">
        <span className="text-3xl" title={MILESTONE_LABELS[goal.current_milestone]}>
          {MILESTONE_EMOJI[goal.current_milestone] ?? "🌰"}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="text-[var(--text-primary)] font-semibold truncate">
            {goal.title}
          </h3>
          {goal.description && (
            <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">
              {goal.description}
            </p>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-[var(--text-secondary)]">
            {goal.total_tasks_completed}/{goal.total_tasks_expected} tasks
          </span>
          <span className="pixel-text-sm text-[var(--accent-green)]">
            {progressPercent}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progressPercent}%`,
              background: `linear-gradient(90deg, ${GOAL_TYPE_COLORS[goal.goal_type]}, var(--accent-cyan))`,
              boxShadow: `0 0 8px ${GOAL_TYPE_COLORS[goal.goal_type]}40`,
            }}
          />
        </div>
      </div>

      {/* Meta info */}
      <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-4">
        <span>
          {MILESTONE_LABELS[goal.current_milestone]} stage
        </span>
        <span>
          {daysLeft > 0 ? `${daysLeft} days left` : "Past due"}
        </span>
      </div>

      {/* Milestone transition notification */}
      {result && result.currency_earned && result.currency_earned > 0 && (
        <div className="mb-3 p-2 rounded-lg bg-[var(--accent-amber)]/10 border border-[var(--accent-amber)]/20 animate-fade-in">
          <p className="pixel-text-sm text-[var(--accent-amber)] text-center">
            🪙 +{result.currency_earned} coins! → {MILESTONE_EMOJI[result.milestone ?? ""] ?? ""}{" "}
            {MILESTONE_LABELS[result.milestone ?? ""] ?? ""}
          </p>
        </div>
      )}

      {/* Complete task button */}
      {goal.plant_state === "GROWING" && (
        <button
          onClick={handleComplete}
          disabled={loading}
          className="btn-primary w-full !py-2.5 !text-[0.55rem] disabled:opacity-50"
        >
          {loading ? (
            <span className="animate-pixel-blink">Completing...</span>
          ) : (
            "✅ Complete Today's Task"
          )}
        </button>
      )}

      {goal.plant_state === "MATURE_STATE" && (
        <div className="text-center p-2 rounded-lg bg-[var(--accent-green)]/10 border border-[var(--accent-green)]/20">
          <p className="pixel-text-sm text-[var(--accent-green)]">
            🎉 Goal Complete!
          </p>
        </div>
      )}
    </div>
  );
}
