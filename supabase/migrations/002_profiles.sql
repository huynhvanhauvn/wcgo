-- Profiles table to store display name and avatar for users
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id),
  username text,
  display_name text,
  avatar_url text,
  is_admin boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_authenticated" on public.profiles
  for select
  using ( auth.role() = 'authenticated' );

create policy "profiles_insert_own" on public.profiles
  for insert
  with check ( auth.uid() = user_id );

create policy "profiles_update_own" on public.profiles
  for update
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

create policy "profiles_delete_own" on public.profiles
  for delete
  using ( auth.uid() = user_id );
