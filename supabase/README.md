# Supabase setup

Run the files in `migrations/` in order in the Supabase SQL editor:
`001_core.sql`, `002_replace_month.sql`, `003_chat.sql`, `004_grants.sql`, `005_recent_reports_distinct.sql`, `006_reports.sql`, `007_report_kind.sql`.

`004_grants.sql` is required: without it the API answers
`permission denied for table ...` even though the RLS policies exist.

**Before running 001 and 003:** replace every `<ADMIN_EMAIL>` with the admin's
email. It must match the admin user created below, and the value of
`NEXT_PUBLIC_ADMIN_EMAIL`.

## Manual dashboard steps

1. **Enable pg_cron** — Database > Extensions > `pg_cron` (before running 003).
2. **Create the admin user** — Authentication > Users > Add user (email +
   password, tick "Auto Confirm User"). Use the same email as `<ADMIN_EMAIL>`.
3. **Disable public sign-ups** — Authentication > Sign In / Providers >
   turn off "Allow new users to sign up". Anonymous sign-ins are separate and
   stay available.
4. **Enable Anonymous sign-ins** — Authentication > Sign In / Providers >
   turn on "Allow anonymous sign-ins".

Note: anonymous users have role `authenticated`, which is why admin RLS
policies check the JWT email instead of the role.

## Schedule report form (photos to admin)

Run `006_reports.sql`, then `007_report_kind.sql` (adds the "new schedule request" type and
"unlisted place" support). 006 already uses the admin email `yehtetaung791998@gmail.com`).
Then add these **server-only** values to `.env.local` (and to Vercel's
Environment Variables). Never prefix them with `NEXT_PUBLIC_`:

1. `SUPABASE_SERVICE_ROLE_KEY` — Dashboard > Project Settings > API Keys >
   the **secret** key (`sb_secret_...`). It bypasses RLS: keep it private.
2. `RESEND_API_KEY` — sign up at resend.com **with `yha791998@gmail.com`**
   (without a verified domain, Resend only delivers to the account's own
   email), then create an API key.
3. `REPORT_EMAIL_TO=yha791998@gmail.com` (already in `.env.example`).

Reports are always saved first (table `schedule_reports`, private bucket
`report-photos`) and shown in `/admin/reports`; the email is only a notice, so
a mail failure never loses a report.
