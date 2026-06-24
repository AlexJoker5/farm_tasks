"use client";

import { useState } from "react";
import { Goal, SubTask } from "./GoalCard";

interface EditGoalModalProps {
  goal: Goal;
  onClose: () => void;
  onSaveSingle: (isAllDay: boolean, start: string, end: string) => Promise<void>;
  onSaveMultiple: (subTaskUpdates: { id: string, isAllDay: boolean, start: string, end: string }[]) => Promise<void>;
}

export default function EditGoalModal({
  goal,
  onClose,
  onSaveSingle,
  onSaveMultiple
}: EditGoalModalProps) {
  const isMultiple = goal.project_type === 'MULTIPLE';
  const [saving, setSaving] = useState(false);

  // State for Single Task
  const [singleIsAllDay, setSingleIsAllDay] = useState(goal.is_all_day);
  const [singleStart, setSingleStart] = useState(goal.start_time || "09:00");
  const [singleEnd, setSingleEnd] = useState(goal.end_time || "17:00");

  // State for Multiple Tasks
  const [subTasksState, setSubTasksState] = useState(
    (goal.sub_tasks || []).map(st => ({
      id: st.id,
      title: st.title,
      isAllDay: st.start_time == null,
      start: st.start_time || "09:00",
      end: st.end_time || "17:00"
    }))
  );

  function handleSubTaskChange(id: string, field: string, value: any) {
    setSubTasksState(prev => prev.map(st => st.id === id ? { ...st, [field]: value } : st));
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (isMultiple) {
        await onSaveMultiple(subTasksState);
      } else {
        await onSaveSingle(singleIsAllDay, singleStart, singleEnd);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto slide-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="pixel-text-lg text-[var(--accent-green)]">
            Edit Goal
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-white transition-colors text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="space-y-6">
          {/* Uneditable Fields */}
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-2">Title</label>
            <input
              type="text"
              value={goal.title}
              disabled
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg p-3 text-[var(--text-muted)] cursor-not-allowed opacity-70"
            />
          </div>

          {goal.description && (
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-2">Description</label>
              <textarea
                value={goal.description}
                disabled
                rows={2}
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg p-3 text-[var(--text-muted)] cursor-not-allowed opacity-70 resize-none"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-2">Start Date</label>
              <input
                type="date"
                value={goal.start_date}
                disabled
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg p-3 text-[var(--text-muted)] cursor-not-allowed opacity-70"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-2">End Date</label>
              <input
                type="date"
                value={goal.end_date}
                disabled
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg p-3 text-[var(--text-muted)] cursor-not-allowed opacity-70"
              />
            </div>
          </div>

          <div className="h-px bg-[var(--border-default)] my-6"></div>

          {/* Editable Time Fields */}
          <h3 className="text-sm font-semibold text-[var(--accent-green)] mb-4">Edit Schedule</h3>

          {!isMultiple ? (
            <div className="p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-default)]">
              <label className="flex items-center gap-3 cursor-pointer mb-4">
                <input
                  type="checkbox"
                  checked={singleIsAllDay}
                  onChange={(e) => setSingleIsAllDay(e.target.checked)}
                  className="w-5 h-5 rounded border-[var(--border-default)] text-[var(--accent-green)] focus:ring-[var(--accent-green)] bg-[var(--bg-primary)]"
                />
                <span className="text-[var(--text-primary)]">All day task</span>
              </label>

              {!singleIsAllDay && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[var(--text-muted)] mb-2">Start Time</label>
                    <input
                      type="time"
                      value={singleStart}
                      onChange={(e) => setSingleStart(e.target.value)}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-lg p-3 text-[var(--text-primary)] focus:border-[var(--accent-green)] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--text-muted)] mb-2">End Time</label>
                    <input
                      type="time"
                      value={singleEnd}
                      onChange={(e) => setSingleEnd(e.target.value)}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-lg p-3 text-[var(--text-primary)] focus:border-[var(--accent-green)] outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {subTasksState.map((st, index) => (
                <div key={st.id} className="p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-default)]">
                  <div className="mb-3">
                    <label className="block text-xs text-[var(--text-muted)] mb-1">Sub-task {index + 1}</label>
                    <input
                      type="text"
                      value={st.title}
                      disabled
                      className="w-full bg-[var(--bg-primary)]/50 border border-[var(--border-default)] rounded p-2 text-[var(--text-muted)] cursor-not-allowed opacity-70 text-sm"
                    />
                  </div>
                  
                  <label className="flex items-center gap-2 cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      checked={st.isAllDay}
                      onChange={(e) => handleSubTaskChange(st.id, 'isAllDay', e.target.checked)}
                      className="w-4 h-4 rounded border-[var(--border-default)] text-[var(--accent-green)] focus:ring-[var(--accent-green)] bg-[var(--bg-primary)]"
                    />
                    <span className="text-xs text-[var(--text-primary)]">All day task</span>
                  </label>

                  {!st.isAllDay && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-[var(--text-muted)] mb-1">Start Time</label>
                        <input
                          type="time"
                          value={st.start}
                          onChange={(e) => handleSubTaskChange(st.id, 'start', e.target.value)}
                          className="w-full bg-[var(--bg-primary)] border border-[var(--border-default)] rounded p-2 text-[var(--text-primary)] text-sm focus:border-[var(--accent-green)] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[var(--text-muted)] mb-1">End Time</label>
                        <input
                          type="time"
                          value={st.end}
                          onChange={(e) => handleSubTaskChange(st.id, 'end', e.target.value)}
                          className="w-full bg-[var(--bg-primary)] border border-[var(--border-default)] rounded p-2 text-[var(--text-primary)] text-sm focus:border-[var(--accent-green)] outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-sm font-bold bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-primary)] transition-colors border border-[var(--border-default)]"
          >
            CANCEL
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 text-sm font-bold bg-[var(--accent-green)] text-black rounded-lg hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <span className="animate-pixel-blink">SAVING...</span>
            ) : (
              "SAVE CHANGES"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
