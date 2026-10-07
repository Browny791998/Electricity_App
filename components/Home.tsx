"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DayTimeline } from "@/components/DayTimeline";
import { GroupToggle } from "@/components/GroupToggle";
import { RegionPicker } from "@/components/RegionPicker";
import { ReportBanner } from "@/components/ReportBanner";
import { StatusCard } from "@/components/StatusCard";
import { getBannerInfo } from "@/lib/banner";
import { getStatus, nowInYangon, type Group } from "@/lib/schedule";
import {
  useRecentReports,
  useRegions,
  useScheduleRows,
  type Region,
} from "@/lib/use-schedule-data";
import { useUserPrefs } from "@/lib/use-user-prefs";

const REFRESH_MS = 30_000;

function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const tick = () => setNow(new Date());
    const id = setInterval(tick, intervalMs);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [intervalMs]);
  return now;
}

function FirstTime({
  regions,
  region,
  onRegion,
  onGroup,
}: {
  regions: Region[];
  region: string;
  onRegion: (r: string) => void;
  onGroup: (g: Group) => void;
}) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-7 px-5 py-10 md:max-w-xl">
      <header className="text-center">
        <div className="text-5xl" aria-hidden>⚡</div>
        <h1 className="mt-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-4xl font-extrabold leading-snug text-transparent">
          မီးဇယား
        </h1>
        <p className="mt-1 text-sm opacity-70">မီးလာချိန် မီးပြတ်ချိန် တစ်ချက်ကြည့်ရုံ</p>
      </header>

      <section className="glass flex flex-col gap-3 rounded-3xl p-5">
        <label htmlFor="region" className="text-base font-semibold">
          📍 မြို့ရွေးပါ
        </label>
        <RegionPicker id="region" regions={regions} value={region} onChange={onRegion} />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <p className="text-center text-base font-semibold md:col-span-2">သင့်အုပ်စုကို ရွေးပါ</p>
        {(["A", "B"] as const).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => onGroup(g)}
            className={`min-h-28 w-full rounded-3xl px-6 text-4xl font-extrabold text-white shadow-lg transition active:scale-[0.97] ${
              g === "A"
                ? "bg-gradient-to-br from-primary to-blue-700 shadow-primary/30"
                : "bg-gradient-to-br from-sky-500 to-primary shadow-secondary/30"
            }`}
          >
            Group {g}
          </button>
        ))}
        <Link
          href="/guide"
          className="flex min-h-12 items-center justify-center text-sm font-semibold underline opacity-80 md:col-span-2"
        >
          ❓ အသုံးပြုနည်း
        </Link>
      </section>
    </main>
  );
}

function Dashboard({
  regions,
  region,
  group,
  onRegion,
  onGroup,
}: {
  regions: Region[];
  region: string;
  group: Group;
  onRegion: (r: string) => void;
  onGroup: (g: Group) => void;
}) {
  const now = useNow(REFRESH_MS);
  const today = nowInYangon(now).dateStr;
  const { rows, loading, error, retry } = useScheduleRows(region, today);
  const status = getStatus(rows, group, now);
  const reports = useRecentReports(region, group);
  const banner = getBannerInfo(status, reports);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 px-5 py-6 md:max-w-2xl lg:max-w-5xl">
      <header className="glass flex items-center justify-between gap-3 rounded-2xl p-3">
        <RegionPicker
          regions={regions}
          value={region}
          onChange={onRegion}
          className="min-w-0 flex-1"
        />
        <GroupToggle value={group} onChange={onGroup} />
      </header>

      {loading ? (
        <p className="py-16 text-center text-lg opacity-70">ဇယား ရယူနေသည်…</p>
      ) : error ? (
        <section className="glass rounded-3xl p-8 text-center">
          <p className="text-lg font-semibold">
            ဇယား ရယူ၍ မရပါ။ အင်တာနက် စစ်ပြီး ထပ်ကြိုးစားပါ
          </p>
          <button
            type="button"
            onClick={retry}
            className="mt-4 min-h-12 rounded-xl bg-gradient-to-r from-primary to-secondary px-6 text-base font-bold text-white"
          >
            ထပ်ကြိုးစားမည်
          </button>
        </section>
      ) : (
        <div className="flex flex-col gap-5 lg:grid lg:grid-cols-2 lg:items-start">
          <div className="flex flex-col gap-5">
            <StatusCard status={status} region={region} />
            {banner && <ReportBanner info={banner} />}
          </div>
          <DayTimeline
            rows={rows}
            group={group}
            today={today}
            current={status.currentSlot}
          />
          <div className="grid gap-3 md:grid-cols-2 lg:col-span-2">
            <Link
              href={`/calendar?region=${region}&group=${group}`}
              className="glass flex min-h-14 items-center justify-center rounded-2xl px-3 text-center text-base font-bold text-primary dark:text-secondary"
            >
              📅 လအလိုက် ဇယားအပြည့်အစုံ ကြည့်မည်
            </Link>
            <Link
              href="/chat"
              className="glass flex min-h-14 items-center justify-center rounded-2xl px-3 text-center text-base font-bold text-primary dark:text-secondary"
            >
              💬 မီးအခြေအနေ Chat
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 lg:col-span-2">
            <Link
              href="/report"
              className="flex min-h-12 items-center text-sm font-semibold underline opacity-80"
            >
              📷 ဇယား မရှိ / မှားနေရင် ပို့မည်
            </Link>
            <Link
              href="/guide"
              className="flex min-h-12 items-center text-sm font-semibold underline opacity-80"
            >
              ❓ အသုံးပြုနည်း
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}

export function Home() {
  const { ready, region, group, setRegion, setGroup } = useUserPrefs();
  const regions = useRegions();

  if (!ready) return <main className="min-h-dvh" />;
  if (!group) {
    return (
      <FirstTime
        regions={regions}
        region={region}
        onRegion={setRegion}
        onGroup={setGroup}
      />
    );
  }
  return (
    <Dashboard
      regions={regions}
      region={region}
      group={group}
      onRegion={setRegion}
      onGroup={setGroup}
    />
  );
}
