-- on_auth_user_created: 新規ユーザー登録時に shared_profiles を自動作成
-- auth.users への insert 後に発火。user_metadata から display_name と avatar_url を拾う。

create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_display_name text;
  v_avatar_url text;
  v_signup_source text;
begin
  v_display_name := coalesce(
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(coalesce(new.email, ''), '@', 1),
    ''
  );
  v_avatar_url := coalesce(new.raw_user_meta_data->>'avatar_url', '');
  v_signup_source := coalesce(new.raw_user_meta_data->>'signup_source', '');

  insert into public.shared_profiles (id, display_name, avatar_url, signup_source)
  values (new.id, v_display_name, v_avatar_url, v_signup_source)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_auth_user_created();
