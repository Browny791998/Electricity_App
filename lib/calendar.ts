// Pure month helpers for the calendar page (no React, no Supabase).

const MONTH_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;

export const MONTH_NAMES_MM = [
  "ဇန်နဝါရီ", "ဖေဖော်ဝါရီ", "မတ်", "ဧပြီ", "မေ", "ဇွန်",
  "ဇူလိုင်", "ဩဂုတ်", "စက်တင်ဘာ", "အောက်တိုဘာ", "နိုဝင်ဘာ", "ဒီဇင်ဘာ",
];

// Index = JS getUTCDay() (0 = Sunday).
export const WEEKDAYS_MM = ["နွေ", "လာ", "ဂါ", "ဟူး", "ကြာ", "သော", "စနေ"];

const pad = (n: number) => String(n).padStart(2, "0");

export function isValidMonth(value: string | undefined): value is string {
  return value !== undefined && MONTH_RE.test(value);
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}`;
}

export function monthDays(month: string): string[] {
  const [y, m] = month.split("-").map(Number);
  const count = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return Array.from({ length: count }, (_, i) => `${month}-${pad(i + 1)}`);
}

export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return `${MONTH_NAMES_MM[m - 1]} ${y}`;
}

export function weekdayIndex(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}
