# auth-shared

全サービス・全プラットフォーム共通の認証基盤。Supabase + Google/Apple OAuth + メール認証 + 共通プロフィール (`shared_profiles`)。

## 構成

| ディレクトリ | 用途 | パッケージマネージャ |
|---|---|---|
| `web/` | Next.js (React) 用 UI | npm/pnpm (github: 経由) |
| `reactnative/` | Expo/React Native 用 UI | npm/pnpm (github: 経由) |
| `flutter/` | Flutter 用 UI | pub (git: 経由) |
| `supabase/` | 共通 DDL / トリガー / RLS ポリシー | psql で各プロジェクトに適用 |
| `docs/` | 統合ガイド・プラットフォーム別セットアップ | — |

Swift 版は別リポジトリ `xxgoldxxgold/auth-shared-swift` (SPM の制約により分離)。

## バージョン戦略

モノレポ内 4 パッケージは同一バージョンで同時リリース。Swift も同バージョンで同時タグ。CHANGELOG に明記。

## インストール

### Next.js

consumer の `package.json` の `dependencies` に `"@xxgoldxxgold/auth-shared": "github:xxgoldxxgold/auth-shared#path:web"` を追加。

### Expo / React Native

consumer の `package.json` の `dependencies` に `"@xxgoldxxgold/auth-shared": "github:xxgoldxxgold/auth-shared#path:reactnative"` を追加。

### Flutter

consumer の `pubspec.yaml` の `dependencies` に `auth_shared: { git: { url: https://github.com/xxgoldxxgold/auth-shared.git, path: flutter } }` を追加。

### Swift

consumer の `Package.swift` の `dependencies` に `.package(url: "https://github.com/xxgoldxxgold/auth-shared-swift.git", from: "2.0.0")` を追加。

### Supabase DB

`supabase/schema.sql`, `supabase/triggers.sql`, `supabase/policies.sql` を Supabase プロジェクトに適用。これは**共通 DDL** であり Supabase CLI の migrations ではない。複数の Supabase プロジェクトで再利用する前提。

## ドキュメント

- `docs/setup.md` — 新サービス追加時の手順
- `docs/web.md` — Next.js 統合ガイド
- `docs/reactnative.md` — Expo 統合ガイド
- `docs/flutter.md` — Flutter 統合ガイド
- `docs/swift.md` — Swift 統合ガイド (別リポだが docs は本リポに集約)
- `docs/supabase.md` — DB 設計と Supabase 設定

## ライセンス

MIT
