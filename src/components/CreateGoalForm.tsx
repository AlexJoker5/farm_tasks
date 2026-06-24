"use client";

import { createGoal, CreateGoalPayload } from "@/app/actions/goals";
import { useState } from "react";
import RecurrenceModal from "./RecurrenceModal";

interface CreateGoalFormProps {
  onClose: () => void;
}

export default function CreateGoalForm({ onClose }: CreateGoalFormProps) {
  const [step, setStep] = useState<0 | 1>(0);
  const [projectType, setProjectType] = useState<'SINGLE' | 'MULTIPLE'>('SINGLE');

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  
  const [startDate, setStartDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split("T")[0];
  });

  const [isAllDay, setIsAllDay] = useState(true);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");

  const [recurrenceOption, setRecurrenceOption] = useState<"NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | "CUSTOM">("NONE");
  const [rruleString, setRruleString] = useState("");
  const [rruleDesc, setRruleDesc] = useState("");
  const [showRecurrenceModal, setShowRecurrenceModal] = useState(false);

  const [subTasks, setSubTasks] = useState<{ id: number; title: string; isAllDay: boolean; startTime: string; endTime: string }[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleAddSubTask() {
    setSubTasks([
      ...subTasks,
      { id: Date.now(), title: "", isAllDay: true, startTime: "09:00", endTime: "10:00" }
    ]);
  }

  function handleSubTaskChange(id: number, field: string, value: string | boolean) {
    setSubTasks(subTasks.map(st => st.id === id ? { ...st, [field]: value } : st));
  }

  function handleRemoveSubTask(id: number) {
    setSubTasks(subTasks.filter(st => st.id !== id));
  }

  function handleRecurrenceChange(val: string) {
    if (val === "CUSTOM") {
      setShowRecurrenceModal(true);
    } else {
      setRecurrenceOption(val as "NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | "CUSTOM");
      const dtstart = startDate.replace(/-/g, "");
      if (val === "NONE") {
        setRruleString("");
      } else if (val === "DAILY") {
        setRruleString(`FREQ=DAILY;INTERVAL=1;DTSTART=${dtstart}T000000Z`);
      } else if (val === "WEEKLY") {
        const mapping = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
        const day = mapping[new Date(startDate).getDay()];
        setRruleString(`FREQ=WEEKLY;INTERVAL=1;BYDAY=${day};DTSTART=${dtstart}T000000Z`);
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (projectType === 'MULTIPLE' && subTasks.length === 0) {
      setError("Please add at least one sub-task for multiple goals.");
      setLoading(false);
      return;
    }

    if (projectType === 'MULTIPLE' && subTasks.some(st => !st.title.trim())) {
      setError("All sub-tasks must have a title.");
      setLoading(false);
      return;
    }

    const payload: CreateGoalPayload = {
      title,
      description,
      start_date: startDate,
      end_date: endDate,
      is_all_day: isAllDay,
      start_time: !isAllDay ? startTime : undefined,
      end_time: !isAllDay ? endTime : undefined,
      rrule_string: recurrenceOption !== "NONE" ? rruleString : undefined,
      project_type: projectType,
      sub_tasks: projectType === 'MULTIPLE' ? subTasks.map(st => ({
        title: st.title,
        start_time: !st.isAllDay ? st.startTime : undefined,
        end_time: !st.isAllDay ? st.endTime : undefined,
      })) : undefined
    };

    const result = await createGoal(payload);

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

      {/* Lightbox Step 0: Selection */}
      {step === 0 && (
        <div className="relative glass-card p-8 w-full max-w-2xl animate-fade-in-up">
          <div className="flex items-center justify-between mb-8">
            <h2 className="pixel-text text-xl gradient-text">What do you want to plant?</h2>
            <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xl">✕</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button 
              onClick={() => { setProjectType('SINGLE'); setStep(1); }}
              className="flex flex-col items-center text-center p-8 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-default)] hover:border-[var(--accent-green)] hover:bg-[var(--accent-green)]/5 transition-all group"
            >
              <span className="text-6xl mb-4 group-hover:scale-110 transition-transform">🌱</span>
              <h3 className="pixel-text-sm text-[var(--text-primary)] mb-2">Single To-do Goal</h3>
              <p className="text-[var(--text-muted)] text-sm">A single recurring habit or one-off task.</p>
            </button>

            <button 
              onClick={() => { setProjectType('MULTIPLE'); setStep(1); }}
              className="flex flex-col items-center text-center p-8 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-default)] hover:border-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/5 transition-all group"
            >
              <span className="text-6xl mb-4 group-hover:scale-110 transition-transform">🌳</span>
              <h3 className="pixel-text-sm text-[var(--text-primary)] mb-2">Multiple To-do Goals</h3>
              <p className="text-[var(--text-muted)] text-sm">A project containing many daily sub-tasks.</p>
            </button>
          </div>
        </div>
      )}

      {/* Step 1: Form */}
      {step === 1 && (
        <div className="relative glass-card p-8 w-full max-w-xl max-h-[90vh] overflow-y-auto animate-fade-in">
          <div className="flex items-center justify-between mb-6 sticky top-0 bg-[var(--bg-primary)]/80 backdrop-blur pb-2 z-10 border-b border-[var(--border-default)]">
            <div className="flex items-center gap-3">
              <button onClick={() => setStep(0)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">←</button>
              <h2 className="pixel-text text-sm gradient-text">
                {projectType === 'SINGLE' ? 'New Single Goal' : 'New Multiple To-do Project'}
              </h2>
            </div>
            <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xl">✕</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title & Description */}
            <div className="space-y-4">
              <div>
                <label className="block pixel-text-sm text-[var(--text-secondary)] mb-2">Title</label>
                <input
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder={projectType === 'SINGLE' ? "Read a book" : "Morning Routine"}
                  className="w-full px-4 py-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:border-[var(--accent-green)] transition-colors outline-none"
                />
              </div>
              <div>
                <label className="block pixel-text-sm text-[var(--text-secondary)] mb-2">Description (optional)</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:border-[var(--accent-green)] transition-colors outline-none resize-none"
                />
              </div>
            </div>

            {/* Date & Time Settings */}
            <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/50 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">Start Date</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 rounded bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-primary)] outline-none" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">End Date</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 rounded bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-primary)] outline-none" />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isAllDay} onChange={e => setIsAllDay(e.target.checked)} className="w-4 h-4 accent-[var(--accent-green)]" />
                  <span className="text-sm text-[var(--text-primary)]">All day</span>
                </label>
              </div>

              {!isAllDay && (
                <div className="flex items-center gap-2 animate-fade-in">
                  <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="p-2 rounded bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-primary)] outline-none" />
                  <span className="text-[var(--text-muted)]">to</span>
                  <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="p-2 rounded bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-primary)] outline-none" />
                </div>
              )}

              {/* Recurrence Dropdown */}
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">Recurrence</label>
                <select 
                  value={recurrenceOption} 
                  onChange={(e) => handleRecurrenceChange(e.target.value)}
                  className="w-full p-2 rounded bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-primary)] outline-none"
                >
                  <option value="NONE">Does not repeat</option>
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="CUSTOM">Custom...</option>
                </select>
                {recurrenceOption === "CUSTOM" && rruleDesc && (
                  <p className="mt-1 text-xs text-[var(--accent-green)]">{rruleDesc}</p>
                )}
              </div>
            </div>

            {/* Multiple To-do Subtasks List */}
            {projectType === 'MULTIPLE' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="pixel-text-sm text-[var(--text-primary)]">Sub-Tasks (Daily Template)</h3>
                  <button type="button" onClick={handleAddSubTask} className="text-sm text-[var(--accent-green)] hover:underline">+ Add Task</button>
                </div>
                
                {subTasks.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)] italic">No tasks added yet.</p>
                ) : (
                  <div className="space-y-3">
                    {subTasks.map((st, i) => (
                      <div key={st.id} className="p-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] flex flex-col gap-2">
                        <div className="flex gap-2">
                          <input 
                            value={st.title}
                            onChange={e => handleSubTaskChange(st.id, 'title', e.target.value)}
                            placeholder={`Task ${i + 1}`}
                            className="flex-1 px-3 py-2 rounded bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm outline-none"
                          />
                          <button type="button" onClick={() => handleRemoveSubTask(st.id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded transition-colors">✕</button>
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input type="checkbox" checked={st.isAllDay} onChange={e => handleSubTaskChange(st.id, 'isAllDay', e.target.checked)} className="w-3 h-3 accent-[var(--accent-green)]" />
                            <span className="text-xs text-[var(--text-secondary)]">All day</span>
                          </label>
                          {!st.isAllDay && (
                            <div className="flex items-center gap-1">
                              <input type="time" value={st.startTime} onChange={e => handleSubTaskChange(st.id, 'startTime', e.target.value)} className="p-1 text-xs rounded bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-primary)] outline-none" />
                              <span className="text-xs text-[var(--text-muted)]">-</span>
                              <input type="time" value={st.endTime} onChange={e => handleSubTaskChange(st.id, 'endTime', e.target.value)} className="p-1 text-xs rounded bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-primary)] outline-none" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-[var(--border-default)] mt-6">
              <button type="button" onClick={onClose} className="btn-secondary flex-1 !py-3">Cancel</button>
              <button type="submit" disabled={loading} className="btn-primary flex-1 !py-3 disabled:opacity-50">
                {loading ? <span className="animate-pixel-blink">Planting...</span> : "🌱 Plant Seed"}
              </button>
            </div>
          </form>
        </div>
      )}

      {showRecurrenceModal && (
        <RecurrenceModal
          startDate={startDate}
          onClose={() => {
            if (!rruleString) setRecurrenceOption("NONE"); // Reset if canceled and nothing set
            setShowRecurrenceModal(false);
          }}
          onSave={(rule, desc) => {
            setRecurrenceOption("CUSTOM");
            setRruleString(rule);
            setRruleDesc(desc);
            setShowRecurrenceModal(false);
          }}
        />
      )}
    </div>
  );
}
