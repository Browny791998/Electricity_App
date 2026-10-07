"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "./supabase-browser";
import type { RecentReport } from "./banner";
import { addDays, type Group, type ScheduleRow } from "./schedule";

export interface Region {
  code: string;
  name_mm: string;
  name_en: string;
}

export function useRegions() {
  const [regions, setRegions] = useState<Region[]>([]);

  useEffect(() => {
    let cancelled = false;
    createClient()
      .from("regions")
      .select("code,name_mm,name_en")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        if (!cancelled && data) setRegions(data);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return regions;
}

interface Loaded {
  key: string;
  rows: ScheduleRow[] | null; // null = request failed
}

/**
 * Schedule rows for yesterday..today+3 (yesterday is needed because
 * 00:00-04:59 belongs to the previous day's slot 5). Refetches when the
 * region or the Yangon date changes.
 */
export function useScheduleRows(region: string, today: string) {
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const key = `${region}|${today}|${attempt}`;

  useEffect(() => {
    let cancelled = false;
    createClient()
      .from("schedules")
      .select("date,slot,power_group")
      .eq("region", region)
      .gte("date", addDays(today, -1))
      .lte("date", addDays(today, 3))
      .then(({ data, error }) => {
        if (!cancelled) setLoaded({ key, rows: error ? null : (data ?? []) });
      });
    return () => {
      cancelled = true;
    };
  }, [region, today, key]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  const current = loaded?.key === key ? loaded : null;

  return {
    loading: current === null,
    error: current !== null && current.rows === null,
    rows: current?.rows ?? [],
    retry,
  };
}

const REPORT_POLL_MS = 60_000;

interface ReportsStore {
  region: string;
  reports: RecentReport[];
}

/**
 * Crowd reports from the last 15 minutes for one region and group, polled every
 * 60 seconds. Empty while loading or if the request fails (no banner then).
 */
export function useRecentReports(region: string, group: Group): RecentReport[] {
  const [store, setStore] = useState<ReportsStore>({ region: "", reports: [] });

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    const load = () => {
      supabase
        .from("recent_reports")
        .select("group_tag,kind,report_count")
        .eq("region", region)
        .then(({ data, error }) => {
          if (cancelled) return;
          setStore({ region, reports: error || !data ? [] : (data as RecentReport[]) });
        });
    };

    load();
    const id = setInterval(load, REPORT_POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [region]);

  return useMemo(
    () =>
      store.region === region ? store.reports.filter((r) => r.group_tag === group) : [],
    [store, region, group],
  );
}
