import { describe, expect, it } from "vitest";
import {
  REPORT_THRESHOLD,
  bannerMessage,
  getBannerInfo,
  shouldShowBanner,
  type RecentReport,
} from "./banner";

const on = (n: number): RecentReport => ({ group_tag: "A", kind: "power_on", report_count: n });
const off = (n: number): RecentReport => ({ group_tag: "A", kind: "power_off", report_count: n });

const SCHEDULE_OFF = { hasPower: false };
const SCHEDULE_ON = { hasPower: true };
const NO_DATA = { hasPower: null };

describe("shouldShowBanner", () => {
  it("uses a threshold of 3 by default", () => {
    expect(REPORT_THRESHOLD).toBe(3);
  });

  it("shows when schedule says OFF and >= threshold report power_on", () => {
    expect(shouldShowBanner(SCHEDULE_OFF, [on(3)])).toBe(true);
    expect(shouldShowBanner(SCHEDULE_OFF, [on(4)])).toBe(true);
  });

  it("hides below the threshold", () => {
    expect(shouldShowBanner(SCHEDULE_OFF, [on(2)])).toBe(false);
    expect(shouldShowBanner(SCHEDULE_ON, [off(2)])).toBe(false);
  });

  it("works the other way: schedule ON, reports say power_off", () => {
    expect(shouldShowBanner(SCHEDULE_ON, [off(3)])).toBe(true);
  });

  it("does not show when reports agree with the schedule", () => {
    expect(shouldShowBanner(SCHEDULE_OFF, [off(10)])).toBe(false);
    expect(shouldShowBanner(SCHEDULE_ON, [on(10)])).toBe(false);
  });

  it("never shows when there is no schedule data", () => {
    expect(shouldShowBanner(NO_DATA, [on(10), off(10)])).toBe(false);
  });

  it("hides with no reports", () => {
    expect(shouldShowBanner(SCHEDULE_OFF, [])).toBe(false);
  });

  it("sums several rows of the same kind", () => {
    expect(shouldShowBanner(SCHEDULE_OFF, [on(1), on(2)])).toBe(true);
  });

  it("honours a custom threshold", () => {
    expect(shouldShowBanner(SCHEDULE_OFF, [on(2)], 2)).toBe(true);
    expect(shouldShowBanner(SCHEDULE_OFF, [on(4)], 5)).toBe(false);
  });
});

describe("getBannerInfo / bannerMessage", () => {
  it("reports direction and count", () => {
    expect(getBannerInfo(SCHEDULE_OFF, [on(4)])).toEqual({ reported: "on", count: 4 });
    expect(getBannerInfo(SCHEDULE_ON, [off(3)])).toEqual({ reported: "off", count: 3 });
    expect(getBannerInfo(SCHEDULE_OFF, [on(1)])).toBeNull();
  });

  it("is hedged: attributes the claim to reports", () => {
    const msg = bannerMessage({ reported: "on", count: 4 });
    expect(msg).toBe(
      "ဇယားအရ မီးပြတ်ရမယ့်အချိန် ဖြစ်ပေမယ့် 15 မိနစ်အတွင်း 4 ယောက်က မီးလာတယ်လို့ report လုပ်ထားတယ်",
    );
    expect(bannerMessage({ reported: "off", count: 3 })).toContain("မီးပြတ်တယ်လို့ report လုပ်ထားတယ်");
  });
});
