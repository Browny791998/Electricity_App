// Pure helpers for the public "schedule report" form (no React, no Supabase).

export const MAX_PHOTOS = 3;
export const MAX_FILE_BYTES = 2_000_000; // after client-side compression
export const MAX_TOTAL_BYTES = 4_000_000; // Vercel functions accept ~4.5MB bodies
export const MAX_REQUESTS_PER_HOUR = 5;
export const NOTE_MAX = 1000;
export const CONTACT_MAX = 100;
export const PLACE_MAX = 100;
export const OTHER_PLACE = "other";

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export type ImageType = { mime: "image/jpeg" | "image/png" | "image/webp"; ext: "jpg" | "png" | "webp" };

/** Detects the real type from magic bytes (never trust the client's MIME type). */
export function detectImageType(bytes: Uint8Array): ImageType | null {
  const b = bytes;
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
    return { mime: "image/jpeg", ext: "jpg" };
  }
  if (
    b.length >= 8 &&
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a
  ) {
    return { mime: "image/png", ext: "png" };
  }
  if (
    b.length >= 12 &&
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && // RIFF
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50 // WEBP
  ) {
    return { mime: "image/webp", ext: "webp" };
  }
  return null;
}

export type ReportKind = "fix" | "new";

export interface ReportFields {
  /** Region code, or null when the sender named a place that is not listed. */
  region: string | null;
  place: string;
  kind: ReportKind;
  month: string | null;
  note: string;
  contact: string;
}

export type FieldsResult = { ok: true; data: ReportFields } | { ok: false; error: string };

export function validateReportFields(
  input: {
    region?: unknown;
    month?: unknown;
    note?: unknown;
    contact?: unknown;
    kind?: unknown;
    place?: unknown;
  },
  photoCount: number,
): FieldsResult {
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const region = str(input.region);
  const month = str(input.month);
  const note = str(input.note);
  const contact = str(input.contact);
  const kind: ReportKind = input.kind === "new" ? "new" : "fix";
  const place = str(input.place);

  if (!region) return { ok: false, error: "မြို့ ရွေးပါ" };
  const isOther = region === OTHER_PLACE;
  if (isOther && place.length < 2) return { ok: false, error: "မြို့ / ကျေးရွာ အမည် ရေးပါ" };
  if (place.length > PLACE_MAX) return { ok: false, error: `အမည်ကို စာလုံး ${PLACE_MAX} အောက် ရေးပါ` };
  if (month && !MONTH_RE.test(month)) return { ok: false, error: "လ ပုံစံ မမှန်ပါ" };
  if (note.length > NOTE_MAX) return { ok: false, error: `မှတ်ချက်ကို စာလုံး ${NOTE_MAX} အောက် ရေးပါ` };
  if (contact.length > CONTACT_MAX) return { ok: false, error: `ဆက်သွယ်ရန်ကို စာလုံး ${CONTACT_MAX} အောက် ရေးပါ` };
  if (photoCount > MAX_PHOTOS) return { ok: false, error: `ဓာတ်ပုံ ${MAX_PHOTOS} ပုံအထိသာ ပို့နိုင်သည်` };
  if (photoCount === 0 && note.length < 5) {
    return { ok: false, error: "ဓာတ်ပုံ တင်ပါ သို့မဟုတ် မှတ်ချက် ရေးပါ" };
  }
  return {
    ok: true,
    data: {
      region: isOther ? null : region,
      place: isOther ? place : "",
      kind,
      month: month || null,
      note,
      contact,
    },
  };
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface EmailInput {
  kind: ReportKind;
  /** Region name, or the free-text place when the region is not listed. */
  regionName: string;
  month: string | null;
  note: string;
  contact: string;
  photoCount: number;
}

/** Plain text + HTML bodies. All user text is escaped in the HTML version. */
export function buildReportEmail(r: EmailInput) {
  const label = r.kind === "new" ? "ဇယားအသစ် တောင်းဆိုမှု" : "ဇယားပြင်ရန် report";
  const subject = `${label}: ${r.regionName}${r.month ? ` (${r.month})` : ""}`;
  const lines = [
    `အမျိုးအစား: ${r.kind === "new" ? "ဇယား မရှိသေးသော မြို့အတွက် ဇယားပို့ခြင်း" : "ရှိပြီးသား ဇယား မှားနေခြင်း"}`,
    `မြို့: ${r.regionName}`,
    `လ: ${r.month ?? "-"}`,
    `ဓာတ်ပုံ: ${r.photoCount} ပုံ (ပူးတွဲပါရှိသည်)`,
    `ဆက်သွယ်ရန်: ${r.contact || "-"}`,
    "",
    r.note || "(မှတ်ချက် မရှိပါ)",
  ];
  const html = lines
    .map((l) => (l === "" ? "<br>" : `<p style="margin:4px 0">${escapeHtml(l)}</p>`))
    .join("");
  return { subject, text: lines.join("\n"), html };
}
