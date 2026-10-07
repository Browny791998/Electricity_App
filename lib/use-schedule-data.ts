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

const REGIONS_CACHE_KEY = "electricity-regions";

export function useRegions() {
  const [regions, setRegions] = useState<Region[]>([]);

  useEffect(() => {
    let cancelled = false;
    createClient()
      .from("regions")
      .select("code,name_mm,name_en")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data) {
          setRegions(data);
          try {
            localStorage.setItem(REGIONS_CACHE_KEY, JSON.stringify(data));
          } catch {
            // Storage unavailable: no offline copy.
          }
          return;
        }
        // Offline: use the city list saved on this phone.
        try {
          const cached = JSON.parse(localStorage.getItem(REGIONS_CACHE_KEY) ?? "null");
          if (Array.isArray(cached)) setRegions(cached as Region[]);
        } catch {
          // Ignore a corrupt cache.
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return regions;
}

interface Loaded {
  key: string;
  rows: ScheduleRow[] | null; // null = request failed and nothing cached
  staleSince: string | null; // ISO time of the cached copy shown when offline
}

const CACHE_PREFIX = "electricity-schedule:";
const FETCH_AHEAD_DAYS = 30;

function saveCache(region: string, rows: ScheduleRow[]) {
  try {
    localStorage.setItem(
      CACHE_PREFIX + region,
      JSON.stringify({ savedAt: new Date().toISOString(), rows }),
    );
  } catch {
    // Storage full or unavailable: offline copy simply won't exist.
  }
}

function readCache(region: string): { savedAt: string; rows: ScheduleRow[] } | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + region);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { savedAt?: unknown; rows?: unknown };
    if (typeof parsed.savedAt !== "string" || !Array.isArray(parsed.rows)) return null;
    return { savedAt: parsed.savedAt, rows: parsed.rows as ScheduleRow[] };
  } catch {
    return null;
  }
}

/**
 * Schedule rows for yesterday..today+30 (yesterday is needed because
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
      .lte("date", addDays(today, FETCH_AHEAD_DAYS))
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error) {
          const rows = (data ?? []) as ScheduleRow[];
          saveCache(region, rows);
          setLoaded({ key, rows, staleSince: null });
          return;
        }
        // Offline or blocked: fall back to the last copy saved on this phone.
        const cached = readCache(region);
        setLoaded(
          cached
            ? { key, rows: cached.rows, staleSince: cached.savedAt }
            : { key, rows: null, staleSince: null },
        );
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
    staleSince: current?.staleSince ?? null,
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
