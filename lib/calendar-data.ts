import { cacheLife, cacheTag } from "next/cache";
import { shiftMonth } from "./calendar";
import type { ScheduleRow } from "./schedule";
import { createPublicClient } from "./supabase-public";

// Cached for 5 minutes. Errors are thrown, so a failed request is never cached.
// `expire` must stay above 5 minutes or the entry is excluded from prerendering.
function cacheFiveMinutes() {
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
}

export async function getRegions() {
  "use cache";
  cacheFiveMinutes();

  const { data, error } = await createPublicClient()
    .from("regions")
    .select("code,name_mm,name_en")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw error;
  return data;
}

export async function getMonthData(region: string, month: string) {
  "use cache";
  cacheFiveMinutes();
  cacheTag("schedules"); // invalidated by the admin upload action

  const supabase = createPublicClient();
  const [schedules, months] = await Promise.all([
    supabase
      .from("schedules")
      .select("date,slot,power_group")
      .eq("region", region)
      .gte("date", `${month}-01`)
      .lt("date", `${shiftMonth(month, 1)}-01`),
    supabase.from("available_months").select("month").eq("region", region),
  ]);
  if (schedules.error) throw schedules.error;
  if (months.error) throw months.error;

  return {
    rows: schedules.data as ScheduleRow[],
    availableMonths: months.data.map((m) => m.month as string),
  };
}
