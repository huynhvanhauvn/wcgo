alter table public.matches
add column if not exists elapsed int,
add column if not exists period text;
