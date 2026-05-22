create table if not exists public.match_points (
  match_id int not null references public.matches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  points int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (match_id, user_id)
);

alter table public.match_points enable row level security;

drop policy if exists "match_points_select_authenticated" on public.match_points;
create policy "match_points_select_authenticated" on public.match_points
  for select
  using (auth.role() = 'authenticated');

create or replace function public.is_admin_user()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.profiles
    where user_id = auth.uid()
      and is_admin = true
  );
$$;

create or replace function public.settle_match(p_match_id int, p_score_a int, p_score_b int)
returns table(user_id uuid, points int)
language plpgsql
security definer
as $$
declare
  rec record;
  base int;
  mult int;
  preddiff int;
  actualdiff int;
  old_points int;
  point_delta int;
begin
  if not public.is_admin_user() then
    raise exception 'Only admins can settle matches';
  end if;

  update public.matches
  set score_a = p_score_a,
      score_b = p_score_b,
      status = 'FINISHED'
  where id = p_match_id;

  for rec in select * from public.predictions where match_id = p_match_id loop
    if rec.predicted_a = p_score_a and rec.predicted_b = p_score_b then
      base := 3;
    else
      preddiff := rec.predicted_a - rec.predicted_b;
      actualdiff := p_score_a - p_score_b;
      if preddiff = actualdiff then
        base := 2;
      elsif (
        (rec.predicted_a = rec.predicted_b and p_score_a = p_score_b)
        or (rec.predicted_a > rec.predicted_b and p_score_a > p_score_b)
        or (rec.predicted_a < rec.predicted_b and p_score_a < p_score_b)
      ) then
        base := 1;
      else
        base := 0;
      end if;
    end if;

    if p_match_id between 73 and 102 then
      mult := 2;
    elsif p_match_id in (103, 104) then
      mult := 3;
    else
      mult := 1;
    end if;

    points := base * mult;
    user_id := rec.user_id;

    select coalesce(mp.points, 0)
    into old_points
    from public.match_points mp
    where mp.match_id = p_match_id
      and mp.user_id = rec.user_id;

    point_delta := points - coalesce(old_points, 0);

    insert into public.match_points(match_id, user_id, points, updated_at)
    values (p_match_id, rec.user_id, points, now())
    on conflict (match_id, user_id)
    do update set points = excluded.points, updated_at = now();

    insert into public.user_totals(user_id, total)
    values (rec.user_id, point_delta)
    on conflict (user_id)
    do update set total = public.user_totals.total + excluded.total;

    return next;
  end loop;
end;
$$;

create or replace function public.reset_match(p_match_id int)
returns void
language plpgsql
security definer
as $$
declare
  rec record;
begin
  if not public.is_admin_user() then
    raise exception 'Only admins can reset matches';
  end if;

  for rec in select * from public.match_points where match_id = p_match_id loop
    update public.user_totals
    set total = greatest(0, total - rec.points)
    where user_id = rec.user_id;
  end loop;

  delete from public.match_points
  where match_id = p_match_id;

  update public.matches
  set score_a = null,
      score_b = null,
      status = 'SCHEDULED'
  where id = p_match_id;
end;
$$;

grant execute on function public.is_admin_user() to authenticated;
grant execute on function public.settle_match(int, int, int) to authenticated;
grant execute on function public.reset_match(int) to authenticated;
