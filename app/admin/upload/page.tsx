"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState, type ChangeEvent } from "react";
import { monthDays, shiftMonth, WEEKDAYS_MM, weekdayIndex } from "@/lib/calendar";
import { createClient } from "@/lib/supabase-browser";
import { useRegions } from "@/lib/use-schedule-data";
import {
  buildRows,
  buildTemplate,
  parseScheduleFile,
  validateBusiness,
  type ScheduleFile,
} from "@/lib/validate";
import { revalidateSchedules } from "./actions";

const MAX_FILE_BYTES = 1_000_000;

type Outcome = { kind: "ok"; count: number } | { kind: "error"; message: string } | null;

function saveErrorMessage(message: string): string {
  if (/row-level security|permission denied|JWT|not authorized/i.test(message)) {
    return "သိမ်းခွင့် မရှိပါ။ Admin အဖြစ် login ပြန်ဝင်ပါ";
  }
  if (message.includes("INVALID_MONTH")) return "month ပုံစံ မမှန်ပါ";
  if (message.includes("ROW_OUT_OF_MONTH")) return "ဒေတာအချို့သည် ရွေးထားသောလ အပြင်ဘက်တွင် ရှိနေသည်";
  if (/violates (check|foreign key)/i.test(message)) return "ဒေတာတန်ဖိုး သို့မဟုတ် မြို့ code မမှန်ပါ";
  return `သိမ်း၍ မရပါ: ${message}`;
}

const cellColor = {
  A: "bg-primary text-white",
  B: "bg-secondary text-slate-900",
  "A+B": "bg-success text-slate-900",
  "B+A": "bg-success text-slate-900",
} as const;

function Preview({ data }: { data: ScheduleFile }) {
  const days = monthDays(data.month);
  return (
    <div className="space-y-2">
      <ul className="flex flex-wrap gap-2 text-xs font-semibold">
        <li className="rounded bg-primary px-2 py-1 text-white">A</li>
        <li className="rounded bg-secondary px-2 py-1 text-slate-900">B</li>
        <li className="rounded bg-success px-2 py-1 text-slate-900">A+B / B+A (နှစ်ဖွဲ့လုံး)</li>
        <li className="rounded bg-slate-300 px-2 py-1 text-slate-700 dark:bg-slate-700 dark:text-slate-200">မပါ</li>
      </ul>
      <div className="max-h-[28rem] overflow-y-auto rounded-2xl">
        <table className="w-full border-separate border-spacing-y-1 text-center text-sm">
          <thead className="sticky top-0 bg-slate-100 dark:bg-slate-900">
            <tr>
              <th className="p-1 text-left">ရက်</th>
              {["05-09", "09-13", "13-17", "17-21", "21-05"].map((l) => (
                <th key={l} className="p-1 text-xs font-semibold">{l}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((date) => {
              const n = Number(date.slice(8));
              const slots = data.days[String(n)];
              return (
                <tr key={date}>
                  <th scope="row" className="whitespace-nowrap p-1 text-left font-semibold">
                    {n} <span className="text-xs font-normal opacity-60">{WEEKDAYS_MM[weekdayIndex(date)]}</span>
                  </th>
                  {[0, 1, 2, 3, 4].map((i) => {
                    const v = slots?.[i];
                    return (
                      <td key={i} className="px-0.5">
                        <span
                          className={`block rounded-md py-1.5 font-bold ${
                            v ? cellColor[v] : "bg-slate-300 text-slate-500 dark:bg-slate-700"
                          }`}
                        >
                          {v ?? "–"}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UploadForm() {
  const params = useSearchParams();
  const regions = useRegions();

  const [text, setText] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [readError, setReadError] = useState<string | null>(null);
  const [skipMissing, setSkipMissing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [outcome, setOutcome] = useState<Outcome>(null);

  const [tplRegion, setTplRegion] = useState(params.get("region") ?? "yangon");
  const [tplMonth, setTplMonth] = useState(
    /^\d{4}-(0[1-9]|1[0-2])$/.test(params.get("month") ?? "")
      ? params.get("month")!
      : shiftMonth(new Date().toISOString().slice(0, 7), 1),
  );

  const parsed = useMemo(() => (text === null ? null : parseScheduleFile(text)), [text]);
  const check = useMemo(
    () =>
      parsed?.ok && regions.length > 0
        ? validateBusiness(parsed.data, regions.map((r) => r.code))
        : null,
    [parsed, regions],
  );

  const hasMissing = (check?.missingDays.length ?? 0) > 0;
  const canSave =
    parsed?.ok === true &&
    check !== null &&
    check.errors.length === 0 &&
    (!hasMissing || skipMissing) &&
    !saving;

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setOutcome(null);
    setSkipMissing(false);
    setReadError(null);
    if (!file) return;
    setFileName(file.name);
    if (file.size > MAX_FILE_BYTES) {
      setText(null);
      setReadError("ဖိုင်အရွယ်အစား ကြီးလွန်းသည် (1MB အောက် ဖြစ်ရမည်)");
      return;
    }
    try {
      setText(await file.text());
    } catch {
      setText(null);
      setReadError("ဖိုင်ကို ဖတ်၍ မရပါ");
    }
  }

  async function onSave() {
    if (!parsed?.ok) return;
    setSaving(true);
    setOutcome(null);
    const { data, error } = await createClient().rpc("replace_month", {
      p_region: parsed.data.region,
      p_month: parsed.data.month,
      p_rows: buildRows(parsed.data),
    });
    if (error) {
      setOutcome({ kind: "error", message: saveErrorMessage(error.message) });
      setSaving(false);
      return;
    }
    try {
      await revalidateSchedules();
    } catch {
      // Saved fine; public pages simply refresh on their normal 5-minute cycle.
    }
    setOutcome({ kind: "ok", count: typeof data === "number" ? data : buildRows(parsed.data).length });
    setSaving(false);
  }

  function downloadTemplate() {
    const blob = new Blob([buildTemplate(tplRegion, tplMonth)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tplRegion}-${tplMonth}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const regionName = (code: string) => regions.find((r) => r.code === code)?.name_mm ?? code;
  const input =
    "min-h-12 rounded-xl border border-slate-300 bg-white/80 px-3 text-base text-slate-800 dark:border-sky-400/30 dark:bg-slate-900/60 dark:text-slate-100";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-5 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/admin" aria-label="Admin သို့ ပြန်သွားရန်" className="glass flex size-12 shrink-0 items-center justify-center rounded-xl text-xl">
          ←
        </Link>
        <h1 className="text-2xl font-extrabold">ဇယား တင်ရန်</h1>
      </header>

      <section className="glass space-y-3 rounded-3xl p-5">
        <h2 className="text-lg font-bold">၁။ Template ဒေါင်းလုဒ်</h2>
        <div className="flex flex-wrap gap-2">
          <select aria-label="မြို့" value={tplRegion} onChange={(e) => setTplRegion(e.target.value)} className={`${input} min-w-0 flex-1`}>
            {(regions.some((r) => r.code === tplRegion) ? regions : [{ code: tplRegion, name_mm: tplRegion, name_en: tplRegion }, ...regions]).map((r) => (
              <option key={r.code} value={r.code}>{r.name_mm}</option>
            ))}
          </select>
          <input type="month" aria-label="လ" value={tplMonth} onChange={(e) => e.target.value && setTplMonth(e.target.value)} className={input} />
        </div>
        <button type="button" onClick={downloadTemplate} className="glass min-h-12 w-full rounded-xl text-base font-bold">
          ⬇️ Template ဒေါင်းမည်
        </button>
      </section>

      <section className="glass space-y-3 rounded-3xl p-5">
        <h2 className="text-lg font-bold">၂။ JSON ဖိုင် ရွေးရန်</h2>
        <input
          type="file"
          accept="application/json,.json"
          onChange={onFile}
          aria-label="JSON ဖိုင်"
          className="block w-full text-base file:mr-3 file:min-h-12 file:rounded-xl file:border-0 file:bg-primary file:px-4 file:font-bold file:text-white"
        />
        {fileName && <p className="text-sm opacity-70">{fileName}</p>}
        {readError && <p role="alert" className="rounded-xl bg-danger/15 p-3 text-sm font-semibold text-red-700 dark:text-red-300">{readError}</p>}
      </section>

      {parsed && !parsed.ok && (
        <section role="alert" className="rounded-3xl bg-danger/15 p-5">
          <h2 className="mb-2 text-lg font-bold text-red-700 dark:text-red-300">❌ ဖိုင်ထဲတွင် အမှားများ ရှိသည်</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {parsed.errors.map((m) => <li key={m}>{m}</li>)}
          </ul>
        </section>
      )}

      {parsed?.ok && regions.length === 0 && (
        <p className="glass rounded-2xl p-4 text-sm">မြို့စာရင်း ရယူနေသည်… (မရပါက စာမျက်နှာကို ပြန်ဖွင့်ပါ)</p>
      )}

      {parsed?.ok && check && (
        <>
          {check.errors.length > 0 && (
            <section role="alert" className="rounded-3xl bg-danger/15 p-5">
              <h2 className="mb-2 text-lg font-bold text-red-700 dark:text-red-300">❌ ပြင်ရန် လိုသည်</h2>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {check.errors.map((m) => <li key={m}>{m}</li>)}
              </ul>
            </section>
          )}

          {check.warnings.length > 0 && (
            <section className="rounded-3xl bg-warning/15 p-5">
              <h2 className="mb-2 text-lg font-bold text-amber-800 dark:text-amber-300">⚠️ သတိပြုရန်</h2>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {check.warnings.map((m) => <li key={m}>{m}</li>)}
              </ul>
              <label className="mt-4 flex min-h-12 items-center gap-3 text-base font-semibold">
                <input type="checkbox" checked={skipMissing} onChange={(e) => setSkipMissing(e.target.checked)} className="size-6 accent-primary" />
                ပျောက်နေတဲ့ရက်တွေ ကျော်ပြီး သိမ်းမယ်
              </label>
            </section>
          )}

          <section className="glass space-y-3 rounded-3xl p-5">
            <h2 className="text-lg font-bold">၃။ Preview — {regionName(parsed.data.region)} · {parsed.data.month}</h2>
            <Preview data={parsed.data} />
          </section>

          <section className="glass space-y-3 rounded-3xl p-5">
            <h2 className="text-lg font-bold">၄။ သိမ်းရန်</h2>
            <p className="text-sm opacity-80">
              {regionName(parsed.data.region)} ၏ {parsed.data.month} လအတွက် ရှိပြီးသား ဒေတာ အားလုံးကို ဖျက်ပြီး ဤဖိုင်ဖြင့် အစားထိုးမည်။
            </p>
            <button
              type="button"
              disabled={!canSave}
              onClick={onSave}
              className="min-h-14 w-full rounded-xl bg-gradient-to-r from-primary to-secondary text-lg font-bold text-white disabled:opacity-40"
            >
              {saving ? "သိမ်းနေသည်…" : "💾 သိမ်းမည်"}
            </button>
            {hasMissing && !skipMissing && check.errors.length === 0 && (
              <p className="text-sm opacity-70">ပျောက်နေသောရက် ကျော်ရန် အမှန်ခြစ်ပါမှ သိမ်းလို့ရမည်</p>
            )}
          </section>
        </>
      )}

      {outcome?.kind === "ok" && (
        <p role="status" className="rounded-2xl bg-success/20 p-4 text-base font-bold">
          ✅ သိမ်းပြီးပါပြီ ({outcome.count} ကွက်)။{" "}
          <Link href={`/calendar?region=${parsed?.ok ? parsed.data.region : ""}&month=${parsed?.ok ? parsed.data.month : ""}`} className="underline">
            Calendar တွင် ကြည့်မည်
          </Link>
        </p>
      )}
      {outcome?.kind === "error" && (
        <p role="alert" className="rounded-2xl bg-danger/15 p-4 text-base font-bold text-red-700 dark:text-red-300">
          ❌ {outcome.message}
        </p>
      )}
    </main>
  );
}

export default function AdminUploadPage() {
  return (
    <Suspense fallback={<main className="min-h-dvh" />}>
      <UploadForm />
    </Suspense>
  );
}
