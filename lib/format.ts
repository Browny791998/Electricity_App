/** "1 နာရီ 25 မိနစ်", "45 မိနစ်", "2 နာရီ" (Latin digits). */
export function formatDuration(totalMinutes: number): string {
  const minutes = Math.max(0, Math.round(totalMinutes));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} မိနစ်`;
  if (m === 0) return `${h} နာရီ`;
  return `${h} နာရီ ${m} မိနစ်`;
}

const clock = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Yangon",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** "HH:mm" in Asia/Yangon for an ISO timestamp. */
export function formatYangonTime(iso: string): string {
  return clock.format(new Date(iso));
}

const dateTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Yangon",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** "07 Oct, 16:30" in Asia/Yangon for an ISO timestamp. */
export function formatYangonDateTime(iso: string): string {
  return dateTime.format(new Date(iso));
}
