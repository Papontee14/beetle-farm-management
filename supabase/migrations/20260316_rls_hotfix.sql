-- Hotfix for existing Supabase projects where service_role requests
-- are still being blocked by RLS.
-- Run this entire file in Supabase SQL Editor.

create or replace function app.request_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(current_setting('request.jwt.claim.role', true), auth.role(), '')
$$;

create or replace function app.can_write_farm(target_farm_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select app.request_role() = 'service_role'
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.farm_id = target_farm_id
        and p.role in ('owner', 'staff')
    )
$$;

create or replace function app.can_read_farm(target_farm_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select app.request_role() = 'service_role'
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.farm_id = target_farm_id
    )
$$;

drop policy if exists farms_select_own on public.farms;
create policy farms_select_own on public.farms
for select
using (
  app.request_role() = 'service_role'
  or app.can_read_farm(id)
);

drop policy if exists farms_write_own on public.farms;
create policy farms_write_own on public.farms
for all
using (
  app.request_role() = 'service_role'
  or app.can_write_farm(id)
)
with check (
  app.request_role() = 'service_role'
  or app.can_write_farm(id)
);

drop policy if exists profiles_select_same_farm on public.profiles;
create policy profiles_select_same_farm on public.profiles
for select
using (
  app.request_role() = 'service_role'
  or app.can_read_farm(farm_id)
);

drop policy if exists profiles_write_owner on public.profiles;
create policy profiles_write_owner on public.profiles
for all
using (
  app.request_role() = 'service_role'
  or exists (
    select 1
    from public.profiles me
    where me.id = auth.uid()
      and me.farm_id = profiles.farm_id
      and me.role = 'owner'
  )
)
with check (
  app.request_role() = 'service_role'
  or exists (
    select 1
    from public.profiles me
    where me.id = auth.uid()
      and me.farm_id = profiles.farm_id
      and me.role = 'owner'
  )
);

drop policy if exists beetles_select_same_farm on public.beetles;
create policy beetles_select_same_farm on public.beetles
for select
using (
  app.request_role() = 'service_role'
  or app.can_read_farm(farm_id)
);

drop policy if exists beetles_insert_same_farm on public.beetles;
create policy beetles_insert_same_farm on public.beetles
for insert
with check (
  app.request_role() = 'service_role'
  or app.can_write_farm(farm_id)
);

drop policy if exists beetles_update_same_farm on public.beetles;
create policy beetles_update_same_farm on public.beetles
for update
using (
  app.request_role() = 'service_role'
  or app.can_write_farm(farm_id)
)
with check (
  app.request_role() = 'service_role'
  or app.can_write_farm(farm_id)
);

drop policy if exists beetles_delete_same_farm on public.beetles;
create policy beetles_delete_same_farm on public.beetles
for delete
using (
  app.request_role() = 'service_role'
  or app.can_write_farm(farm_id)
);

drop policy if exists weight_logs_select_by_parent on public.beetle_weight_logs;
create policy weight_logs_select_by_parent on public.beetle_weight_logs
for select
using (
  app.request_role() = 'service_role'
  or exists (
    select 1 from public.beetles b
    where b.id = beetle_weight_logs.beetle_id
      and app.can_read_farm(b.farm_id)
  )
);

drop policy if exists weight_logs_write_by_parent on public.beetle_weight_logs;
create policy weight_logs_write_by_parent on public.beetle_weight_logs
for all
using (
  app.request_role() = 'service_role'
  or exists (
    select 1 from public.beetles b
    where b.id = beetle_weight_logs.beetle_id
      and app.can_write_farm(b.farm_id)
  )
)
with check (
  app.request_role() = 'service_role'
  or exists (
    select 1 from public.beetles b
    where b.id = beetle_weight_logs.beetle_id
      and app.can_write_farm(b.farm_id)
  )
);

drop policy if exists feeding_logs_select_by_parent on public.beetle_feeding_logs;
create policy feeding_logs_select_by_parent on public.beetle_feeding_logs
for select
using (
  app.request_role() = 'service_role'
  or exists (
    select 1 from public.beetles b
    where b.id = beetle_feeding_logs.beetle_id
      and app.can_read_farm(b.farm_id)
  )
);

drop policy if exists feeding_logs_write_by_parent on public.beetle_feeding_logs;
create policy feeding_logs_write_by_parent on public.beetle_feeding_logs
for all
using (
  app.request_role() = 'service_role'
  or exists (
    select 1 from public.beetles b
    where b.id = beetle_feeding_logs.beetle_id
      and app.can_write_farm(b.farm_id)
  )
)
with check (
  app.request_role() = 'service_role'
  or exists (
    select 1 from public.beetles b
    where b.id = beetle_feeding_logs.beetle_id
      and app.can_write_farm(b.farm_id)
  )
);

drop policy if exists health_records_select_by_parent on public.beetle_health_records;
create policy health_records_select_by_parent on public.beetle_health_records
for select
using (
  app.request_role() = 'service_role'
  or exists (
    select 1 from public.beetles b
    where b.id = beetle_health_records.beetle_id
      and app.can_read_farm(b.farm_id)
  )
);

drop policy if exists health_records_write_by_parent on public.beetle_health_records;
create policy health_records_write_by_parent on public.beetle_health_records
for all
using (
  app.request_role() = 'service_role'
  or exists (
    select 1 from public.beetles b
    where b.id = beetle_health_records.beetle_id
      and app.can_write_farm(b.farm_id)
  )
)
with check (
  app.request_role() = 'service_role'
  or exists (
    select 1 from public.beetles b
    where b.id = beetle_health_records.beetle_id
      and app.can_write_farm(b.farm_id)
  )
);

drop policy if exists soil_events_select_by_parent on public.soil_change_events;
create policy soil_events_select_by_parent on public.soil_change_events
for select
using (
  app.request_role() = 'service_role'
  or exists (
    select 1 from public.beetles b
    where b.id = soil_change_events.beetle_id
      and app.can_read_farm(b.farm_id)
  )
);

drop policy if exists soil_events_write_by_parent on public.soil_change_events;
create policy soil_events_write_by_parent on public.soil_change_events
for all
using (
  app.request_role() = 'service_role'
  or exists (
    select 1 from public.beetles b
    where b.id = soil_change_events.beetle_id
      and app.can_write_farm(b.farm_id)
  )
)
with check (
  app.request_role() = 'service_role'
  or exists (
    select 1 from public.beetles b
    where b.id = soil_change_events.beetle_id
      and app.can_write_farm(b.farm_id)
  )
);

insert into public.farms (name, timezone, is_default)
select 'Default Farm', 'Asia/Bangkok', true
where not exists (select 1 from public.farms where is_default = true);
