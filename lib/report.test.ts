import { describe, expect, it } from "vitest";
import {
  MAX_PHOTOS,
  buildReportEmail,
  detectImageType,
  escapeHtml,
  validateReportFields,
} from "./report";

const bytes = (...n: number[]) => new Uint8Array(n);

describe("detectImageType", () => {
  it("detects jpeg, png and webp by magic bytes", () => {
    expect(detectImageType(bytes(0xff, 0xd8, 0xff, 0xe0))?.mime).toBe("image/jpeg");
    expect(detectImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))?.ext).toBe("png");
    expect(
      detectImageType(bytes(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50))?.mime,
    ).toBe("image/webp");
  });

  it("rejects other files (gif, html, svg, empty)", () => {
    expect(detectImageType(bytes(0x47, 0x49, 0x46, 0x38, 0x39, 0x61))).toBeNull();
    expect(detectImageType(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
    expect(detectImageType(new TextEncoder().encode("<html>"))).toBeNull();
    expect(detectImageType(bytes())).toBeNull();
  });
});

describe("validateReportFields", () => {
  const base = { region: "yangon", month: "2026-10", note: "ဇယားပြောင်းပါပြီ", contact: "" };

  it("accepts a normal report and normalises empty month to null", () => {
    const r = validateReportFields({ ...base, month: "" }, 1);
    expect(r.ok && r.data.month).toBeNull();
  });

  it("requires a region", () => {
    expect(validateReportFields({ ...base, region: " " }, 1).ok).toBe(false);
  });

  it("rejects a bad month", () => {
    expect(validateReportFields({ ...base, month: "2026-13" }, 1).ok).toBe(false);
  });

  it("needs a photo or a real note", () => {
    expect(validateReportFields({ ...base, note: "" }, 0).ok).toBe(false);
    expect(validateReportFields({ ...base, note: "abc" }, 0).ok).toBe(false);
    expect(validateReportFields({ ...base, note: "" }, 1).ok).toBe(true);
    expect(validateReportFields({ ...base, note: "ဇယားမှားနေသည်" }, 0).ok).toBe(true);
  });

  it("limits photos, note and contact length", () => {
    expect(validateReportFields(base, MAX_PHOTOS + 1).ok).toBe(false);
    expect(validateReportFields({ ...base, note: "x".repeat(1001) }, 1).ok).toBe(false);
    expect(validateReportFields({ ...base, contact: "x".repeat(101) }, 1).ok).toBe(false);
  });

  it("ignores non-string input safely", () => {
    expect(validateReportFields({ region: 5, note: {} }, 0).ok).toBe(false);
  });
});

describe("buildReportEmail", () => {
  it("escapes HTML in user text", () => {
    const e = buildReportEmail({
      kind: "fix",
      regionName: "ရန်ကုန်",
      month: "2026-10",
      note: '<script>alert("x")</script>',
      contact: "a&b",
      photoCount: 2,
    });
    expect(e.html).not.toContain("<script>");
    expect(e.html).toContain("&lt;script&gt;");
    expect(e.html).toContain("a&amp;b");
    expect(e.text).toContain("<script>"); // plain text stays literal
    expect(e.subject).toContain("ရန်ကုန်");
    expect(e.subject).toContain("2026-10");
  });

  it("handles missing optional fields", () => {
    const e = buildReportEmail({ kind: "fix", regionName: "မန္တလေး", month: null, note: "", contact: "", photoCount: 1 });
    expect(e.subject).toBe("ဇယားပြင်ရန် report: မန္တလေး");
    expect(e.text).toContain("မှတ်ချက် မရှိပါ");
  });
});

describe("report kinds and unlisted places", () => {
  const base = { region: "yangon", note: "ဇယားဓာတ်ပုံ ပါပါတယ်", contact: "" };

  it("defaults to a fix report and accepts a new-schedule request", () => {
    const fix = validateReportFields(base, 1);
    expect(fix.ok && fix.data.kind).toBe("fix");
    const req = validateReportFields({ ...base, kind: "new" }, 1);
    expect(req.ok && req.data.kind).toBe("new");
    const odd = validateReportFields({ ...base, kind: "hack" }, 1);
    expect(odd.ok && odd.data.kind).toBe("fix");
  });

  it("an unlisted place needs a name and stores no region", () => {
    expect(validateReportFields({ ...base, region: "other" }, 1).ok).toBe(false);
    expect(validateReportFields({ ...base, region: "other", place: "a" }, 1).ok).toBe(false);
    const r = validateReportFields({ ...base, region: "other", place: "ဟင်္သာတ" }, 1);
    expect(r.ok && r.data.region).toBeNull();
    expect(r.ok && r.data.place).toBe("ဟင်္သာတ");
  });

  it("drops the place text for a listed region", () => {
    const r = validateReportFields({ ...base, place: "ignored" }, 1);
    expect(r.ok && r.data.place).toBe("");
    expect(r.ok && r.data.region).toBe("yangon");
  });

  it("labels new-schedule requests in the email subject", () => {
    const e = buildReportEmail({ kind: "new", regionName: "ဟားခါး", month: "2026-10", note: "", contact: "", photoCount: 1 });
    expect(e.subject).toBe("ဇယားအသစ် တောင်းဆိုမှု: ဟားခါး (2026-10)");
  });
});

describe("escapeHtml", () => {
  it("escapes the five special characters", () => {
    expect(escapeHtml(`<>&"'`)).toBe("&lt;&gt;&amp;&quot;&#39;");
  });
});
