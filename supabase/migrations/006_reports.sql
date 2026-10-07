-- 006_reports.sql: public "schedule report" form (note + photos) -> admin inbox.
--
-- Nobody can insert from the browser: there is NO insert policy. Reports are
-- written only by the server route /api/report using the service-role key.
-- The admin (JWT email) can read, update and delete reports and view photos.

create table public.schedule_reports (
  id          uuid primary key default gen_random_uuid(),
  region      text not null references public.regions(code) on delete cascade,
  month       text check (month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  note        text not null default '' check (char_length(note) <= 1000),
  contact     text not null default '' check (char_length(contact) <= 100),
  photo_paths text[] not null default '{}' check (cardinality(photo_paths) <= 3),
  status      text not null default 'new' check (status in ('new', 'done')),
  ip_hash     text,
  created_at  timestamptz not null default now()
);

create index schedule_reports_ip_idx     on public.schedule_reports (ip_hash, created_at desc);
create index schedule_reports_status_idx on public.schedule_reports (status, created_at desc);

alter table public.schedule_reports enable row level security;

create policy "admin reads reports" on public.schedule_reports
  for select to authenticated
  using ((auth.jwt() ->> 'email') = 'yehtetaung791998@gmail.com');

create policy "admin updates reports" on public.schedule_reports
  for update to authenticated
  using      ((auth.jwt() ->> 'email') = 'yehtetaung791998@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'yehtetaung791998@gmail.com');

create policy "admin deletes reports" on public.schedule_reports
  for delete to authenticated
  using ((auth.jwt() ->> 'email') = 'yehtetaung791998@gmail.com');

grant select, update, delete on public.schedule_reports to authenticated;
-- The server route (service role) inserts and counts reports, and checks regions.
grant all    on public.schedule_reports to service_role;
grant select on public.regions          to service_role;

-- ------------------------------------------------------- private photo bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'report-photos', 'report-photos', false, 5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Admin can view (signed URLs) and delete photos. No public access at all.
create policy "admin reads report photos" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'report-photos'
    and (auth.jwt() ->> 'email') = 'yehtetaung791998@gmail.com'
  );

create policy "admin deletes report photos" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'report-photos'
    and (auth.jwt() ->> 'email') = 'yehtetaung791998@gmail.com'
  );
