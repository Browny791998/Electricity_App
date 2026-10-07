"use client";

import type { Group } from "@/lib/schedule";

interface Props {
  value: Group;
  onChange: (g: Group) => void;
}

export function GroupToggle({ value, onChange }: Props) {
  return (
    <div
      role="group"
      aria-label="အုပ်စုရွေးရန်"
      className="flex shrink-0 rounded-xl bg-slate-200 p-1 dark:bg-slate-900/70"
    >
      {(["A", "B"] as const).map((g) => (
        <button
          key={g}
          type="button"
          aria-pressed={value === g}
          onClick={() => onChange(g)}
          className={`min-h-12 min-w-14 rounded-lg px-4 text-lg font-bold ${
            value === g
              ? "bg-gradient-to-br from-primary to-secondary text-white shadow"
              : "text-slate-600 dark:text-slate-400"
          }`}
        >
          {g}
        </button>
      ))}
    </div>
  );
}
