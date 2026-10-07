// Pure logic for the "schedule vs. crowd reports" banner (no React, no Supabase).
import type { ScheduleStatus } from "./schedule";

/** Minimum distinct reporters before the banner may appear. Change it here only. */
export const REPORT_THRESHOLD = 3;

/** Must match the window in the recent_reports view (`interval '15 minutes'`). */
export const REPORT_WINDOW_MINUTES = 15;

export interface RecentReport {
  group_tag: "A" | "B" | null;
  kind: "power_on" | "power_off";
  report_count: number;
}

export interface BannerInfo {
  /** What the reports claim, which contradicts the schedule. */
  reported: "on" | "off";
  count: number;
}

/**
 * `reports` must already be filtered to the user's region and group.
 * Returns null unless the schedule has data and at least `threshold` reporters
 * claim the opposite of what the schedule says.
 */
export function getBannerInfo(
  status: Pick<ScheduleStatus, "hasPower">,
  reports: RecentReport[],
  threshold: number = REPORT_THRESHOLD,
): BannerInfo | null {
  if (status.hasPower === null) return null; // no schedule: nothing to contradict

  const contradicting = status.hasPower ? "power_off" : "power_on";
  const count = reports
    .filter((r) => r.kind === contradicting)
    .reduce((sum, r) => sum + r.report_count, 0);

  if (count < threshold) return null;
  return { reported: status.hasPower ? "off" : "on", count };
}

export function shouldShowBanner(
  status: Pick<ScheduleStatus, "hasPower">,
  reports: RecentReport[],
  threshold: number = REPORT_THRESHOLD,
): boolean {
  return getBannerInfo(status, reports, threshold) !== null;
}

/** Hedged wording: states what people reported, never what is true. */
export function bannerMessage(info: BannerInfo): string {
  const schedule =
    info.reported === "on"
      ? "ဇယားအရ မီးပြတ်ရမယ့်အချိန် ဖြစ်ပေမယ့်"
      : "ဇယားအရ မီးလာရမယ့်အချိန် ဖြစ်ပေမယ့်";
  const claim = info.reported === "on" ? "မီးလာတယ်" : "မီးပြတ်တယ်";
  return `${schedule} ${REPORT_WINDOW_MINUTES} မိနစ်အတွင်း ${info.count} ယောက်က ${claim}လို့ report လုပ်ထားတယ်`;
}
