"use client";

import { createGoal } from "@/app/actions/goals";
import { useState } from "react";

interface CreateGoalFormProps {
  onClose: () => void;
}

export default function CreateGoalForm({ onClose }: CreateGoalFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Default end date: 30 days from now
  const defaultEnd = new Date();
  defaultEnd.setDate(defaultEnd.getDate() + 30);
  const defaultEndStr = defaultEnd.toISOString().split("T")[0];

  // Min date: tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDateStr = tomorrow.toISOString().split("T")[0];

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const result = await createGoal(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative glass-card p-8 w-full max-w-lg animate-fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="pixel-text text-sm gradient-text">🌱 New Goal</h2>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors text-xl"
          >
            ✕
          </button>
        </div>

        <form action={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="goal-title"
              className="block pixel-text-sm text-[var(--text-secondary)] mb-2"
            >
              Goal Title
            </label>
            <input
              id="goal-title"
              name="title"
              type="text"
              placeholder="Learn TypeScript"
              required
              maxLength={100}
              className="w-full px-4 py-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-green)] focus:ring-1 focus:ring-[var(--accent-green)]/30 transition-all"
            />
          </div>

          <div>
            <label
              htmlFor="goal-description"
              className="block pixel-text-sm text-[var(--text-secondary)] mb-2"
            >
              Description (optional)
            </label>
            <textarea
              id="goal-description"
              name="description"
              placeholder="Study one chapter per day..."
              rows={3}
              maxLength={500}
              className="w-full px-4 py-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-green)] focus:ring-1 focus:ring-[var(--accent-green)]/30 transition-all resize-none"
            />
          </div>

          <div>
            <label
              htmlFor="goal-end-date"
              className="block pixel-text-sm text-[var(--text-secondary)] mb-2"
            >
              Target Date
            </label>
            <input
              id="goal-end-date"
              name="end_date"
              type="date"
              required
              min={minDateStr}
              defaultValue={defaultEndStr}
              className="w-full px-4 py-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-green)] focus:ring-1 focus:ring-[var(--accent-green)]/30 transition-all"
            />
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              &lt;30 days = flower · 1–6 months = tree · 6+ months = grand tree
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1 !py-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 !py-3 disabled:opacity-50"
            >
              {loading ? (
                <span className="animate-pixel-blink">Planting...</span>
              ) : (
                "🌱 Plant Seed"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
