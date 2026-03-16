-- Beetle Farm Management initial schema for Supabase
-- Includes: enums, tables, indexes, RLS policies, and triggers

create extension if not exists pgcrypto;

create schema if not exists app;

-- ---------- Enums ----------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'beetle_stage') then
    create type public.beetle_stage as enum ('Egg', 'L1', 'L2', 'L3', 'Pupa', 'Adult');
  end if;

  if not exists (select 1 from pg_type where typname = 'beetle_status') then
    create type public.beetle_status as enum ('Healthy', 'Sick', 'Dead', 'Sold');
  end if;

  if not exists (select 1 from pg_type where typname = 'beetle_sex') then
    create type public.beetle_sex as enum ('Male', 'Female', 'Unknown');
  end if;

  if not exists (select 1 from pg_type where typname = 'health_record_type') then
    create type public.health_record_type as enum ('Vaccine', 'Deworming', 'Illness', 'Treatment', 'Observation');
  end if;

  if not exists (select 1 from pg_type where typname = 'farm_role') then
    create type public.farm_role as enum ('owner', 'staff', 'viewer');
  end if;
end
$$;

-- ---------- Tables ----------
create table if not exists public.farms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null default 'Asia/Bangkok',
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  farm_id uuid not null references public.farms(id) on delete cascade,
  role public.farm_role not null default 'viewer',
  created_at timestamptz not null default now()
);

create table if not exists public.beetles (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  beetle_code text not null,
  name text,
  species text not null,
  lineage text,
  sex public.beetle_sex not null default 'Unknown',
  stage public.beetle_stage not null default 'L1',
  status public.beetle_status not null default 'Healthy',
  birth_date date,
  entry_date date not null default current_date,
  container_code text not null,
  current_weight_grams numeric(8,2),
  quantity integer not null default 1 check (quantity > 0),
  length_mm numeric(8,2),
  emergence_date date,
  first_feeding_date date,
  parent_info jsonb,
  last_soil_change date,
  next_soil_change date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint beetles_unique_code_per_farm unique (farm_id, beetle_code)
);

create table if not exists public.beetle_weight_logs (
  id uuid primary key default gen_random_uuid(),
  beetle_id uuid not null references public.beetles(id) on delete cascade,
  weight numeric(8,2) not null check (weight >= 0),
  measured_at timestamptz not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.beetle_feeding_logs (
  id uuid primary key default gen_random_uuid(),
  beetle_id uuid not null references public.beetles(id) on delete cascade,
  fed_at timestamptz not null,
  feed_type text not null,
  amount_grams numeric(8,2) not null check (amount_grams >= 0),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.beetle_health_records (
  id uuid primary key default gen_random_uuid(),
  beetle_id uuid not null references public.beetles(id) on delete cascade,
  recorded_at timestamptz not null,
  type public.health_record_type not null,
  description text not null,
  treated_by text,
  medication text,
  next_follow_up date,
  created_at timestamptz not null default now()
);

create table if not exists public.soil_change_events (
  id uuid primary key default gen_random_uuid(),
  beetle_id uuid not null references public.beetles(id) on delete cascade,
  changed_at timestamptz not null default now(),
  days_until_next integer not null default 30 check (days_until_next > 0),
  next_soil_change date not null,
  note text,
  created_at timestamptz not null default now()
);

-- ---------- Indexes ----------
create index if not exists idx_profiles_farm_id on public.profiles(farm_id);

create index if not exists idx_beetles_farm_stage on public.beetles(farm_id, stage);
create index if not exists idx_beetles_farm_status on public.beetles(farm_id, status);
create index if not exists idx_beetles_farm_next_soil on public.beetles(farm_id, next_soil_change);
create index if not exists idx_beetles_farm_species on public.beetles(farm_id, species);
create index if not exists idx_beetles_farm_container on public.beetles(farm_id, container_code);
create index if not exists idx_beetles_parent_info_gin on public.beetles using gin(parent_info);

create index if not exists idx_weight_logs_beetle_time on public.beetle_weight_logs(beetle_id, measured_at desc);
create index if not exists idx_feeding_logs_beetle_time on public.beetle_feeding_logs(beetle_id, fed_at desc);
create index if not exists idx_health_logs_beetle_time on public.beetle_health_records(beetle_id, recorded_at desc);
create index if not exists idx_soil_events_beetle_time on public.soil_change_events(beetle_id, changed_at desc);

-- ---------- Helper Functions ----------
create or replace function app.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end
$$;

create or replace function app.sync_beetle_current_weight()
returns trigger
language plpgsql
as $$
declare
  target_beetle_id uuid;
begin
  target_beetle_id := coalesce(new.beetle_id, old.beetle_id);

  update public.beetles b
  set current_weight_grams = (
    select wl.weight
    from public.beetle_weight_logs wl
    where wl.beetle_id = target_beetle_id
    order by wl.measured_at desc
    limit 1
  )
  where b.id = target_beetle_id;

  return null;
end
$$;

create or replace function app.apply_soil_change_event()
returns trigger
language plpgsql
as $$
begin
  update public.beetles b
  set
    last_soil_change = (new.changed_at at time zone 'UTC')::date,
    next_soil_change = new.next_soil_change
  where b.id = new.beetle_id;

  return new;
end
$$;

create or replace function app.current_farm_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.farm_id
  from public.profiles p
  where p.id = auth.uid()
$$;

create or replace function app.can_write_farm(target_farm_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth.role() = 'service_role', false)
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
  select coalesce(auth.role() = 'service_role', false)
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.farm_id = target_farm_id
    )
$$;

-- ---------- Triggers ----------
drop trigger if exists trg_beetles_set_updated_at on public.beetles;
create trigger trg_beetles_set_updated_at
before update on public.beetles
for each row execute function app.set_updated_at();

drop trigger if exists trg_weight_sync_after_insert on public.beetle_weight_logs;
create trigger trg_weight_sync_after_insert
after insert on public.beetle_weight_logs
for each row execute function app.sync_beetle_current_weight();

drop trigger if exists trg_weight_sync_after_update on public.beetle_weight_logs;
create trigger trg_weight_sync_after_update
after update on public.beetle_weight_logs
for each row execute function app.sync_beetle_current_weight();

drop trigger if exists trg_weight_sync_after_delete on public.beetle_weight_logs;
create trigger trg_weight_sync_after_delete
after delete on public.beetle_weight_logs
for each row execute function app.sync_beetle_current_weight();

drop trigger if exists trg_soil_event_apply on public.soil_change_events;
create trigger trg_soil_event_apply
after insert on public.soil_change_events
for each row execute function app.apply_soil_change_event();

-- ---------- Row Level Security ----------
alter table public.farms enable row level security;
alter table public.profiles enable row level security;
alter table public.beetles enable row level security;
alter table public.beetle_weight_logs enable row level security;
alter table public.beetle_feeding_logs enable row level security;
alter table public.beetle_health_records enable row level security;
alter table public.soil_change_events enable row level security;

-- farms
create policy farms_select_own on public.farms
for select
using (app.can_read_farm(id));

create policy farms_write_own on public.farms
for all
using (app.can_write_farm(id))
with check (app.can_write_farm(id));

-- profiles
create policy profiles_select_same_farm on public.profiles
for select
using (app.can_read_farm(farm_id));

drop policy if exists profiles_write_owner on public.profiles;
create policy profiles_write_owner on public.profiles
for all
using (
  coalesce(auth.role() = 'service_role', false)
  or exists (
    select 1
    from public.profiles me
    where me.id = auth.uid()
      and me.farm_id = profiles.farm_id
      and me.role = 'owner'
  )
)
with check (
  coalesce(auth.role() = 'service_role', false)
  or exists (
    select 1
    from public.profiles me
    where me.id = auth.uid()
      and me.farm_id = profiles.farm_id
      and me.role = 'owner'
  )
);

-- beetles
create policy beetles_select_same_farm on public.beetles
for select
using (app.can_read_farm(farm_id));

create policy beetles_insert_same_farm on public.beetles
for insert
with check (app.can_write_farm(farm_id));

create policy beetles_update_same_farm on public.beetles
for update
using (app.can_write_farm(farm_id))
with check (app.can_write_farm(farm_id));

create policy beetles_delete_same_farm on public.beetles
for delete
using (app.can_write_farm(farm_id));

-- child table policy helper: user must have access to parent beetle farm
create policy weight_logs_select_by_parent on public.beetle_weight_logs
for select
using (
  exists (
    select 1 from public.beetles b
    where b.id = beetle_weight_logs.beetle_id
      and app.can_read_farm(b.farm_id)
  )
);

create policy weight_logs_write_by_parent on public.beetle_weight_logs
for all
using (
  exists (
    select 1 from public.beetles b
    where b.id = beetle_weight_logs.beetle_id
      and app.can_write_farm(b.farm_id)
  )
)
with check (
  exists (
    select 1 from public.beetles b
    where b.id = beetle_weight_logs.beetle_id
      and app.can_write_farm(b.farm_id)
  )
);

create policy feeding_logs_select_by_parent on public.beetle_feeding_logs
for select
using (
  exists (
    select 1 from public.beetles b
    where b.id = beetle_feeding_logs.beetle_id
      and app.can_read_farm(b.farm_id)
  )
);

create policy feeding_logs_write_by_parent on public.beetle_feeding_logs
for all
using (
  exists (
    select 1 from public.beetles b
    where b.id = beetle_feeding_logs.beetle_id
      and app.can_write_farm(b.farm_id)
  )
)
with check (
  exists (
    select 1 from public.beetles b
    where b.id = beetle_feeding_logs.beetle_id
      and app.can_write_farm(b.farm_id)
  )
);

create policy health_records_select_by_parent on public.beetle_health_records
for select
using (
  exists (
    select 1 from public.beetles b
    where b.id = beetle_health_records.beetle_id
      and app.can_read_farm(b.farm_id)
  )
);

create policy health_records_write_by_parent on public.beetle_health_records
for all
using (
  exists (
    select 1 from public.beetles b
    where b.id = beetle_health_records.beetle_id
      and app.can_write_farm(b.farm_id)
  )
)
with check (
  exists (
    select 1 from public.beetles b
    where b.id = beetle_health_records.beetle_id
      and app.can_write_farm(b.farm_id)
  )
);

create policy soil_events_select_by_parent on public.soil_change_events
for select
using (
  exists (
    select 1 from public.beetles b
    where b.id = soil_change_events.beetle_id
      and app.can_read_farm(b.farm_id)
  )
);

create policy soil_events_write_by_parent on public.soil_change_events
for all
using (
  exists (
    select 1 from public.beetles b
    where b.id = soil_change_events.beetle_id
      and app.can_write_farm(b.farm_id)
  )
)
with check (
  exists (
    select 1 from public.beetles b
    where b.id = soil_change_events.beetle_id
      and app.can_write_farm(b.farm_id)
  )
);

-- ---------- Seed default farm ----------
insert into public.farms (name, timezone, is_default)
select 'Default Farm', 'Asia/Bangkok', true
where not exists (select 1 from public.farms where is_default = true);
