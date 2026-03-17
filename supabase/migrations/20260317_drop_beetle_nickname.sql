-- Remove nickname field from beetles
alter table if exists public.beetles
drop column if exists name;