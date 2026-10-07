// Pure admin check, shared by proxy.ts and server pages.

interface UserLike {
  email?: string | null;
  is_anonymous?: boolean;
}

const normalize = (v: string) => v.trim().toLowerCase();

/**
 * True only for a real (non-anonymous) user whose email equals the admin email.
 * SECURITY: if the admin email is unset or the user has no email, this must be
 * false (otherwise `undefined === undefined` would admit anonymous users).
 */
export function isAdminUser(
  user: UserLike | null | undefined,
  adminEmail: string | undefined = process.env.NEXT_PUBLIC_ADMIN_EMAIL,
): boolean {
  if (!user || user.is_anonymous) return false;
  if (!adminEmail || !adminEmail.trim() || !user.email) return false;
  return normalize(user.email) === normalize(adminEmail);
}
