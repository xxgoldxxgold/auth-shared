-- shared_profiles の RLS ポリシー
-- 設計方針:
--   SELECT: 自分の行のみ。他ユーザーのプロフィールを見る機能が必要なら consumer 側で緩める。
--   INSERT: トリガー (security definer) のみ。認証ユーザーの直接 insert は禁止。
--   UPDATE: 自分の行のみ。
--   DELETE: 禁止 (auth.users の CASCADE で連動削除)。

alter table public.shared_profiles enable row level security;

drop policy if exists shared_profiles_select_own on public.shared_profiles;
create policy shared_profiles_select_own
  on public.shared_profiles
  for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists shared_profiles_update_own on public.shared_profiles;
create policy shared_profiles_update_own
  on public.shared_profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- INSERT / DELETE はポリシーを作らないことで実質禁止 (RLS 有効時、ポリシー無し = 拒否)。
-- insert はトリガー (handle_auth_user_created, security definer) のみが実行可能。
