# Supabase DB 設計ガイド

`supabase/README.md` が基本。このドキュメントは設計の意図と運用上の注意。

## shared_profiles の役割

全サービスで共通の「ユーザー基本情報」を一元化する。display_name / avatar_url / signup_source (どのサービスから登録されたか) のみを保持し、サービス固有の拡張フィールドは各サービスが別テーブルで持つ。

## なぜトリガー経由の INSERT なのか

- クライアントから直接 INSERT すると RLS ポリシー設計が複雑になる (自分の uid と一致する行のみ insert 可にしつつ悪意ある値を弾く必要がある)
- `auth.users` に insert された瞬間に確実にプロフィールが存在することを保証できる
- SECURITY DEFINER で実行されるので RLS に抵触しない

## RLS ポリシーの緩め方

他ユーザーのプロフィールを表示する機能が必要な場合、`policies.sql` の `shared_profiles_select_own` を以下に置き換える:

- `using (true)` — 認証ユーザーに全行 select 許可
- `using (auth.uid() is not null)` — 同上だが意図が明示的

この変更は consumer 側のサービス固有 SQL として管理し、モノレポ側は strict のままにする。

## 移行時の注意

既存サービスで `shared_profiles` を違うスキーマで運用している場合、カラム追加は後方互換、カラム削除は破壊的。本 DDL は `create table if not exists` なので既存テーブルは変更しないが、トリガーは `create or replace` なので上書きされる。

## 複数 Supabase プロジェクトでの運用

各サービスが独自の Supabase プロジェクトを持つ設計 (`config/auth-shared.md` 参照)。本 DDL は新規プロジェクト作成時に 1 回流す前提。その後の変更は別途マイグレーション管理。
