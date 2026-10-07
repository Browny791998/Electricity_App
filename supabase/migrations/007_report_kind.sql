-- 007_report_kind.sql: reports can also REQUEST a missing schedule, and can
-- name a place that is not in the regions list.
-- Run after 006. Safe to run more than once.

alter table public.schedule_reports
  add column if not exists kind  text not null default 'fix'
    check (kind in ('fix', 'new')),          -- fix = wrong schedule, new = no schedule yet
  add column if not exists place text not null default ''
    check (char_length(place) <= 100);       -- free-text place when region is "other"

alter table public.schedule_reports alter column region drop not null;

alter table public.schedule_reports
  drop constraint if exists schedule_reports_region_or_place;
alter table public.schedule_reports
  add constraint schedule_reports_region_or_place
  check (region is not null or char_length(btrim(place)) > 0);
