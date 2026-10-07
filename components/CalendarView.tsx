"use client";

import { useState } from "react";
import {
  SLOT_LABELS,
  SLOT_TIMES,
  hasPower,
  type Group,
  type ScheduleRow,
} from "@/lib/schedule";
import { WEEKDAYS_MM, weekdayIndex } from "@/lib/calendar";
import { useUserPrefs } from "@/lib/use-user-prefs";

interface Props {
  rows: ScheduleRow[];
  days: string[];
  today: string;
  queryGroup: Group | null;
}

const other = (g: Group): Group => (g === "A" ? "B" : "A");

export function CalendarView({ rows, days, today, queryGroup }: Props) {
  const { ready, group: savedGroup } = useUserPrefs();
  const [viewOther, setViewOther] = useState(false);

  // ?group= wins, then the saved preference, then A.
  const baseGroup: Group | null = queryGroup ?? (ready ? (savedGroup ?? "A") : null);
  if (!baseGroup) return <div className="h-96" aria-hidden />;
  const group = viewOther ? other(baseGroup) : baseGroup;

  const byKey = new Map(rows.map((r) => [`${r.date}|${r.slot}`, r.power_group]));

  return (
    <div className="space-y-4">
      <div
        role="group"
        aria-label="အဖွဲ့ရွေးရန်"
        className="glass flex rounded-2xl p-1.5"
      >
        {[
          { isOther: false, label: "ကျွန်တော့်အဖွဲ့", g: baseGroup },
          { isOther: true, label: "တခြားအဖွဲ့", g: other(baseGroup) },
        ].map((o) => (
          <button
            key={o.label}
            type="button"
            aria-pressed={viewOther === o.isOther}
            onClick={() => setViewOther(o.isOther)}
            className={`min-h-12 flex-1 rounded-xl px-2 text-base font-bold ${
              viewOther === o.isOther
                ? "bg-gradient-to-r from-primary to-secondary text-white"
                : "text-slate-600 dark:text-slate-300"
            }`}
          >
            {o.label} ({o.g})
          </button>
        ))}
      </div>

      <ul className="glass divide-y divide-slate-200/70 rounded-3xl p-2 dark:divide-slate-700/60">
        {days.map((date) => {
          const day = Number(date.slice(8));
          const isToday = date === today;
          const slots = SLOT_LABELS.map((_, i) => {
            const value = byKey.get(`${date}|${i + 1}`);
            return {
              slot: i + 1,
              value,
              state: value === undefined ? "none" : hasPower(value, group) ? "on" : "off",
            } as const;
          });
          return (
            <li key={date}>
              <details className="group">
                <summary
                  className={`flex min-h-16 cursor-pointer list-none items-center gap-3 rounded-xl px-2 py-2 [&::-webkit-details-marker]:hidden ${
                    isToday ? "bg-warning/15 ring-2 ring-warning" : ""
                  }`}
                >
                  <span className="w-12 shrink-0 text-center">
                    <span className="block text-lg font-extrabold leading-tight">{day}</span>
                    <span className="block text-xs opacity-70">
                      {WEEKDAYS_MM[weekdayIndex(date)]}
                    </span>
                  </span>
                  <span className="flex flex-1 gap-1">
                    {slots.map((s) => (
                      <span
                        key={s.slot}
                        className={`flex h-14 flex-1 flex-col items-center justify-center rounded-lg leading-tight ${
                          s.state === "on"
                            ? "bg-success text-slate-900"
                            : s.state === "off"
                              ? "bg-danger text-white"
                              : "bg-slate-300 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <span className="text-[11px] font-semibold opacity-90">
                          {SLOT_LABELS[s.slot - 1]}
                        </span>
                        <span className="text-sm font-extrabold">
                          {s.state === "on" ? "လာ" : s.state === "off" ? "ပြတ်" : "–"}
                        </span>
                      </span>
                    ))}
                  </span>
                  <span className="text-lg opacity-50 transition group-open:rotate-90" aria-hidden>
                    ›
                  </span>
                </summary>
                <ul className="space-y-1.5 px-2 pb-3 pt-2">
                  {slots.map((s) => (
                    <li
                      key={s.slot}
                      className="flex items-center justify-between rounded-lg bg-white/60 px-3 py-2 text-sm dark:bg-slate-800/60"
                    >
                      <span>{SLOT_TIMES[s.slot - 1]}</span>
                      <span
                        className={`rounded-full px-3 py-0.5 font-bold text-white ${
                          s.state === "on"
                            ? "bg-success"
                            : s.state === "off"
                              ? "bg-danger"
                              : "bg-slate-400 dark:bg-slate-600"
                        }`}
                      >
                        {s.state === "on" ? "မီးလာ" : s.state === "off" ? "မီးပြတ်" : "ဇယားမရှိ"}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
