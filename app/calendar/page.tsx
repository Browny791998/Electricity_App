import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { CalendarRegionSelect } from "@/components/CalendarRegionSelect";
import { CalendarView } from "@/components/CalendarView";
import { MonthPicker } from "@/components/MonthPicker";
import { isValidMonth, monthDays } from "@/lib/calendar";
import { nowInYangon, type Group, type ScheduleRow } from "@/lib/schedule";
import { getMonthData, getRegions } from "@/lib/calendar-data";

type Search = { [key: string]: string | string[] | undefined };
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-5 py-6 md:max-w-2xl">
      <header className="flex items-center gap-3">
        <Link
          href="/"
          aria-label="ပင်မစာမျက်နှာ"
          className="glass flex size-12 shrink-0 items-center justify-center rounded-xl text-xl"
        >
          ←
        </Link>
        <h1 className="text-2xl font-extrabold">လအလိုက် ဇယား</h1>
      </header>
      <Suspense
        fallback={<p className="py-16 text-center text-lg opacity-70">ဇယား ရယူနေသည်…</p>}
      >
        <CalendarContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function CalendarContent({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  await connection(); // the current time must be read at request time
  const today = nowInYangon().dateStr;

  const monthParam = first(sp.month);
  const month = isValidMonth(monthParam) ? monthParam : today.slice(0, 7);
  const groupParam = first(sp.group);
  const queryGroup: Group | null =
    groupParam === "A" || groupParam === "B" ? groupParam : null;
  const regionParam = first(sp.region);

  let regions: Awaited<ReturnType<typeof getRegions>> = [];
  let region = "yangon";
  let rows: ScheduleRow[] = [];
  let available = new Set<string>();
  let failed = false;

  try {
    regions = await getRegions();
    region = regions.some((r) => r.code === regionParam) ? regionParam! : "yangon";
    const data = await getMonthData(region, month);
    rows = data.rows;
    available = new Set(data.availableMonths);
  } catch {
    failed = true;
  }

  const href = (m: string) => {
    const q = new URLSearchParams({ region, month: m });
    if (queryGroup) q.set("group", queryGroup);
    return `/calendar?${q}`;
  };

  return (
    <>
      <section className="glass rounded-2xl p-3">
        <CalendarRegionSelect
          regions={regions}
          region={region}
          month={month}
          group={queryGroup}
        />
      </section>

      <MonthPicker month={month} available={available} href={href} />

      {failed ? (
        <section className="glass rounded-3xl p-8 text-center">
          <p className="text-lg font-semibold">
            ဇယား ရယူ၍ မရပါ။ ခဏနေပြီး ပြန်ကြိုးစားပါ
          </p>
        </section>
      ) : rows.length === 0 ? (
        <section className="glass rounded-3xl p-8 text-center">
          <p className="text-2xl font-bold">ဒီလအတွက် ဇယား မရှိသေးပါ</p>
          <p className="mt-2 text-sm opacity-70">
            အခြားလကို ရွေးကြည့်ပါ (အရောင်ပါသော လများတွင် ဇယားရှိသည်)
          </p>
          <Link
            href={`/report?kind=new&region=${region}&month=${month}`}
            className="mt-4 inline-flex min-h-12 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-secondary px-5 text-base font-bold text-white"
          >
            📷 ဒီလ ဇယား ပို့ပေးမယ်
          </Link>
        </section>
      ) : (
        <CalendarView
          rows={rows}
          days={monthDays(month)}
          today={today}
          queryGroup={queryGroup}
        />
      )}
    </>
  );
}
