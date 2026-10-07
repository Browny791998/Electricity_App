-- 002_replace_month.sql: transactional replace of one region+month.
--
-- p_month: 'YYYY-MM'
-- p_rows : JSON array, one element per slot:
--   [{ "date": "2026-10-04", "slot": 1, "power_group": "A" }, ...]
--
-- SECURITY INVOKER: runs with the caller's rights, so the admin-only RLS
-- policy on schedules applies. Non-admins' deletes affect 0 rows and inserts fail.
-- A function body is a single transaction: any error rolls back the delete too.

create or replace function public.replace_month(
  p_region text,
  p_month  text,
  p_rows   jsonb
) returns int
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_start    date;
  v_end      date;
  v_inserted int;
begin
  if p_month !~ '^\d{4}-(0[1-9]|1[0-2])$' then
    raise exception 'INVALID_MONTH';
  end if;
  if jsonb_typeof(p_rows) is distinct from 'array' then
    raise exception 'INVALID_ROWS';
  end if;

  v_start := (p_month || '-01')::date;
  v_end   := (v_start + interval '1 month')::date;

  -- Every row must fall inside the target month.
  if exists (
    select 1
    from jsonb_to_recordset(p_rows) as r(date date, slot int, power_group text)
    where r.date is null or r.date < v_start or r.date >= v_end
  ) then
    raise exception 'ROW_OUT_OF_MONTH';
  end if;

  delete from public.schedules
  where region = p_region and date >= v_start and date < v_end;

  insert into public.schedules (region, date, slot, power_group)
  select p_region, r.date, r.slot, r.power_group
  from jsonb_to_recordset(p_rows) as r(date date, slot int, power_group text);

  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$$;

revoke all on function public.replace_month(text, text, jsonb) from public, anon;
grant execute on function public.replace_month(text, text, jsonb) to authenticated;
