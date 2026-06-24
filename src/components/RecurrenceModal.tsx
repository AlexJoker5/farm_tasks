"use client";

import { useState } from "react";
import { RRule, Frequency, Weekday, Options } from "rrule";

interface RecurrenceModalProps {
  onClose: () => void;
  onSave: (rruleStr: string, description: string) => void;
  startDate: string; // YYYY-MM-DD
}

const DAYS: { label: string; value: Weekday }[] = [
  { label: "S", value: RRule.SU },
  { label: "M", value: RRule.MO },
  { label: "T", value: RRule.TU },
  { label: "W", value: RRule.WE },
  { label: "T", value: RRule.TH },
  { label: "F", value: RRule.FR },
  { label: "S", value: RRule.SA },
];

export default function RecurrenceModal({ onClose, onSave, startDate }: RecurrenceModalProps) {
  const [interval, setInterval] = useState(1);
  const [freq, setFreq] = useState<Frequency>(RRule.WEEKLY);
  const [byweekday, setByweekday] = useState<Weekday[]>(() => {
    // Default to the day of the week of the start date
    const d = new Date(startDate);
    // rrule uses MO=0, SU=6. JS uses SU=0, MO=1. 
    // Wait, rrule.SU is an object.
    const dayIndex = d.getDay();
    const mapping = [RRule.SU, RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA];
    return [mapping[dayIndex]];
  });
  
  const [endType, setEndType] = useState<"NEVER" | "UNTIL" | "COUNT">("NEVER");
  const [untilDate, setUntilDate] = useState<string>(() => {
    const d = new Date(startDate);
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split("T")[0];
  });
  const [count, setCount] = useState(13);

  function handleDayToggle(day: Weekday) {
    if (byweekday.includes(day)) {
      if (byweekday.length > 1) {
        setByweekday(byweekday.filter((d) => d !== day));
      }
    } else {
      setByweekday([...byweekday, day]);
    }
  }

  function handleSave() {
    const options: Partial<Options> = {
      freq,
      interval,
      dtstart: new Date(startDate + "T00:00:00Z"),
    };

    if (freq === RRule.WEEKLY) {
      options.byweekday = byweekday;
    }

    if (endType === "UNTIL") {
      options.until = new Date(untilDate + "T23:59:59Z");
    } else if (endType === "COUNT") {
      options.count = count;
    }

    const rule = new RRule(options);
    onSave(rule.toString(), rule.toText());
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-[var(--bg-primary)] p-6 rounded-2xl w-full max-w-sm animate-fade-in-up border border-[var(--border-default)] shadow-2xl">
        <h2 className="text-xl text-[var(--text-primary)] mb-6">Custom recurrence</h2>
        
        {/* Repeat Every */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-[var(--text-secondary)]">Repeat every</span>
          <input 
            type="number" 
            min="1" 
            value={interval} 
            onChange={(e) => setInterval(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-16 p-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-default)] text-center text-[var(--text-primary)]"
          />
          <select 
            value={freq} 
            onChange={(e) => setFreq(parseInt(e.target.value))}
            className="p-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)]"
          >
            <option value={RRule.DAILY}>day</option>
            <option value={RRule.WEEKLY}>week</option>
            <option value={RRule.MONTHLY}>month</option>
          </select>
        </div>

        {/* Weekly specific options */}
        {freq === RRule.WEEKLY && (
          <div className="mb-6">
            <p className="text-[var(--text-secondary)] mb-3">Repeat on</p>
            <div className="flex justify-between gap-1">
              {DAYS.map((d, i) => {
                const isSelected = byweekday.includes(d.value);
                return (
                  <button
                    key={i}
                    onClick={() => handleDayToggle(d.value)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm transition-colors ${
                      isSelected 
                        ? 'bg-[var(--accent-green)] text-black font-bold' 
                        : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-[var(--border-default)]'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Ends */}
        <div className="mb-8 space-y-4">
          <p className="text-[var(--text-secondary)] mb-2">Ends</p>
          
          <label className="flex items-center gap-3 cursor-pointer">
            <input 
              type="radio" 
              name="endType" 
              checked={endType === "NEVER"} 
              onChange={() => setEndType("NEVER")}
              className="w-4 h-4 accent-[var(--accent-green)]"
            />
            <span className="text-[var(--text-primary)]">Never</span>
          </label>
          
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="radio" 
                name="endType" 
                checked={endType === "UNTIL"} 
                onChange={() => setEndType("UNTIL")}
                className="w-4 h-4 accent-[var(--accent-green)]"
              />
              <span className="text-[var(--text-primary)] w-12">On</span>
            </label>
            <input 
              type="date"
              disabled={endType !== "UNTIL"}
              value={untilDate}
              onChange={(e) => setUntilDate(e.target.value)}
              className="flex-1 p-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] disabled:opacity-50"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="radio" 
                name="endType" 
                checked={endType === "COUNT"} 
                onChange={() => setEndType("COUNT")}
                className="w-4 h-4 accent-[var(--accent-green)]"
              />
              <span className="text-[var(--text-primary)] w-12">After</span>
            </label>
            <div className="flex-1 flex items-center gap-2">
              <input 
                type="number"
                min="1"
                disabled={endType !== "COUNT"}
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                className="w-20 p-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] disabled:opacity-50 text-center"
              />
              <span className="text-[var(--text-secondary)]">occurrences</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2 bg-[var(--accent-green)] text-black font-semibold rounded-lg hover:brightness-110 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
