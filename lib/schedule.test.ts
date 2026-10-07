import { describe, expect, it } from "vitest";
import {
  getCurrentSlot,
  getStatus,
  hasPower,
  nowInYangon,
  type ScheduleRow,
} from "./schedule";

// Build a Date from a Yangon wall-clock time.
const yangon = (local: string) => new Date(`${local}:00+06:30`);

const row = (date: string, slot: number, power_group: string): ScheduleRow => ({
  date,
  slot,
  power_group,
});

describe("hasPower", () => {
  it("matches single groups", () => {
    expect(hasPower("A", "A")).toBe(true);
    expect(hasPower("A", "B")).toBe(false);
    expect(hasPower("B", "B")).toBe(true);
  });

  it("treats A+B and B+A as power for either group", () => {
    for (const v of ["A+B", "B+A"]) {
      expect(hasPower(v, "A")).toBe(true);
      expect(hasPower(v, "B")).toBe(true);
    }
  });
});

describe("nowInYangon", () => {
  it("uses Yangon time, not UTC", () => {
    // 18:00 UTC = 00:30 next day in Yangon
    const t = nowInYangon(new Date("2026-10-31T18:00:00Z"));
    expect(t.dateStr).toBe("2026-11-01");
    expect(t.hour).toBe(0);
    expect(t.minute).toBe(30);
  });
});

describe("getCurrentSlot", () => {
  it("maps each hour range to its slot", () => {
    const slotAt = (local: string) =>
      getCurrentSlot(nowInYangon(yangon(local))).slot;
    expect(slotAt("2026-10-10T05:00")).toBe(1);
    expect(slotAt("2026-10-10T08:59")).toBe(1);
    expect(slotAt("2026-10-10T09:00")).toBe(2);
    expect(slotAt("2026-10-10T13:00")).toBe(3);
    expect(slotAt("2026-10-10T17:00")).toBe(4);
    expect(slotAt("2026-10-10T21:00")).toBe(5);
  });

  it("maps 02:30 to the previous day's slot 5", () => {
    expect(getCurrentSlot(nowInYangon(yangon("2026-10-10T02:30")))).toEqual({
      dateStr: "2026-10-09",
      slot: 5,
    });
  });

  it("maps 00:00 on the 1st to the previous month's last day", () => {
    expect(getCurrentSlot(nowInYangon(yangon("2026-11-01T00:00")))).toEqual({
      dateStr: "2026-10-31",
      slot: 5,
    });
  });
});

describe("getStatus", () => {
  it("returns null power when there is no data", () => {
    const s = getStatus([], "A", yangon("2026-10-10T10:00"));
    expect(s.hasPower).toBeNull();
    expect(s.nextChangeAt).toBeNull();
    expect(s.nextChangeTo).toBeNull();
    expect(s.minutesLeft).toBeNull();
  });

  it("returns null when only other days have data", () => {
    const s = getStatus([row("2026-10-11", 1, "A")], "A", yangon("2026-10-10T10:00"));
    expect(s.hasPower).toBeNull();
  });

  it("detects a state change at the next slot", () => {
    const rows = [row("2026-10-10", 2, "A"), row("2026-10-10", 3, "B")];
    const s = getStatus(rows, "A", yangon("2026-10-10T10:30"));
    expect(s.hasPower).toBe(true);
    expect(s.nextChangeTo).toBe("off");
    expect(s.nextChangeAt).toEqual(yangon("2026-10-10T13:00"));
    expect(s.minutesLeft).toBe(150);
  });

  it("reports an upcoming power-on", () => {
    const rows = [row("2026-10-10", 2, "B"), row("2026-10-10", 3, "A")];
    const s = getStatus(rows, "A", yangon("2026-10-10T12:59"));
    expect(s.hasPower).toBe(false);
    expect(s.nextChangeTo).toBe("on");
    expect(s.minutesLeft).toBe(1);
  });

  it("merges consecutive same-state slots", () => {
    const rows = [
      row("2026-10-10", 1, "A"),
      row("2026-10-10", 2, "A+B"),
      row("2026-10-10", 3, "B+A"),
      row("2026-10-10", 4, "A"),
      row("2026-10-10", 5, "B"),
    ];
    const s = getStatus(rows, "A", yangon("2026-10-10T06:00"));
    expect(s.hasPower).toBe(true);
    expect(s.nextChangeAt).toEqual(yangon("2026-10-10T21:00"));
    expect(s.nextChangeTo).toBe("off");
  });

  it("uses previous day's slot 5 after midnight and crosses into slot 1", () => {
    const rows = [row("2026-10-09", 5, "A"), row("2026-10-10", 1, "B")];
    const s = getStatus(rows, "A", yangon("2026-10-10T02:30"));
    expect(s.currentSlot).toEqual({ dateStr: "2026-10-09", slot: 5 });
    expect(s.hasPower).toBe(true);
    expect(s.nextChangeAt).toEqual(yangon("2026-10-10T05:00"));
    expect(s.minutesLeft).toBe(150);
  });

  it("rolls over the month boundary (31 Oct 23:00 -> 1 Nov)", () => {
    const rows = [row("2026-10-31", 5, "A"), row("2026-11-01", 1, "B")];
    const s = getStatus(rows, "A", yangon("2026-10-31T23:00"));
    expect(s.hasPower).toBe(true);
    expect(s.nextChangeAt).toEqual(yangon("2026-11-01T05:00"));
    expect(s.nextChangeTo).toBe("off");
    expect(s.minutesLeft).toBe(6 * 60);
  });

  it("walks across several days to find a change", () => {
    const rows = [
      row("2026-10-31", 5, "A"),
      row("2026-11-01", 1, "A+B"),
      row("2026-11-01", 2, "A"),
      row("2026-11-01", 3, "A"),
      row("2026-11-01", 4, "A"),
      row("2026-11-01", 5, "A"),
      row("2026-11-02", 1, "B"),
    ];
    const s = getStatus(rows, "A", yangon("2026-10-31T23:00"));
    expect(s.nextChangeAt).toEqual(yangon("2026-11-02T05:00"));
  });

  it("returns a null change when data runs out before a change", () => {
    const rows = [row("2026-10-31", 5, "A"), row("2026-11-01", 1, "A")];
    const s = getStatus(rows, "A", yangon("2026-10-31T23:00"));
    expect(s.hasPower).toBe(true);
    expect(s.nextChangeAt).toBeNull();
    expect(s.nextChangeTo).toBeNull();
    expect(s.minutesLeft).toBeNull();
  });

  it("evaluates each group independently", () => {
    const rows = [row("2026-10-10", 2, "A"), row("2026-10-10", 3, "B")];
    const b = getStatus(rows, "B", yangon("2026-10-10T10:00"));
    expect(b.hasPower).toBe(false);
    expect(b.nextChangeTo).toBe("on");
  });
});
