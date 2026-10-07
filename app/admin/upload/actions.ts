"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin";

/** Refresh public pages after a schedule upload. Admin only. */
export async function revalidateSchedules() {
  await requireAdmin(); // server actions are public endpoints: check again
  revalidatePath("/calendar");
  revalidateTag("schedules", { expire: 0 });
}
