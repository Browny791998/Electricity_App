// Pure schedule logic. No React, no Supabase. All times are Asia/Yangon.

export type PowerGroup = "A" | "B" | "A+B" | "B+A";
export type Group = "A" | "B";

export interface ScheduleRow {
  date: string; // YYYY-MM-DD
  slot: number; // 1..5
  power_group: PowerGroup | string;
}

export interface YangonNow {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  dateStr: string; // YYYY-MM-DD in Yangon
}

export interface SlotRef {
  dateStr: string; // the day the slot STARTS on (slot 5 after midnight -> previous day)
  slot: number;
}

export interface ScheduleStatus {
  hasPower: boolean | null; // null = no schedule data for the current slot
  currentSlot: SlotRef;
  nextChangeAt: Date | null;
  nextChangeTo: "on" | "off" | null;
  minutesLeft: number | null;
}

const TIME_ZONE = "Asia/Yangon";
const YANGON_OFFSET_MS = 6.5 * 60 * 60 * 1000; // UTC+06:30, no DST
const SLOT_START_HOURS = [5, 9, 13, 17, 21]; // index = slot - 1
export const SLOT_LABELS = ["05-09", "09-13", "13-17", "17-21", "21-05"];
export const SLOT_TIMES = ["05:00–09:00", "09:00–13:00", "13:00–17:00", "17:00–21:00", "21:00–05:00 (နောက်နေ့)"];
const MAX_WALK_SLOTS = 5 * 90; // safety bound (~90 days)

const formatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const pad = (n: number) => String(n).padStart(2, "0");

export function hasPower(value: string, group: Group): boolean {
  return value.split("+").includes(group);
}

export function nowInYangon(date: Date = new Date()): YangonNow {
  const parts = formatter.formatToParts(date);
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value);
  const year = get("year");
  const month = get("month");
  const day = get("day");
  return {
    year,
    month,
    day,
    hour: get("hour"),
    minute: get("minute"),
    dateStr: `${year}-${pad(month)}-${pad(day)}`,
  };
}

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

export function getCurrentSlot(now: YangonNow): SlotRef {
  if (now.hour < 5) {
    return { dateStr: addDays(now.dateStr, -1), slot: 5 };
  }
  const slot = now.hour >= 21 ? 5 : Math.floor((now.hour - 5) / 4) + 1;
  return { dateStr: now.dateStr, slot };
}

function nextSlot(ref: SlotRef): SlotRef {
  return ref.slot === 5
    ? { dateStr: addDays(ref.dateStr, 1), slot: 1 }
    : { dateStr: ref.dateStr, slot: ref.slot + 1 };
}

/** The instant a slot begins, as a real Date. */
function slotStart(ref: SlotRef): Date {
  const [y, m, d] = ref.dateStr.split("-").map(Number);
  const localAsUtc = Date.UTC(y, m - 1, d, SLOT_START_HOURS[ref.slot - 1], 0);
  return new Date(localAsUtc - YANGON_OFFSET_MS);
}

export function getStatus(
  rows: ScheduleRow[],
  group: Group,
  now: Date = new Date(),
): ScheduleStatus {
  const lookup = new Map<string, string>();
  for (const r of rows) lookup.set(`${r.date}|${r.slot}`, r.power_group);
  const valueAt = (ref: SlotRef) => lookup.get(`${ref.dateStr}|${ref.slot}`);

  const currentSlot = getCurrentSlot(nowInYangon(now));
  const currentValue = valueAt(currentSlot);

  if (currentValue === undefined) {
    return {
      hasPower: null,
      currentSlot,
      nextChangeAt: null,
      nextChangeTo: null,
      minutesLeft: null,
    };
  }

  const current = hasPower(currentValue, group);
  let ref = currentSlot;
  for (let i = 0; i < MAX_WALK_SLOTS; i++) {
    ref = nextSlot(ref);
    const value = valueAt(ref);
    if (value === undefined) break; // data ran out before a change
    if (hasPower(value, group) !== current) {
      const nextChangeAt = slotStart(ref);
      return {
        hasPower: current,
        currentSlot,
        nextChangeAt,
        nextChangeTo: current ? "off" : "on",
        minutesLeft: Math.max(
          0,
          Math.ceil((nextChangeAt.getTime() - now.getTime()) / 60000),
        ),
      };
    }
  }

  return {
    hasPower: current,
    currentSlot,
    nextChangeAt: null,
    nextChangeTo: null,
    minutesLeft: null,
  };
}
