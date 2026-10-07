import { describe, expect, it } from "vitest";
import { isValidMonth, monthDays, monthLabel, shiftMonth, weekdayIndex } from "./calendar";

describe("calendar helpers", () => {
  it("validates YYYY-MM", () => {
    expect(isValidMonth("2026-10")).toBe(true);
    expect(isValidMonth("2026-13")).toBe(false);
    expect(isValidMonth("2026-1")).toBe(false);
    expect(isValidMonth(undefined)).toBe(false);
  });

  it("shifts across year boundaries", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-10", 0)).toBe("2026-10");
  });

  it("lists days incl. leap February", () => {
    expect(monthDays("2026-10")).toHaveLength(31);
    expect(monthDays("2026-11")).toHaveLength(30);
    expect(monthDays("2028-02")).toHaveLength(29);
    expect(monthDays("2026-10")[0]).toBe("2026-10-01");
  });

  it("labels and weekdays", () => {
    expect(monthLabel("2026-10")).toBe("အောက်တိုဘာ 2026");
    expect(weekdayIndex("2026-10-07")).toBe(3); // Wednesday
  });
});
