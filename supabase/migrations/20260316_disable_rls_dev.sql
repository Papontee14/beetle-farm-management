-- Development-only emergency fix
-- Temporarily disable RLS to unblock local testing.
-- Run in Supabase SQL Editor, then restart Next.js dev server.

alter table if exists public.farms disable row level security;
alter table if exists public.profiles disable row level security;
alter table if exists public.beetles disable row level security;
alter table if exists public.beetle_weight_logs disable row level security;
alter table if exists public.beetle_feeding_logs disable row level security;
alter table if exists public.beetle_health_records disable row level security;
alter table if exists public.soil_change_events disable row level security;

insert into public.farms (name, timezone, is_default)
select 'Default Farm', 'Asia/Bangkok', true
where not exists (select 1 from public.farms where is_default = true);
