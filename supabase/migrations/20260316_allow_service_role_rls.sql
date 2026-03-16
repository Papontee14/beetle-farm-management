-- Patch existing Supabase projects to allow server-side service_role requests
-- to pass RLS helper checks used by the API routes.

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
