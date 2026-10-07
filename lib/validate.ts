// Pure validation for admin schedule uploads (no React, no Supabase).
import { z } from "zod";
import { monthDays } from "./calendar";

export const POWER_VALUES = ["A", "B", "A+B", "B+A"] as const;
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const MAX_LISTED_ERRORS = 20;

export const scheduleFileSchema = z.object({
  region: z.string().min(1),
  month: z.string().regex(MONTH_RE),
  days: z.record(z.string(), z.array(z.enum(POWER_VALUES)).length(5)),
});

export type ScheduleFile = z.infer<typeof scheduleFileSchema>;

export interface UploadRow {
  date: string;
  slot: number;
  power_group: (typeof POWER_VALUES)[number];
}

export type ParseResult =
  | { ok: true; data: ScheduleFile }
  | { ok: false; errors: string[] };

export interface BusinessCheck {
  errors: string[];
  warnings: string[];
  missingDays: number[];
}

const pad = (n: number) => String(n).padStart(2, "0");

function getAt(obj: unknown, path: PropertyKey[]): unknown {
  let cur: unknown = obj;
  for (const key of path) {
    if (cur === null || typeof cur !== "object") return undefined;
    cur = (cur as Record<PropertyKey, unknown>)[key];
  }
  return cur;
}

function describeValue(v: unknown): string {
  return typeof v === "string" ? `"${v}"` : JSON.stringify(v) ?? String(v);
}

function zodIssueToBurmese(path: PropertyKey[], raw: unknown): string {
  const value = getAt(raw, path);

  if (path.length === 0) {
    return 'JSON သည် { "region": "...", "month": "...", "days": { ... } } ပုံစံ ဖြစ်ရမည်';
  }
  const head = String(path[0]);
  if (path.length === 1) {
    if (head === "region") return '"region" မရှိပါ (စာသားဖြစ်ရမည်၊ ဥပမာ "yangon")';
    if (head === "month") return '"month" သည် YYYY-MM ပုံစံ ဖြစ်ရမည် (ဥပမာ "2026-10")';
    if (head === "days") return '"days" မရှိပါ သို့မဟုတ် object မဟုတ်ပါ';
  }
  if (head === "days" && path.length === 2) {
    const day = String(path[1]);
    if (!Array.isArray(value)) {
      return `ရက် ${day}: slot ၅ ခုပါသော စာရင်း ဖြစ်ရမည် (ဥပမာ ["A","B","A","B","A+B"])`;
    }
    return `ရက် ${day}: slot ၅ ခု ရှိရမည် (ယခု ${value.length} ခု ရှိနေသည်)`;
  }
  if (head === "days" && path.length === 3) {
    const slot = Number(path[2]) + 1;
    return `ရက် ${String(path[1])} slot ${slot}: ${describeValue(value)} မမှန်ပါ (A, B, A+B, B+A ထဲက တစ်ခုသာ ဖြစ်ရမည်)`;
  }
  return `${path.map(String).join(".")}: တန်ဖိုး မမှန်ပါ`;
}

export function parseScheduleFile(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    const detail = e instanceof Error ? ` (${e.message})` : "";
    return {
      ok: false,
      errors: [
        `JSON ဖိုင် ပုံစံမမှန်ပါ။ ကော်မာ၊ ကွင်းစကွင်းပိတ်၊ ကိုးကားအမှတ်အသားများကို စစ်ပါ${detail}`,
      ],
    };
  }

  const result = scheduleFileSchema.safeParse(raw);
  if (result.success) return { ok: true, data: result.data };

  const all = result.error.issues.map((i) => zodIssueToBurmese(i.path, raw));
  const unique = [...new Set(all)];
  const errors = unique.slice(0, MAX_LISTED_ERRORS);
  if (unique.length > MAX_LISTED_ERRORS) {
    errors.push(`…နှင့် အခြား အမှား ${unique.length - MAX_LISTED_ERRORS} ခု`);
  }
  return { ok: false, errors };
}

/** "1, 2, 3, 7" -> "1-3, 7" */
export function formatRanges(days: number[]): string {
  const sorted = [...days].sort((a, b) => a - b);
  const parts: string[] = [];
  let i = 0;
  while (i < sorted.length) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j++;
    parts.push(j > i + 1 ? `${sorted[i]}-${sorted[j]}` : sorted.slice(i, j + 1).join(", "));
    i = j + 1;
  }
  return parts.join(", ");
}

export function validateBusiness(
  data: ScheduleFile,
  regionCodes: string[],
): BusinessCheck {
  const errors: string[] = [];
  const warnings: string[] = [];
  const length = monthDays(data.month).length;

  if (!regionCodes.includes(data.region)) {
    errors.push(`region "${data.region}" သည် မြို့စာရင်းထဲတွင် မရှိပါ`);
  }

  const present = new Set<number>();
  for (const key of Object.keys(data.days)) {
    if (!/^[1-9]\d*$/.test(key)) {
      errors.push(`ရက်နံပါတ် "${key}" မမှန်ပါ (1, 2, 3 … ကဲ့သို့ ဂဏန်းသာ ဖြစ်ရမည်)`);
      continue;
    }
    const day = Number(key);
    if (day > length) {
      errors.push(
        `ရက် ${day} သည် ${data.month} လ၏ ရက်အရေအတွက် (${length} ရက်) ထက် ကျော်နေသည်`,
      );
      continue;
    }
    present.add(day);
  }

  const missingDays: number[] = [];
  for (let d = 1; d <= length; d++) if (!present.has(d)) missingDays.push(d);

  if (present.size === 0 && errors.length === 0) {
    errors.push('"days" ထဲတွင် ရက်တစ်ရက်မှ မပါပါ');
  } else if (missingDays.length > 0 && present.size > 0) {
    warnings.push(
      `ပျောက်နေသော ရက် ${missingDays.length} ရက်: ${formatRanges(missingDays)}`,
    );
  }

  return { errors, warnings, missingDays };
}

/** Flat rows for the replace_month RPC, ordered by day then slot. */
export function buildRows(data: ScheduleFile): UploadRow[] {
  const rows: UploadRow[] = [];
  const days = Object.keys(data.days)
    .filter((k) => /^[1-9]\d*$/.test(k))
    .map(Number)
    .sort((a, b) => a - b);
  for (const day of days) {
    data.days[String(day)].forEach((power_group, i) => {
      rows.push({ date: `${data.month}-${pad(day)}`, slot: i + 1, power_group });
    });
  }
  return rows;
}

/** Blank template: every slot is "" so it fails validation until filled in. */
export function buildTemplate(region: string, month: string): string {
  const days: Record<string, string[]> = {};
  for (let d = 1; d <= monthDays(month).length; d++) {
    days[String(d)] = ["", "", "", "", ""];
  }
  return JSON.stringify({ region, month, days }, null, 2);
}
