-- 1. Đảm bảo bảng profiles có đầy đủ các cột cần thiết cho logic App
alter table public.profiles
  add column if not exists is_verified boolean not null default false,
  add column if not exists is_deleted boolean not null default false,
  add column if not exists real_name text,
  add column if not exists deletion_status text,
  add column if not exists deletion_requested_at timestamptz;

-- 2. Cập nhật hàm settle_match để đảm bảo logic tính điểm an toàn và chính xác
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
  -- Kiểm tra quyền admin
  if not exists (select 1 from public.profiles where user_id = auth.uid() and is_admin = true) then
    raise exception 'Only admins can settle matches';
  end if;

  -- Cập nhật thông tin trận đấu
  update public.matches
  set score_a = p_score_a,
      score_b = p_score_b,
      status = p_status
  where id = p_match_id;

  -- Lặp qua tất cả dự đoán của trận này
  for rec in select * from public.predictions where match_id = p_match_id loop
    -- Tính điểm cơ sở (Base points)
    -- 3đ: Đúng tỉ số chính xác
    if rec.predicted_a = p_score_a and rec.predicted_b = p_score_b then
      base := 3;
    else
      preddiff := rec.predicted_a - rec.predicted_b;
      actualdiff := p_score_a - p_score_b;

      -- 2đ: Đúng đội thắng/thắng-hòa-thua VÀ đúng cách biệt (Goal Difference)
      -- Lưu ý: Nếu là hòa (diff=0) mà sai tỉ số thì tính 1đ (để phân biệt với đúng cách biệt thắng)
      if preddiff = actualdiff and actualdiff <> 0 then
        base := 2;
      -- 1đ: Chỉ đúng kết quả Thắng/Hòa/Thua
      elsif (
        (rec.predicted_a = rec.predicted_b and p_score_a = p_score_b) -- Hòa sai tỉ số
        or (rec.predicted_a > rec.predicted_b and p_score_a > p_score_b) -- Đúng đội A thắng
        or (rec.predicted_a < rec.predicted_b and p_score_a < p_score_b) -- Đúng đội B thắng
      ) then
        base := 1;
      else
        base := 0;
      end if;
    end if;

    -- Hệ số nhân theo vòng đấu (Multipliers)
    -- Vòng bảng: x1, Vòng Knockout: x2, Chung kết/Hạng 3: x3
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

    -- Xử lý cập nhật điểm số (Real-time delta)
    -- Lấy điểm cũ đã lưu (nếu có)
    select coalesce(mp.points, 0)
    into old_points
    from public.match_points mp
    where mp.match_id = p_match_id
      and mp.user_id = rec.user_id;

    point_delta := points - old_points;

    -- Cập nhật bảng chi tiết điểm từng trận
    insert into public.match_points(match_id, user_id, points, updated_at)
    values (p_match_id, rec.user_id, points, now())
    on conflict (match_id, user_id)
    do update set points = excluded.points, updated_at = now();

    -- Cập nhật tổng điểm tích lũy của user
    insert into public.user_totals(user_id, total)
    values (rec.user_id, points) -- Nếu chưa có thì khởi tạo bằng points luôn
    on conflict (user_id)
    do update set total = coalesce(public.user_totals.total, 0) + point_delta;

    return next;
  end loop;
end;
$$;
