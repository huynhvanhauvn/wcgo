-- Enable pgcrypto for uuid generation
create extension if not exists pgcrypto;

-- Matches table
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

create policy "matches_select_authenticated" on public.matches
  for select
  using ( true );

create policy "matches_update_authenticated" on public.matches
  for update
  using ( auth.role() = 'authenticated' )
  with check ( auth.role() = 'authenticated' );

-- Predictions table
create table if not exists public.predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  match_id int not null references public.matches(id),
  predicted_a int not null,
  predicted_b int not null,
  created_at timestamptz default now()
);

-- User totals table
create table if not exists public.user_totals (
  user_id uuid primary key references auth.users(id),
  total int default 0
);

-- Row level security for predictions
alter table public.predictions enable row level security;

create policy "predictions_select_authenticated" on public.predictions
  for select
  using ( auth.role() = 'authenticated' );

create policy "predictions_insert_own" on public.predictions
  for insert
  with check ( auth.uid() = user_id );

create policy "predictions_update_own" on public.predictions
  for update
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

create policy "predictions_delete_own" on public.predictions
  for delete
  using ( auth.uid() = user_id );

-- Settlement function: computes points, updates user_totals, and marks match finished
create or replace function public.settle_match(p_match_id int, p_score_a int, p_score_b int)
returns table(out_user_id uuid, out_points int)
language plpgsql security definer as $$
declare
  rec record;
  base int;
  mult int;
  preddiff int;
  actualdiff int;
  points int;
begin
  -- update match
  update public.matches set score_a = p_score_a, score_b = p_score_b, status = 'FINISHED' where id = p_match_id;

  for rec in select * from public.predictions where match_id = p_match_id loop
    if rec.predicted_a = p_score_a and rec.predicted_b = p_score_b then
      base := 3;
    else
      preddiff := rec.predicted_a - rec.predicted_b;
      actualdiff := p_score_a - p_score_b;
      if preddiff = actualdiff then
        base := 2;
      elsif ( (rec.predicted_a = rec.predicted_b and p_score_a = p_score_b) or (rec.predicted_a > rec.predicted_b and p_score_a > p_score_b) or (rec.predicted_a < rec.predicted_b and p_score_a < p_score_b) ) then
        base := 1;
      else
        base := 0;
      end if;
    end if;

    if p_match_id between 73 and 102 then
      mult := 2;
    elsif p_match_id in (103,104) then
      mult := 3;
    else
      mult := 1;
    end if;

    points := base * mult;
    out_user_id := rec.user_id;
    out_points := points;

    insert into public.user_totals(user_id, total) values (rec.user_id, points)
      on conflict (user_id) do update set total = public.user_totals.total + excluded.total;

    return next;
  end loop;
end;
$$;

grant execute on function public.settle_match(int, int, int) to authenticated;
