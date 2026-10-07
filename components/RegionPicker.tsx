"use client";

import type { Region } from "@/lib/use-schedule-data";

interface Props {
  regions: Region[];
  value: string;
  onChange: (code: string) => void;
  className?: string;
  id?: string;
}

export function RegionPicker({ regions, value, onChange, className = "", id }: Props) {
  // Keep the saved region selectable even before the list has loaded.
  const options = regions.some((r) => r.code === value)
    ? regions
    : [{ code: value, name_mm: value, name_en: value }, ...regions];

  return (
    <select
      id={id}
      aria-label="မြို့ရွေးရန်"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`min-h-12 w-full rounded-xl border border-slate-300 bg-white/80 px-3 text-base font-medium text-slate-800 dark:border-sky-400/30 dark:bg-slate-900/60 dark:text-slate-100 ${className}`}
    >
      {options.map((r) => (
        <option key={r.code} value={r.code}>
          {r.name_mm}
        </option>
      ))}
    </select>
  );
}
