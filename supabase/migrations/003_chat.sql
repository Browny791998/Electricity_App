-- 003_chat.sql: per-region chat, rate limit, no-links, reports, realtime, cleanup.
-- BEFORE RUNNING: replace <ADMIN_EMAIL> with the real admin email.
-- Enable the pg_cron extension (Dashboard > Database > Extensions) first.

create table public.messages (
  id         bigint generated always as identity primary key,
  region     text not null references public.regions(code) on delete cascade,
  township   text,
  group_tag  text check (group_tag in ('A', 'B')),
  kind       text not null default 'text'
             check (kind in ('text', 'power_on', 'power_off')),
  nickname   text not null default 'ဧည့်သည်'
             check (char_length(nickname) between 1 and 20),
  body       text not null default ''
             check (char_length(body) <= 200),
  author     uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  -- Text messages need content; power reports may have an empty body.
  check (kind <> 'text' or char_length(btrim(body)) > 0)
);

create index messages_region_created_idx
  on public.messages (region, created_at desc);
create index messages_author_created_idx
  on public.messages (author, created_at desc);

-- -------------------------------------------------------------------- RLS
alter table public.messages enable row level security;

create policy "messages are public"
  on public.messages for select using (true);

-- Anonymous users are `authenticated`; they may only post as themselves.
create policy "users insert own messages"
  on public.messages for insert
  to authenticated
  with check (author = auth.uid());

create policy "admin deletes messages"
  on public.messages for delete
  to authenticated
  using ((auth.jwt() ->> 'email') = '<ADMIN_EMAIL>');

-- ---------------------------------------------------------------- trigger
create or replace function public.messages_guard()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Rate limit: max 5 messages per author per minute.
  if (select count(*) from public.messages
      where author = new.author
        and created_at > now() - interval '1 minute') >= 5 then
    raise exception 'RATE_LIMIT';
  end if;

  -- No links in body, nickname or township.
  if concat_ws(' ', new.body, new.nickname, new.township) ~*
     '(https?://|ftp://|www\.|t\.me/|[a-z0-9-]+\.(com|net|org|io|me|co|app|xyz|info|link|mm|ly|gg|tv|cc|ru|cn)(/|\y))'
  then
    raise exception 'NO_LINKS';
  end if;

  return new;
end;
$$;

create trigger messages_guard_trg
  before insert on public.messages
  for each row execute function public.messages_guard();

-- ------------------------------------------------------------------- view
create view public.recent_reports
with (security_invoker = true) as
select
  region,
  group_tag,
  kind,
  count(*)::int as report_count
from public.messages
where kind in ('power_on', 'power_off')
  and created_at > now() - interval '15 minutes'
group by region, group_tag, kind;

-- --------------------------------------------------------------- realtime
alter publication supabase_realtime add table public.messages;

-- ---------------------------------------------------------- 24h cleanup
-- Requires the pg_cron extension to be enabled first.
create extension if not exists pg_cron;

select cron.schedule(
  'delete-old-messages',
  '*/10 * * * *',
  $$delete from public.messages where created_at < now() - interval '24 hours'$$
);
