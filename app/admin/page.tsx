import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { LogoutButton } from "@/components/LogoutButton";
import { requireAdmin } from "@/lib/admin";
import { monthDays, monthLabel, shiftMonth } from "@/lib/calendar";
import { nowInYangon } from "@/lib/schedule";

export default function AdminPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-5 px-5 py-6">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Admin</h1>
        <LogoutButton />
      </header>
      <Suspense fallback={<p className="py-16 text-center opacity-70">ရယူနေသည်…</p>}>
        <Dashboard />
      </Suspense>
    </main>
  );
}

async function Dashboard() {
  const { supabase } = await requireAdmin();
  await connection(); // the current time must be read at request time

  const thisMonth = nowInYangon().dateStr.slice(0, 7);
  const months = [0, 1, 2].map((d) => shiftMonth(thisMonth, d));

  const [regions, available] = await Promise.all([
    supabase.from("regions").select("code,name_mm").order("sort_order"),
    supabase.from("available_months").select("region,month,days").in("month", months),
  ]);

  if (regions.error || available.error) {
    return (
      <section className="glass rounded-3xl p-8 text-center">
        <p className="text-lg font-semibold">data ရယူ၍ မရပါ</p>
      </section>
    );
  }

  const days = new Map(available.data.map((a) => [`${a.region}|${a.month}`, a.days as number]));

  return (
    <>
      <nav className="grid grid-cols-2 gap-3">
        <Link
          href="/admin/upload"
          className="flex min-h-14 items-center justify-center rounded-2xl bg-gradient-to-r from-primary to-secondary text-base font-bold text-white"
        >
          ⬆️ ဇယား တင်မည်
        </Link>
        <Link
          href="/admin/moderation"
          className="glass flex min-h-14 items-center justify-center rounded-2xl text-base font-bold"
        >
          🛡️ Chat စီမံမည်
        </Link>
        <Link
          href="/admin/reports"
          className="glass col-span-2 flex min-h-14 items-center justify-center rounded-2xl text-base font-bold"
        >
          📷 ဇယား report များ ကြည့်မည်
        </Link>
      </nav>

      <section className="glass overflow-x-auto rounded-3xl p-3">
        <table className="w-full text-center text-sm">
          <thead>
            <tr>
              <th className="p-2 text-left">မြို့</th>
              {months.map((m) => (
                <th key={m} className="p-2 font-bold">{monthLabel(m)}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/70 dark:divide-slate-700/60">
            {regions.data.map((r) => (
              <tr key={r.code}>
                <th scope="row" className="p-2 text-left font-semibold">{r.name_mm}</th>
                {months.map((m) => {
                  const count = days.get(`${r.code}|${m}`) ?? 0;
                  const total = monthDays(m).length;
                  const label =
                    count === 0 ? "❌" : count >= total ? `✅ ${count}` : `⚠️ ${count}/${total}`;
                  return (
                    <td key={m} className="p-1">
                      <Link
                        href={`/admin/upload?region=${r.code}&month=${m}`}
                        className="block rounded-lg px-1 py-2.5 font-semibold hover:bg-primary/10"
                      >
                        {label}
                      </Link>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <p className="text-center text-xs opacity-60">
        ✅ ရက်စုံ · ⚠️ မပြည့်စုံ · ❌ မရှိသေးပါ
      </p>
    </>
  );
}
