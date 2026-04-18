-- shared_profiles: 全サービス共通プロフィール
-- auth.users と 1:1。ユーザー登録時に triggers.sql の on_auth_user_created が自動で insert する。

create table if not exists public.shared_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar_url text not null default '',
  signup_source text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shared_profiles_signup_source_idx
  on public.shared_profiles(signup_source);

-- updated_at を自動更新するための共通トリガー関数
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_shared_profiles_updated_at on public.shared_profiles;
create trigger set_shared_profiles_updated_at
  before update on public.shared_profiles
  for each row execute function public.set_updated_at();

alter table public.shared_profiles enable row level security;
