-- 001_core.sql: regions, slots, schedules, available_months view, RLS.
-- BEFORE RUNNING: replace every <ADMIN_EMAIL> with the real admin email.

-- ---------------------------------------------------------------- regions
create table public.regions (
  code       text primary key,
  name_mm    text not null,
  name_en    text not null,
  sort_order int  not null default 0,
  is_active  boolean not null default true
);

insert into public.regions (code, name_mm, name_en, sort_order) values
  ('yangon',    'ရန်ကုန်',      'Yangon',    1),
  ('mandalay',  'မန္တလေး',      'Mandalay',  2),
  ('naypyitaw', 'နေပြည်တော်',   'Naypyitaw', 3),
  ('mawlamyine','မော်လမြိုင်',   'Mawlamyine',4),
  ('bago',      'ပဲခူး',        'Bago',      5),
  ('pathein',   'ပုသိမ်',       'Pathein',   6),
  ('sittwe',    'စစ်တွေ',       'Sittwe',    7),
  ('taunggyi',  'တောင်ကြီး',    'Taunggyi',  8),
  ('myitkyina', 'မြစ်ကြီးနား',   'Myitkyina', 9),
  ('sagaing',   'စစ်ကိုင်း',     'Sagaing',   10),
  ('magway',    'မကွေး',        'Magway',    11),
  ('dawei',     'ထားဝယ်',       'Dawei',     12),
  ('hpaan',     'ဘားအံ',        'Hpa-an',    13),
  ('loikaw',    'လွိုင်ကော်',    'Loikaw',    14),
  ('hakha',     'ဟားခါး',       'Hakha',     15);

-- ------------------------------------------------------------------ slots
-- Slot 5 crosses midnight (end_time < start_time).
create table public.slots (
  slot       int  primary key check (slot between 1 and 5),
  start_time time not null,
  end_time   time not null
);

insert into public.slots (slot, start_time, end_time) values
  (1, '05:00', '09:00'),
  (2, '09:00', '13:00'),
  (3, '13:00', '17:00'),
  (4, '17:00', '21:00'),
  (5, '21:00', '05:00');

-- -------------------------------------------------------------- schedules
create table public.schedules (
  id          bigint generated always as identity primary key,
  region      text not null references public.regions(code) on delete cascade,
  date        date not null,
  slot        int  not null references public.slots(slot),
  power_group text not null check (power_group in ('A', 'B', 'A+B', 'B+A')),
  updated_at  timestamptz not null default now(),
  unique (region, date, slot)
);

create index schedules_region_date_idx on public.schedules (region, date);

-- security_invoker: the view respects the caller's RLS on schedules.
create view public.available_months
with (security_invoker = true) as
select
  region,
  to_char(date, 'YYYY-MM') as month,
  count(distinct date)::int as days
from public.schedules
group by region, to_char(date, 'YYYY-MM');

-- -------------------------------------------------------------------- RLS
alter table public.regions   enable row level security;
alter table public.slots     enable row level security;
alter table public.schedules enable row level security;

create policy "regions are public"   on public.regions   for select using (true);
create policy "slots are public"     on public.slots     for select using (true);
create policy "schedules are public" on public.schedules for select using (true);

-- SECURITY: anonymous sign-in users also have role `authenticated`, so the
-- email check is what actually restricts writes to the admin.
create policy "admin writes schedules"
  on public.schedules
  for all
  to authenticated
  using      ((auth.jwt() ->> 'email') = '<ADMIN_EMAIL>')
  with check ((auth.jwt() ->> 'email') = '<ADMIN_EMAIL>');
