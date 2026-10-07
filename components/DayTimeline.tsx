import {
  SLOT_LABELS,
  addDays,
  hasPower,
  type Group,
  type ScheduleRow,
  type SlotRef,
} from "@/lib/schedule";

interface Props {
  rows: ScheduleRow[];
  group: Group;
  today: string;
  current: SlotRef;
}

function DayRow({
  title,
  date,
  rows,
  group,
  highlightSlot,
  compact,
}: {
  title: string;
  date: string;
  rows: ScheduleRow[];
  group: Group;
  highlightSlot: number | null;
  compact?: boolean;
}) {
  return (
    <div>
      <h3 className="mb-2 text-base font-bold">
        {title} <span className="font-normal opacity-60">{date}</span>
      </h3>
      <ol className="flex gap-1.5">
        {SLOT_LABELS.map((label, i) => {
          const slot = i + 1;
          const row = rows.find((r) => r.date === date && r.slot === slot);
          const state = !row ? "none" : hasPower(row.power_group, group) ? "on" : "off";
          const color = {
            on: "bg-gradient-to-b from-success to-green-600 text-white",
            off: "bg-gradient-to-b from-danger to-red-600 text-white",
            none: "bg-slate-300 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
          }[state];
          const word = { on: "လာ", off: "ပြတ်", none: "–" }[state];
          const isCurrent = highlightSlot === slot;
          return (
            <li
              key={slot}
              aria-current={isCurrent ? "true" : undefined}
              className={`flex flex-1 flex-col items-center justify-center rounded-lg ${color} ${
                compact ? "h-12" : "h-20"
              } ${
                isCurrent
                  ? "ring-4 ring-warning ring-offset-2 ring-offset-transparent"
                  : ""
              }`}
            >
              <span className={compact ? "text-sm font-bold" : "text-lg font-bold"}>
                {word}
              </span>
              <span className="text-xs opacity-90">{label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function DayTimeline({ rows, group, today, current }: Props) {
  const tomorrow = addDays(today, 1);
  const inYesterdayNight = current.dateStr !== today;

  return (
    <section className="glass space-y-5 rounded-3xl p-5">
      {inYesterdayNight && (
        <p className="rounded-xl bg-warning/15 p-3 text-sm text-amber-900 dark:text-amber-200">
          အခု အချိန်သည် မနေ့ညပိုင်း (21-05) အတွင်း ဖြစ်ပါသည်
        </p>
      )}
      <DayRow
        title="ယနေ့"
        date={today}
        rows={rows}
        group={group}
        highlightSlot={inYesterdayNight ? null : current.slot}
      />
      <DayRow
        title="မနက်ဖြန်"
        date={tomorrow}
        rows={rows}
        group={group}
        highlightSlot={null}
        compact
      />
    </section>
  );
}
