"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";

export type ModerationResult =
  | { ok: true; deleted: number }
  | { ok: false; error: string };

const idSchema = z.number().int().positive();
const authorSchema = z.string().uuid();

// Both actions run with the admin's own session (cookies), so the database's
// admin-email RLS delete policy is what actually authorises the delete.
// `.select("id")` returns the rows really removed: RLS blocks silently (0 rows).

export async function deleteMessage(id: number): Promise<ModerationResult> {
  const { supabase } = await requireAdmin();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "message id မမှန်ပါ" };

  const { data, error } = await supabase
    .from("messages")
    .delete()
    .eq("id", parsed.data)
    .select("id");
  if (error) return { ok: false, error: "ဖျက်၍ မရပါ" };
  if (data.length === 0) {
    return { ok: false, error: "မဖျက်နိုင်ပါ (ဖျက်ပြီးသား သို့မဟုတ် ခွင့်မရှိပါ)" };
  }
  revalidatePath("/admin/moderation");
  return { ok: true, deleted: data.length };
}

export async function deleteAllFromAuthor(author: string): Promise<ModerationResult> {
  const { supabase } = await requireAdmin();
  const parsed = authorSchema.safeParse(author);
  if (!parsed.success) return { ok: false, error: "author id မမှန်ပါ" };

  const { data, error } = await supabase
    .from("messages")
    .delete()
    .eq("author", parsed.data)
    .select("id");
  if (error) return { ok: false, error: "ဖျက်၍ မရပါ" };
  revalidatePath("/admin/moderation");
  return { ok: true, deleted: data.length };
}
