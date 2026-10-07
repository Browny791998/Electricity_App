import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client. SERVER ONLY: it bypasses RLS. `server-only` makes the
 * build fail if this file is ever imported from client code.
 */
export function createServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
