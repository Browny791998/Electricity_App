-- 005_recent_reports_distinct.sql: count distinct reporters, not messages.
-- Otherwise one person pressing the button 3 times could trigger the
-- "schedule contradicts reports" banner on their own.
-- Same columns and types as 003, so create-or-replace is safe to run again.

create or replace view public.recent_reports
with (security_invoker = true) as
select
  region,
  group_tag,
  kind,
  count(distinct author)::int as report_count
from public.messages
where kind in ('power_on', 'power_off')
  and created_at > now() - interval '15 minutes'
group by region, group_tag, kind;

grant select on public.recent_reports to anon, authenticated;
