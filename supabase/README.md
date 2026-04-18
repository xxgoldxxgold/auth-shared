# supabase/ — 共通 DDL

複数の Supabase プロジェクトで**共通して適用する** DDL 集。これは Supabase CLI の migrations ではない (migrations は各サービス固有)。

## 適用順

1. `schema.sql` — `shared_profiles` テーブル + `updated_at` 自動更新トリガー
2. `triggers.sql` — `on_auth_user_created` (auth.users → shared_profiles 自動作成)
3. `policies.sql` — RLS ポリシー

## 適用方法

Supabase Dashboard → SQL Editor に上から順にコピペして実行。または `psql` で:

`psql $SUPABASE_DB_URL -f schema.sql && psql $SUPABASE_DB_URL -f triggers.sql && psql $SUPABASE_DB_URL -f policies.sql`

## 重要な設計上の前提

- クライアント側から `shared_profiles` を直接 `insert` しない (RLS で拒否)。プロフィール作成はトリガー経由のみ。
- `web` / `reactnative` / `flutter` / `swift` パッケージの `autoCreateProfile` オプションはデフォルト `false`。トリガー適用前提。
- `auth.users` が削除されると `shared_profiles` も CASCADE で削除される。
- 他ユーザーのプロフィールを表示する機能が必要なサービスは、`policies.sql` の SELECT ポリシーを緩めて consumer 側で上書きする。
