import Link from "next/link";
import { monthLabel, shiftMonth } from "@/lib/calendar";

interface Props {
  month: string;
  available: Set<string>;
  href: (month: string) => string;
}

export function MonthPicker({ month, available, href }: Props) {
  const prev = shiftMonth(month, -1);
  const next = shiftMonth(month, 1);
  const chips = [-2, -1, 0, 1, 2].map((d) => shiftMonth(month, d));

  const arrow = (target: string, label: string, glyph: string) => (
    <Link
      href={href(target)}
      aria-label={`${label} ${monthLabel(target)}`}
      className={`flex size-12 shrink-0 items-center justify-center rounded-xl text-2xl font-bold ${
        available.has(target)
          ? "bg-primary text-white"
          : "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
      }`}
    >
      {glyph}
    </Link>
  );

  return (
    <nav aria-label="လရွေးရန်" className="glass space-y-3 rounded-2xl p-3">
      <div className="flex items-center justify-between gap-2">
        {arrow(prev, "ရှေ့လ", "‹")}
        <h2 className="text-center text-xl font-extrabold">{monthLabel(month)}</h2>
        {arrow(next, "နောက်လ", "›")}
      </div>
      <ul className="flex justify-between gap-1.5">
        {chips.map((m) => {
          const has = available.has(m);
          const current = m === month;
          return (
            <li key={m} className="flex-1">
              <Link
                href={href(m)}
                aria-current={current ? "page" : undefined}
                className={`flex min-h-11 items-center justify-center rounded-lg text-center text-sm font-semibold ${
                  current
                    ? "bg-primary text-white"
                    : has
                      ? "bg-white/70 dark:bg-slate-800/70"
                      : "bg-slate-200/60 text-slate-500 dark:bg-slate-800/40 dark:text-slate-400"
                }`}
              >
                {Number(m.slice(5))}
                <span className="text-xs">လ</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
