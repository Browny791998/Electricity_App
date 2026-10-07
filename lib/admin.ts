import { redirect } from "next/navigation";
import { isAdminUser } from "./admin-check";
import { createClient } from "./supabase-server";

/** Server-side guard for admin pages (second layer behind proxy.ts). */
export async function requireAdmin() {
  const supabase = await createClient();
  // getUser() validates the token with Supabase; getSession() would trust the cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAdminUser(user)) redirect("/admin/login");
  return { supabase, user: user! };
}
