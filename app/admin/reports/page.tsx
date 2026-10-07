import Link from "next/link";
import { Suspense } from "react";
import { ReportActions } from "@/components/ReportActions";
import { requireAdmin } from "@/lib/admin";
import { formatYangonDateTime } from "@/lib/format";

export default function ReportsPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link
          href="/admin"
          aria-label="Admin သို့ ပြန်သွားရန်"
          className="glass flex size-12 shrink-0 items-center justify-center rounded-xl text-xl"
        >
          ←
        </Link>
        <h1 className="text-2xl font-extrabold">📷 ဇယား report များ</h1>
      </header>
      <Suspense fallback={<p className="py-16 text-center opacity-70">ရယူနေသည်…</p>}>
        <Reports />
      </Suspense>
    </main>
  );
}

async function Reports() {
  const { supabase } = await requireAdmin();

  const [reports, regions] = await Promise.all([
    supabase
      .from("schedule_reports")
      .select("id,region,place,kind,month,note,contact,photo_paths,status,created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("regions").select("code,name_mm"),
  ]);

  if (reports.error || regions.error) {
    return (
      <p className="glass rounded-3xl p-8 text-center text-lg font-semibold">
        data ရယူ၍ မရပါ (006_reports.sql ကို run ပြီးပြီလား စစ်ပါ)
      </p>
    );
  }
  if (reports.data.length === 0) {
    return <p className="glass rounded-3xl p-8 text-center text-lg font-semibold">report မရှိသေးပါ</p>;
  }

  const names = Object.fromEntries(regions.data.map((r) => [r.code, r.name_mm]));

  // Photos are private: short-lived signed URLs, created with the admin's session.
  const allPaths = reports.data.flatMap((r) => r.photo_paths as string[]);
  const signed = allPaths.length
    ? await supabase.storage.from("report-photos").createSignedUrls(allPaths, 600)
    : { data: [] };
  const urlByPath = new Map(
    (signed.data ?? []).flatMap((s) => (s.path && s.signedUrl ? [[s.path, s.signedUrl] as const] : [])),
  );

  return (
    <ul className="space-y-4">
      {reports.data.map((r) => (
        <li key={r.id} className={`glass space-y-3 rounded-2xl p-4 ${r.status === "done" ? "opacity-60" : ""}`}>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`rounded px-1.5 py-0.5 font-bold ${
                r.kind === "new" ? "bg-secondary text-slate-900" : "bg-slate-300 text-slate-900"
              }`}
            >
              {r.kind === "new" ? "🆕 ဇယားအသစ်" : "✏️ ပြင်ရန်"}
            </span>
            <span className="rounded bg-primary px-1.5 py-0.5 font-bold text-white">
              {r.region ? (names[r.region] ?? r.region) : `📍 ${r.place} (စာရင်းထဲမပါ)`}
            </span>
            {r.month && <span className="font-semibold">{r.month}</span>}
            <span
              className={`rounded px-1.5 py-0.5 font-bold ${
                r.status === "new" ? "bg-warning text-slate-900" : "bg-success text-slate-900"
              }`}
            >
              {r.status === "new" ? "အသစ်" : "ပြီး"}
            </span>
            <time dateTime={r.created_at} className="ml-auto opacity-70">
              {formatYangonDateTime(r.created_at)}
            </time>
          </div>

          {r.note && <p className="whitespace-pre-wrap break-words text-base">{r.note}</p>}
          {r.contact && <p className="break-words text-sm font-semibold">📞 {r.contact}</p>}

          {r.photo_paths.length > 0 && (
            <ul className="grid grid-cols-3 gap-2">
              {(r.photo_paths as string[]).map((p, i) => {
                const url = urlByPath.get(p);
                return (
                  <li key={p}>
                    {url ? (
                      <a href={url} target="_blank" rel="noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`ဓာတ်ပုံ ${i + 1}`} className="aspect-square w-full rounded-xl object-cover" />
                      </a>
                    ) : (
                      <span className="flex aspect-square items-center justify-center rounded-xl bg-slate-300 text-xs dark:bg-slate-700">
                        မရပါ
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <ReportActions id={r.id} status={r.status as "new" | "done"} />
        </li>
      ))}
    </ul>
  );
}
