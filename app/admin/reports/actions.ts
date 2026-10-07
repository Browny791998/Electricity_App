"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";

export type ReportActionResult = { ok: true } | { ok: false; error: string };

const idSchema = z.string().uuid();

// Run with the admin's own session: RLS (admin email) is what authorises them.

export async function setReportStatus(
  id: string,
  status: "new" | "done",
): Promise<ReportActionResult> {
  const { supabase } = await requireAdmin();
  if (!idSchema.safeParse(id).success || (status !== "new" && status !== "done")) {
    return { ok: false, error: "မမှန်ပါ" };
  }
  const { data, error } = await supabase
    .from("schedule_reports")
    .update({ status })
    .eq("id", id)
    .select("id");
  if (error || data.length === 0) return { ok: false, error: "ပြင်၍ မရပါ" };
  revalidatePath("/admin/reports");
  return { ok: true };
}

export async function deleteReport(id: string): Promise<ReportActionResult> {
  const { supabase } = await requireAdmin();
  if (!idSchema.safeParse(id).success) return { ok: false, error: "မမှန်ပါ" };

  const { data: row } = await supabase
    .from("schedule_reports")
    .select("photo_paths")
    .eq("id", id)
    .maybeSingle();
  if (!row) return { ok: false, error: "ရှာမတွေ့ပါ" };

  const { data, error } = await supabase.from("schedule_reports").delete().eq("id", id).select("id");
  if (error || data.length === 0) return { ok: false, error: "ဖျက်၍ မရပါ" };

  if (row.photo_paths.length > 0) {
    await supabase.storage.from("report-photos").remove(row.photo_paths);
  }
  revalidatePath("/admin/reports");
  return { ok: true };
}
