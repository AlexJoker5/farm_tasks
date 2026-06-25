"use client";

import { completeTask, deleteGoal, updateGoalTime, updateSubTaskTime } from "@/app/actions/goals";
import { useState, useEffect } from "react";
import EditGoalModal from "./EditGoalModal";

export interface SubTask {
  id: string;
  title: string;
  start_time: string | null;
  end_time: string | null;
}

export interface TaskCompletion {
  id: string;
  completed_sub_task_ids: string[];
  created_at: string; // UTC string from DB
}

export interface Goal {
  id: string;
  title: string;
  description: string | null;
  goal_type: string;
  project_type: 'SINGLE' | 'MULTIPLE';
  current_milestone: string;
  plant_state: string;
  completion_rate: number;
  total_tasks_expected: number;
  total_tasks_completed: number;
  start_date: string;
  end_date: string;
  is_all_day: boolean;
  start_time: string | null;
  end_time: string | null;
  rrule_string: string | null;
  sub_tasks?: SubTask[];
  tasks?: TaskCompletion[];
  asset_url?: string | null;
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

const GOAL_TYPE_COLORS: Record<string, string> = {
  SHORT_TERM: "var(--accent-green)",
  MEDIUM_TERM: "var(--accent-amber)",
  LONG_TERM: "var(--accent-purple)",
};

function getMatureEmoji(rate: number) {
  if (rate >= 0.9) return "🌳";
  if (rate >= 0.6) return "🌲";
  return "🍂";
}

// Helper to check if a specific time string "HH:mm" + 30 min grace period is currently active
function getTimeWindowStatus(isAllDay: boolean, startTimeStr: string | null, endTimeStr: string | null, now: Date) {
  if (isAllDay || !startTimeStr || !endTimeStr) {
    return { isAvailable: true, message: null };
  }

  const [startH, startM] = startTimeStr.split(':').map(Number);
  const [endH, endM] = endTimeStr.split(':').map(Number);

  const start = new Date(now);
  start.setHours(startH, startM, 0, 0);

  const end = new Date(now);
  end.setHours(endH, endM, 0, 0);
  // Add 30 minutes grace period
  end.setMinutes(end.getMinutes() + 30);

  if (now < start) {
    return { isAvailable: false, message: `Available at ${startTimeStr}` };
  }
  if (now > end) {
    return { isAvailable: false, message: "Missed window" };
  }

  return { isAvailable: true, message: null };
}

// Checks if a task completion timestamp is from the user's local "today"
function isCompletedTodayLocal(utcDateString: string, now: Date) {
  const d = new Date(utcDateString);
  return d.getDate() === now.getDate() && 
         d.getMonth() === now.getMonth() && 
         d.getFullYear() === now.getFullYear();
}

export default function GoalCard({ goal }: { goal: Goal }) {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [result, setResult] = useState<{
    currency_earned?: number;
    milestone?: string;
  } | null>(null);

  const [now, setNow] = useState(new Date());

  const [showEditModal, setShowEditModal] = useState(false);

  // Update "now" every minute so time windows unlock dynamically without refresh
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const todaysTask = goal.tasks?.find(t => isCompletedTodayLocal(t.created_at, now));
  const alreadyCompletedSubTasks = todaysTask?.completed_sub_task_ids || [];

  const [selectedSubTasks, setSelectedSubTasks] = useState<string[]>([]);

  const isMultiple = goal.project_type === 'MULTIPLE';
  const progressPercent = Math.round(goal.completion_rate * 100);
  
  const displayEmoji = goal.current_milestone === 'MATURE' 
    ? getMatureEmoji(goal.completion_rate)
    : (MILESTONE_EMOJI[goal.current_milestone] ?? "🌰");

  const singleTaskStatus = getTimeWindowStatus(goal.is_all_day, goal.start_time, goal.end_time, now);

  function handleToggleSubTask(id: string) {
    if (selectedSubTasks.includes(id)) {
      setSelectedSubTasks(selectedSubTasks.filter(x => x !== id));
    } else {
      setSelectedSubTasks([...selectedSubTasks, id]);
    }
  }

  async function handleComplete() {
    if (isMultiple && selectedSubTasks.length === 0) {
      alert("Please select at least one task to complete today!");
      return;
    }

    setLoading(true);
    setResult(null);

    const finalSelected = isMultiple ? Array.from(new Set([...alreadyCompletedSubTasks, ...selectedSubTasks])) : [];

    const res = await completeTask(goal.id, finalSelected);

    if (res.error) {
      alert(res.error);
      setLoading(false);
      return;
    }

    if (res.data) {
      setResult(res.data as { currency_earned?: number; milestone?: string });
      setSelectedSubTasks([]);
      // We also update local 'now' just to trigger a re-render
      setNow(new Date());
    }
    setLoading(false);
  }

  async function handleDelete() {
    setDeleting(true);
    await deleteGoal(goal.id);
    setDeleting(false);
  }

  async function handleSaveSingleTime(isAllDay: boolean, start: string, end: string) {
    const res = await updateGoalTime(goal.id, isAllDay, start, end);
    if (!res.error) setShowEditModal(false);
    else alert(res.error);
  }

  async function handleSaveMultipleTime(subTaskUpdates: { id: string, isAllDay: boolean, start: string, end: string }[]) {
    // Save all sequentially
    for (const update of subTaskUpdates) {
      const res = await updateSubTaskTime(update.id, update.isAllDay, update.start, update.end);
      if (res.error) {
        alert(res.error);
        return;
      }
    }
    setShowEditModal(false);
  }

  const hasUnsavedProgress = selectedSubTasks.length > 0;
  const isFullyCompletedToday = isMultiple 
    ? goal.sub_tasks?.length === alreadyCompletedSubTasks.length
    : todaysTask != null;

  return (
    <>
      <div className="glass-card p-5 relative overflow-hidden group">
        <div className="flex items-center justify-between mb-3">
          <span
            className="pixel-text-sm px-2 py-1 rounded-md"
            style={{
              color: GOAL_TYPE_COLORS[goal.goal_type],
              backgroundColor: `${GOAL_TYPE_COLORS[goal.goal_type]}15`,
              border: `1px solid ${GOAL_TYPE_COLORS[goal.goal_type]}30`,
            }}
          >
            {isMultiple ? "Project" : "Single Task"}
          </span>

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
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="text-[var(--text-muted)] hover:text-[var(--accent-green)] transition-colors opacity-0 group-hover:opacity-100 text-sm"
                  title="Edit goal"
                >
                  ✏️
                </button>
                <button
                  onClick={() => setShowConfirmDelete(true)}
                  className="text-[var(--text-muted)] hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-sm"
                  title="Delete goal"
                >
                  🗑️
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3 mb-3">
          {goal.asset_url ? (
            <img src={goal.asset_url} alt="Tree" className="w-10 h-10 object-contain" style={{ imageRendering: 'pixelated' }} />
          ) : (
            <span className="text-3xl" title={MILESTONE_LABELS[goal.current_milestone]}>
              {displayEmoji}
            </span>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-[var(--text-primary)] font-semibold truncate">
              {goal.title}
            </h3>
            {goal.description && (
              <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">
                {goal.description}
              </p>
            )}

            {!isMultiple && goal.plant_state === "GROWING" && (
              <div className="mt-2 min-h-[24px]">
                <p className="text-[10px] text-[var(--accent-amber)]">
                  {goal.is_all_day ? "🕒 All Day" : `🕒 ${goal.start_time?.slice(0, 5)} ${goal.end_time ? `- ${goal.end_time.slice(0, 5)}` : ''}`}
                  {!goal.is_all_day && !singleTaskStatus.isAvailable && !isFullyCompletedToday && ` (${singleTaskStatus.message})`}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[var(--text-secondary)]">
              {goal.total_tasks_completed}/{goal.total_tasks_expected} completions
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

        {isMultiple && goal.sub_tasks && goal.sub_tasks.length > 0 && goal.plant_state === "GROWING" && (
          <div className="mb-4 space-y-2 bg-[var(--bg-secondary)]/30 p-3 rounded-lg border border-[var(--border-default)]">
            <p className="text-xs text-[var(--text-muted)] mb-2 uppercase tracking-wider font-semibold">Today&apos;s Tasks</p>
            {goal.sub_tasks.map((st) => {
              const isAlreadyDone = alreadyCompletedSubTasks.includes(st.id);
              const isJustSelected = selectedSubTasks.includes(st.id);
              const isAllDay = st.start_time == null;
              const status = getTimeWindowStatus(isAllDay, st.start_time, st.end_time, now);
              const isDisabled = isAlreadyDone || loading || !status.isAvailable;
              
              return (
                <div key={st.id} className={`flex items-start gap-3 ${isDisabled && !isAlreadyDone ? 'cursor-not-allowed opacity-60' : ''} mb-2`}>
                  <div className="mt-0.5">
                    <input
                      type="checkbox"
                      checked={isAlreadyDone || isJustSelected}
                      disabled={isDisabled}
                      onChange={() => handleToggleSubTask(st.id)}
                      className="w-4 h-4 rounded border-[var(--border-default)] text-[var(--accent-green)] focus:ring-[var(--accent-green)] bg-[var(--bg-primary)] disabled:opacity-50 cursor-pointer"
                    />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm transition-colors ${isAlreadyDone ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}`}>
                      {st.title}
                    </p>
                    <p className={`text-[10px] ${isAlreadyDone ? 'text-[var(--text-muted)]/50' : 'text-[var(--text-secondary)]'}`}>
                      {isAllDay ? "All Day" : `${st.start_time?.slice(0, 5)} ${st.end_time ? `- ${st.end_time.slice(0, 5)}` : ''}`}
                      {!isAllDay && !status.isAvailable && !isAlreadyDone && ` (${status.message})`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {result && typeof result === 'object' && (result.currency_earned ?? 0) > 0 ? (
          <div className="mb-3 p-2 rounded-lg bg-[var(--accent-amber)]/10 border border-[var(--accent-amber)]/20 animate-fade-in">
            <p className="pixel-text-sm text-[var(--accent-amber)] text-center">
              🪙 +{result.currency_earned} coins! → {MILESTONE_EMOJI[result.milestone ?? ""] ?? ""}{" "}
              {MILESTONE_LABELS[result.milestone ?? ""] ?? ""}
            </p>
          </div>
        ) : null}

        {goal.plant_state === "GROWING" && (
          <>
            {isMultiple ? (
              <button
                onClick={handleComplete}
                disabled={loading || (!hasUnsavedProgress && !isFullyCompletedToday)}
                className={`w-full !py-2.5 !text-[0.55rem] transition-all ${
                  isFullyCompletedToday 
                    ? 'bg-[var(--accent-green)]/20 text-[var(--accent-green)] cursor-default' 
                    : 'btn-primary'
                } disabled:opacity-50`}
              >
                {loading ? (
                  <span className="animate-pixel-blink">Saving...</span>
                ) : isFullyCompletedToday ? (
                  "✅ All Done Today"
                ) : hasUnsavedProgress ? (
                  "💾 Save Progress"
                ) : (
                  "📝 Select tasks above"
                )}
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={loading || isFullyCompletedToday || !singleTaskStatus.isAvailable}
                className={`w-full !py-2.5 !text-[0.55rem] transition-all ${
                  isFullyCompletedToday 
                    ? 'bg-[var(--accent-green)]/20 text-[var(--accent-green)] cursor-default' 
                    : (!singleTaskStatus.isAvailable ? 'bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-not-allowed border border-[var(--border-default)]' : 'btn-primary')
                } disabled:opacity-50`}
              >
                {loading ? (
                  <span className="animate-pixel-blink">Completing...</span>
                ) : isFullyCompletedToday ? (
                  "✅ Completed Today"
                ) : !singleTaskStatus.isAvailable ? (
                  `⏳ ${singleTaskStatus.message}`
                ) : (
                  "✅ Complete Task"
                )}
              </button>
            )}
          </>
        )}

        {goal.plant_state === "MATURE_STATE" && (
          <div className="text-center p-2 mt-4 rounded-lg bg-[var(--accent-green)]/10 border border-[var(--accent-green)]/20">
            <p className="pixel-text-sm text-[var(--accent-green)]">
              {goal.completion_rate >= 0.9 ? '🌟 Flawless Growth!' : goal.completion_rate >= 0.6 ? '🎉 Goal Complete!' : '🥀 Survived!'}
            </p>
          </div>
        )}
      </div>

      {showEditModal && (
        <EditGoalModal
          goal={goal}
          onClose={() => setShowEditModal(false)}
          onSaveSingle={handleSaveSingleTime}
          onSaveMultiple={handleSaveMultipleTime}
        />
      )}
    </>
  );
}
