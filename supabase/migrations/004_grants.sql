-- 004_grants.sql: table privileges for the API roles.
-- RLS policies only filter rows; the roles also need GRANTs, which newer
-- Supabase projects no longer add automatically. Safe to run more than once.

grant usage on schema public to anon, authenticated;

-- Public read (RLS: "... are public" policies).
grant select on public.regions, public.slots, public.schedules, public.messages
  to anon, authenticated;
grant select on public.available_months, public.recent_reports
  to anon, authenticated;

-- Writes: RLS limits schedules to the admin email and messages to the author.
grant insert, update, delete on public.schedules to authenticated;
grant insert, delete         on public.messages  to authenticated;

-- replace_month is already granted to `authenticated` in 002.
