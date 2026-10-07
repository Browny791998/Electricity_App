# Myanmar Electricity Schedule Web App

## Purpose
Users in Myanmar see when electricity is ON/OFF based on a rotating load-shedding
schedule (Group A / Group B). Mobile-first, Burmese UI, very fast to read.

## Stack
Next.js (App Router) + TypeScript, Tailwind CSS, Supabase (Postgres, Auth, Realtime),
Zod, Vitest. Deploy: Vercel. Font: Noto Sans Myanmar.

## Domain rules
- 5 daily slots: 1=05-09, 2=09-13, 3=13-17, 4=17-21, 5=21-05 (crosses midnight).
- Each slot value is one of: "A", "B", "A+B", "B+A". "A+B" and "B+A" both mean
  both groups have power (treat identically).
- A group has power in a slot if value.split("+").includes(group).
- Time between 00:00-04:59 belongs to PREVIOUS day's slot 5.
- Always compute time in Asia/Yangon timezone, never the device timezone.
- Countdown must handle month rollover (look at next 2-3 days of data).
- If a region has no schedule data, show "no schedule yet". NEVER imply power is always on.

## Regions
Table `regions` (code, name_mm, name_en). Schedules are per region (capital cities).

## Admin
Exactly ONE admin (the developer). No public sign-up. Admin identified by email
in RLS policies. Admin uploads one JSON file per region+month:
{ "region":"yangon", "month":"2026-10", "days": { "4":["A","B","A","B","A+B"] } }
Array order = slot 1..5. Flow: upload -> Zod validate -> preview -> save via
RPC replace_month (transactional delete+insert).

## Public users
No accounts. Supabase Anonymous Sign-In only, used for the chat.
SECURITY: anonymous users have role `authenticated`, so admin RLS policies MUST
check email, never just `to authenticated`.

## Chat
Per-region room, Supabase Realtime. Message kinds: text, power_on, power_off.
Rate limit + no-links enforced by DB trigger. Messages auto-deleted after 24h.
Chat is for electricity status only.

## Conventions
- UI text in Burmese. Code/comments in English.
- Server Components by default; 'use client' only when needed.
- Never commit secrets. Use .env.local and keep .env.example updated.
- After each task: run typecheck + lint + tests, then summarize what changed.