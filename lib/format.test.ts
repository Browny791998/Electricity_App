import { describe, expect, it } from "vitest";
import { formatDuration, formatYangonDateTime, formatYangonTime } from "./format";

describe("formatDuration", () => {
  it("formats hours and minutes", () => {
    expect(formatDuration(85)).toBe("1 နာရီ 25 မိနစ်");
  });
  it("omits zero parts", () => {
    expect(formatDuration(45)).toBe("45 မိနစ်");
    expect(formatDuration(120)).toBe("2 နာရီ");
  });
  it("clamps negatives to zero", () => {
    expect(formatDuration(-5)).toBe("0 မိနစ်");
  });
});

describe("formatYangonTime", () => {
  it("shows Asia/Yangon (UTC+6:30), not UTC", () => {
    expect(formatYangonTime("2026-10-07T10:00:00Z")).toBe("16:30");
    expect(formatYangonTime("2026-10-31T17:30:00Z")).toBe("00:00");
  });
});

describe("formatYangonDateTime", () => {
  it("includes the Yangon date, crossing midnight", () => {
    expect(formatYangonDateTime("2026-10-31T17:30:00Z")).toContain("01 Nov");
    expect(formatYangonDateTime("2026-10-31T17:30:00Z")).toContain("00:00");
  });
});
