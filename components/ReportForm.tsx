"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { compressImage } from "@/lib/compress-image";
import { VPN_HINT } from "@/lib/messages";
import {
  CONTACT_MAX,
  MAX_PHOTOS,
  MAX_TOTAL_BYTES,
  NOTE_MAX,
  OTHER_PLACE,
  PLACE_MAX,
  type ReportKind,
} from "@/lib/report";
import { useRegions } from "@/lib/use-schedule-data";
import { useUserPrefs } from "@/lib/use-user-prefs";

interface Photo {
  file: File;
  url: string;
}

const input =
  "min-h-12 w-full rounded-xl border border-slate-300 bg-white/80 px-3 text-base text-slate-800 dark:border-sky-400/30 dark:bg-slate-900/60 dark:text-slate-100";

const KINDS: { value: ReportKind; icon: string; title: string; hint: string }[] = [
  { value: "new", icon: "🆕", title: "ကျွန်တော့်မြို့ ဇယား မရှိသေးဘူး", hint: "ဇယား ထည့်ပေးပါ" },
  { value: "fix", icon: "✏️", title: "ရှိပြီးသား ဇယား မှားနေတယ်", hint: "ပြင်ပေးပါ" },
];

export function ReportForm() {
  const regions = useRegions();
  const { ready, region: savedRegion } = useUserPrefs();
  const params = useSearchParams();

  const [kind, setKind] = useState<ReportKind>(params.get("kind") === "fix" ? "fix" : "new");
  const [place, setPlace] = useState("");
  const [region, setRegion] = useState<string | null>(params.get("region"));
  const [month, setMonth] = useState("");
  const [note, setNote] = useState("");
  const [contact, setContact] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const selected = region ?? (ready ? savedRegion : "yangon");
  const isOther = selected === OTHER_PLACE;

  // Free preview URLs when photos are removed or the form unmounts.
  useEffect(() => () => photos.forEach((p) => URL.revokeObjectURL(p.url)), [photos]);

  async function onPick(e: ChangeEvent<HTMLInputElement>) {
    const files = [...(e.target.files ?? [])];
    e.target.value = "";
    setError(null);
    if (files.length === 0) return;
    if (photos.length + files.length > MAX_PHOTOS) {
      setError(`ဓာတ်ပုံ ${MAX_PHOTOS} ပုံအထိသာ ပို့နိုင်သည်`);
      return;
    }
    try {
      const compressed = await Promise.all(files.map((f) => compressImage(f)));
      setPhotos((prev) => [
        ...prev,
        ...compressed.map((file) => ({ file, url: URL.createObjectURL(file) })),
      ]);
    } catch {
      setError("ဤဓာတ်ပုံကို ဖတ်၍ မရပါ။ JPG သို့မဟုတ် PNG ဓာတ်ပုံ ရွေးပါ");
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const total = photos.reduce((n, p) => n + p.file.size, 0);
    if (total > MAX_TOTAL_BYTES) {
      setError("ဓာတ်ပုံများ ကြီးလွန်းသည်။ ပုံအရေအတွက် လျှော့ပါ");
      return;
    }

    const body = new FormData();
    body.set("region", selected);
    body.set("kind", kind);
    body.set("place", place);
    body.set("month", month);
    body.set("note", note);
    body.set("contact", contact);
    body.set("website", (e.currentTarget.elements.namedItem("website") as HTMLInputElement).value);
    photos.forEach((p) => body.append("photos", p.file));

    setBusy(true);
    try {
      const res = await fetch("/api/report", { method: "POST", body });
      const json = (await res.json().catch(() => null)) as { ok: boolean; error?: string } | null;
      if (json?.ok) {
        setSent(true);
      } else {
        setError(json?.error ?? "ပို့၍ မရပါ။ ပြန်ကြိုးစားပါ");
      }
    } catch {
      setError(`အင်တာနက် ချိတ်ဆက်မှု မရပါ။ ${VPN_HINT.replace("ဇယား မပေါ်ရင်", "မပို့နိုင်ရင်")}`);
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <section role="status" className="glass space-y-3 rounded-3xl p-8 text-center">
        <p className="text-5xl" aria-hidden>✅</p>
        <p className="text-xl font-extrabold">ပို့ပြီးပါပြီ၊ ကျေးဇူးတင်ပါတယ်</p>
        <p className="text-sm opacity-80">
          စစ်ဆေးပြီးမှ {kind === "new" ? "ဇယားကို ထည့်သွင်း" : "ဇယားကို ပြင်ဆင်"}ပါမယ်။ ချက်ချင်း မပေါ်သေးနိုင်ပါ။
        </p>
      </section>
    );
  }

  return (
    <form onSubmit={onSubmit} className="glass space-y-5 rounded-3xl p-5">
      <fieldset className="space-y-2">
        <legend className="mb-2 text-base font-semibold">ဘာအကြောင်း ပို့မလဲ</legend>
        <div className="grid gap-2 md:grid-cols-2">
          {KINDS.map((k) => (
            <label
              key={k.value}
              className={`flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl border-2 p-3 ${
                kind === k.value
                  ? "border-primary bg-primary/10"
                  : "border-slate-300 dark:border-slate-600"
              }`}
            >
              <input
                type="radio"
                name="kind"
                value={k.value}
                checked={kind === k.value}
                onChange={() => setKind(k.value)}
                className="size-5 accent-primary"
              />
              <span className="text-2xl" aria-hidden>{k.icon}</span>
              <span className="text-base font-bold leading-snug">
                {k.title}
                <span className="block text-sm font-normal opacity-70">{k.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-2 text-base font-semibold">
        📍 မြို့
        <select
          value={selected}
          onChange={(e) => setRegion(e.target.value)}
          className={input}
        >
          {(regions.some((r) => r.code === selected) || isOther
            ? regions
            : [{ code: selected, name_mm: selected, name_en: selected }, ...regions]
          ).map((r) => (
            <option key={r.code} value={r.code}>
              {r.name_mm}
            </option>
          ))}
          <option value={OTHER_PLACE}>➕ တခြားမြို့ / ကျေးရွာ (စာရင်းထဲ မပါ)</option>
        </select>
      </label>

      {isOther && (
        <label className="flex flex-col gap-2 text-base font-semibold">
          မြို့ / ကျေးရွာ အမည်
          <input
            value={place}
            maxLength={PLACE_MAX}
            onChange={(e) => setPlace(e.target.value)}
            placeholder="ဥပမာ - ဟင်္သာတမြို့၊ ဧရာဝတီတိုင်း"
            className={input}
          />
        </label>
      )}

      <label className="flex flex-col gap-2 text-base font-semibold">
        📅 ဘယ်လအတွက်လဲ <span className="text-sm font-normal opacity-70">(မဖြည့်လည်းရ)</span>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className={input} />
      </label>

      <div className="space-y-3">
        <p className="text-base font-semibold">
          📷 မီးဇယား ဓာတ်ပုံ <span className="text-sm font-normal opacity-70">(အများဆုံး {MAX_PHOTOS} ပုံ)</span>
        </p>
        {photos.length > 0 && (
          <ul className="grid grid-cols-3 gap-2">
            {photos.map((p, i) => (
              <li key={p.url} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={`ရွေးထားသော ဓာတ်ပုံ ${i + 1}`} className="aspect-square w-full rounded-xl object-cover" />
                <button
                  type="button"
                  aria-label={`ဓာတ်ပုံ ${i + 1} ဖယ်ရှားရန်`}
                  onClick={() => setPhotos((prev) => prev.filter((x) => x !== p))}
                  className="absolute -right-2 -top-2 flex size-9 items-center justify-center rounded-full bg-danger text-lg font-bold text-white shadow"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        {photos.length < MAX_PHOTOS && (
          <label className="glass flex min-h-14 cursor-pointer items-center justify-center rounded-2xl text-base font-bold text-primary dark:text-secondary">
            ➕ ဓာတ်ပုံ ရွေးမည် / ရိုက်မည်
            <input type="file" accept="image/*" multiple className="sr-only" onChange={onPick} />
          </label>
        )}
        <p className="text-xs opacity-70">
          မီးဇယား ကြော်ငြာ / စာရွက်ကို ရှင်းရှင်းလင်းလင်း ရိုက်ပါ။ ဓာတ်ပုံကို အလိုအလျောက် ချုံ့ပေးပါတယ်။ ဓာတ်ပုံထဲမှာ မျက်နှာ၊ ဖုန်းနံပါတ် မပါပါစေနဲ့။
        </p>
      </div>

      <label className="flex flex-col gap-2 text-base font-semibold">
        📝 မှတ်ချက်
        <textarea
          value={note}
          maxLength={NOTE_MAX}
          rows={4}
          onChange={(e) => setNote(e.target.value)}
          placeholder={
            kind === "new"
              ? "ဥပမာ - ဒီလအတွက် မီးဇယား ဓာတ်ပုံ ပါပါတယ်။ A, B အုပ်စု ခွဲထားပါတယ်"
              : "ဥပမာ - ၁၅ ရက်နေ့ကစပြီး ဇယား ပြောင်းသွားပါပြီ"
          }
          className={`${input} py-3`}
        />
      </label>

      <label className="flex flex-col gap-2 text-base font-semibold">
        📞 ဆက်သွယ်ရန် <span className="text-sm font-normal opacity-70">(မဖြည့်လည်းရ — Viber / အီးမေးလ်)</span>
        <input value={contact} maxLength={CONTACT_MAX} onChange={(e) => setContact(e.target.value)} className={input} />
      </label>

      {/* Honeypot: hidden from people, bots fill it in. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-danger/15 p-3 text-base font-bold text-red-700 dark:text-red-300">
          ❌ {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="min-h-14 w-full rounded-xl bg-gradient-to-r from-primary to-secondary text-lg font-bold text-white disabled:opacity-50"
      >
        {busy ? "ပို့နေသည်…" : "📨 ပို့မည်"}
      </button>
    </form>
  );
}
