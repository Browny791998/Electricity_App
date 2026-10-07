"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { z } from "zod";
import type { Group } from "./schedule";

const STORAGE_KEY = "electricity-prefs";
export const DEFAULT_REGION = "yangon";

const prefsSchema = z.object({
  region: z.string().min(1).optional(),
  group: z.enum(["A", "B"]).optional(),
  nickname: z.string().max(20).optional(),
});

const listeners = new Set<() => void>();

function readRaw(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function parse(raw: string | null) {
  if (!raw) return {};
  try {
    const result = prefsSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : {};
  } catch {
    return {};
  }
}

function write(next: { region?: string; group?: Group; nickname?: string }) {
  const merged = { ...parse(readRaw()), ...next };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // Storage unavailable (private mode): prefs just won't persist.
  }
  listeners.forEach((l) => l());
}

/**
 * Region + group preferences in localStorage. `ready` is false on the server
 * and during hydration, so the first client render matches the server HTML.
 */
export function useUserPrefs() {
  const ready = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const raw = useSyncExternalStore(subscribe, readRaw, () => null);
  const prefs = useMemo(() => parse(raw), [raw]);

  const setRegion = useCallback((region: string) => write({ region }), []);
  const setGroup = useCallback((group: Group) => write({ group }), []);
  const setNickname = useCallback((nickname: string) => write({ nickname }), []);

  return {
    ready,
    region: prefs.region ?? DEFAULT_REGION,
    group: (prefs.group ?? null) as Group | null,
    setRegion,
    setGroup,
    nickname: prefs.nickname ?? "",
    setNickname,
  };
}
