import type { SupabaseClient, User } from "@supabase/supabase-js";

let pending: Promise<User> | null = null;

/**
 * Reuse the current session (anonymous or not) or sign in anonymously.
 * Concurrent callers share one request, so a double render can't create two users.
 */
export function ensureSession(supabase: SupabaseClient): Promise<User> {
  pending ??= (async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) return data.session.user;

    const { data: anon, error } = await supabase.auth.signInAnonymously();
    if (error || !anon.user) throw error ?? new Error("anonymous sign-in failed");
    return anon.user;
  })().finally(() => {
    pending = null;
  });
  return pending;
}
