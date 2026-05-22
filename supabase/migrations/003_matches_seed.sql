create table if not exists public.matches (
  id int primary key,
  team_a text not null,
  team_b text not null,
  start_time timestamptz not null,
  venue text,
  status text not null default 'SCHEDULED',
  score_a int,
  score_b int
);

alter table public.matches enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'matches'
      and policyname = 'matches_select_authenticated'
  ) then
    create policy "matches_select_authenticated" on public.matches
      for select
      using ( true );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'matches'
      and policyname = 'matches_update_authenticated'
  ) then
    create policy "matches_update_authenticated" on public.matches
      for update
      using ( auth.role() = 'authenticated' )
      with check ( auth.role() = 'authenticated' );
  end if;
end $$;

insert into public.matches (id, team_a, team_b, start_time, venue, status)
values
  (1, 'Group A Team 1', 'Group A Team 2', '2026-06-11 19:00:00+00', 'Stadium 1', 'SCHEDULED'),
  (2, 'Group B Team 1', 'Group B Team 2', '2026-06-12 00:00:00+00', 'Stadium 2', 'SCHEDULED'),
  (3, 'Group C Team 1', 'Group C Team 2', '2026-06-12 19:00:00+00', 'Stadium 3', 'SCHEDULED'),
  (4, 'Group D Team 1', 'Group D Team 2', '2026-06-13 00:00:00+00', 'Stadium 4', 'SCHEDULED'),
  (5, 'Group E Team 1', 'Group E Team 2', '2026-06-13 19:00:00+00', 'Stadium 5', 'SCHEDULED'),
  (6, 'Group F Team 1', 'Group F Team 2', '2026-06-14 00:00:00+00', 'Stadium 6', 'SCHEDULED'),
  (7, 'Group G Team 1', 'Group G Team 2', '2026-06-14 19:00:00+00', 'Stadium 7', 'SCHEDULED'),
  (8, 'Group H Team 1', 'Group H Team 2', '2026-06-15 00:00:00+00', 'Stadium 8', 'SCHEDULED')
on conflict (id) do nothing;
