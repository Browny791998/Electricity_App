import { describe, expect, it } from "vitest";
import {
  buildRows,
  buildTemplate,
  formatRanges,
  parseScheduleFile,
  validateBusiness,
  type ScheduleFile,
} from "./validate";

const REGIONS = ["yangon", "mandalay"];
const five = ["A", "B", "A", "B", "A+B"];

const file = (over: Partial<ScheduleFile> = {}, days?: Record<string, string[]>): string =>
  JSON.stringify({ region: "yangon", month: "2026-10", days: days ?? { "4": five }, ...over });

function mustParse(text: string): ScheduleFile {
  const r = parseScheduleFile(text);
  if (!r.ok) throw new Error(r.errors.join("\n"));
  return r.data;
}

describe("parseScheduleFile", () => {
  it("accepts a valid file", () => {
    expect(parseScheduleFile(file()).ok).toBe(true);
  });

  it("reports broken JSON in Burmese", () => {
    const r = parseScheduleFile("{ not json");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]).toContain("JSON ဖိုင် ပုံစံမမှန်ပါ");
  });

  it("reports a wrong top-level shape", () => {
    const r = parseScheduleFile("[1,2]");
    expect(r.ok).toBe(false);
  });

  it("reports an invalid month", () => {
    const r = parseScheduleFile(file({ month: "2026-13" }));
    expect(!r.ok && r.errors.join()).toContain("YYYY-MM");
  });

  it("names the exact day and slot of a bad value", () => {
    const r = parseScheduleFile(file({}, { "4": ["A", "B", "C", "B", "A"] }));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors[0]).toContain("ရက် 4 slot 3");
      expect(r.errors[0]).toContain('"C"');
    }
  });

  it("rejects arrays that are not exactly 5 long", () => {
    const short = parseScheduleFile(file({}, { "7": ["A", "B"] }));
    expect(!short.ok && short.errors[0]).toContain("ရက် 7");
    const long = parseScheduleFile(file({}, { "7": [...five, "A"] }));
    expect(long.ok).toBe(false);
  });

  it("accepts both A+B and B+A", () => {
    expect(parseScheduleFile(file({}, { "1": ["A+B", "B+A", "A", "B", "A"] })).ok).toBe(true);
  });
});

describe("validateBusiness", () => {
  it("passes a complete month with no warnings", () => {
    const days = Object.fromEntries(Array.from({ length: 31 }, (_, i) => [String(i + 1), five]));
    const r = validateBusiness(mustParse(file({}, days)), REGIONS);
    expect(r.errors).toEqual([]);
    expect(r.warnings).toEqual([]);
    expect(r.missingDays).toEqual([]);
  });

  it("errors on an unknown region", () => {
    const r = validateBusiness(mustParse(file({ region: "nowhere" })), REGIONS);
    expect(r.errors[0]).toContain("nowhere");
  });

  it("errors when a day is beyond the month length", () => {
    const r = validateBusiness(mustParse(file({ month: "2026-11" }, { "31": five })), REGIONS);
    expect(r.errors.join()).toContain("ရက် 31");
    expect(r.errors.join()).toContain("30 ရက်");
  });

  it("handles February in leap and non-leap years", () => {
    const bad = validateBusiness(mustParse(file({ month: "2026-02" }, { "29": five })), REGIONS);
    expect(bad.errors).toHaveLength(1);
    const ok = validateBusiness(mustParse(file({ month: "2028-02" }, { "29": five })), REGIONS);
    expect(ok.errors).toEqual([]);
  });

  it("errors on non-numeric day keys", () => {
    const r = validateBusiness(mustParse(file({}, { abc: five })), REGIONS);
    expect(r.errors[0]).toContain('"abc"');
  });

  it("treats missing days as a warning, not an error", () => {
    const days = Object.fromEntries(
      Array.from({ length: 27 }, (_, i) => [String(i + 5), five]),
    ); // days 5..31
    const r = validateBusiness(mustParse(file({}, days)), REGIONS);
    expect(r.errors).toEqual([]);
    expect(r.missingDays).toEqual([1, 2, 3, 4]);
    expect(r.warnings[0]).toContain("1-4");
  });

  it("errors on an empty days object", () => {
    const r = validateBusiness(mustParse(file({}, {})), REGIONS);
    expect(r.errors).toHaveLength(1);
  });
});

describe("formatRanges", () => {
  it("collapses runs", () => {
    expect(formatRanges([1, 2, 3, 7, 9, 10])).toBe("1-3, 7, 9, 10");
    expect(formatRanges([5])).toBe("5");
  });
});

describe("buildRows", () => {
  it("flattens days into dated slot rows", () => {
    const rows = buildRows(mustParse(file({}, { "4": five, "10": five })));
    expect(rows).toHaveLength(10);
    expect(rows[0]).toEqual({ date: "2026-10-04", slot: 1, power_group: "A" });
    expect(rows[4]).toEqual({ date: "2026-10-04", slot: 5, power_group: "A+B" });
    expect(rows[5].date).toBe("2026-10-10");
  });
});

describe("buildTemplate", () => {
  it("has every day of the month with blank slots", () => {
    const t = JSON.parse(buildTemplate("yangon", "2026-11"));
    expect(t.region).toBe("yangon");
    expect(t.month).toBe("2026-11");
    expect(Object.keys(t.days)).toHaveLength(30);
    expect(t.days["30"]).toEqual(["", "", "", "", ""]);
  });

  it("is rejected until filled in", () => {
    expect(parseScheduleFile(buildTemplate("yangon", "2026-10")).ok).toBe(false);
  });
});
