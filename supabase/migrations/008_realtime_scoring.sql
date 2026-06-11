-- Update settle_match to be more flexible (accept status)
create or replace function public.settle_match(p_match_id int, p_score_a int, p_score_b int, p_status text default 'FINISHED')
returns table(out_user_id uuid, out_points int)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  rec record;
  base int;
  mult int;
  preddiff int;
  actualdiff int;
  old_points int;
  point_delta int;
  points int;
begin
  if not public.is_admin_user() then
    raise exception 'Only admins can settle matches';
  end if;

  -- update match with dynamic status
  update public.matches
  set score_a = p_score_a,
      score_b = p_score_b,
      status = p_status
  where id = p_match_id;

  for rec in select * from public.predictions where match_id = p_match_id loop
    -- Scoring Logic
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

    -- Multiplier
    if p_match_id between 73 and 102 then
      mult := 2;
    elsif p_match_id in (103, 104) then
      mult := 3;
    else
      mult := 1;
    end if;

    points := base * mult;
    out_user_id := rec.user_id;
    out_points := points;

    -- Get previous points stored for this match
    select coalesce(mp.points, 0)
    into old_points
    from public.match_points mp
    where mp.match_id = p_match_id
      and mp.user_id = rec.user_id;

    -- Calculate delta
    point_delta := points - coalesce(old_points, 0);

    -- Update match_points table
    insert into public.match_points(match_id, user_id, points, updated_at)
    values (p_match_id, rec.user_id, points, now())
    on conflict (match_id, user_id)
    do update set points = excluded.points, updated_at = now();

    -- Update user_totals (add/subtract delta)
    insert into public.user_totals(user_id, total)
    values (rec.user_id, point_delta)
    on conflict (user_id)
    do update set total = public.user_totals.total + excluded.total;

    return next;
  end loop;
end;
$$;
