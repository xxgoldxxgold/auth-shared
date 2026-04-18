# auth_shared (Flutter)

Flutter 用の共通認証パッケージ。Supabase + Google/Apple OAuth + メール認証 + 共通プロフィール (`shared_profiles`)。

モノレポ `xxgoldxxgold/auth-shared` の `flutter/` サブディレクトリ。

## インストール

consumer の `pubspec.yaml` の `dependencies` に以下を追加:

- 名前: `auth_shared`
- 値 (YAML): `git` の下に `url: https://github.com/xxgoldxxgold/auth-shared.git` と `path: flutter` を指定

その後 `flutter pub get`。

## セットアップ

### 1. Deep-link URL を決める

サービス固有の scheme + path を決める。例: `com.example.myapp://login-callback`。

iOS (`ios/Runner/Info.plist`): `CFBundleURLTypes` にカスタム scheme を登録。

Android (`android/app/src/main/AndroidManifest.xml`): `<intent-filter>` に `<data android:scheme="..." />` を追加。

詳細は supabase_flutter の deep-link セットアップガイドを参照。

### 2. Supabase の Redirect URLs に登録

Supabase Dashboard → Auth → URL Configuration → Redirect URLs に、上記 deep-link URL を追加。

### 3. AuthManager を作成

アプリ起動時に `Supabase.initialize(...)` の後、`AuthManager` を以下で作成:

- `supabase`: 必須。`Supabase.instance.client`
- `redirectUrl`: 必須。1 で決めた deep-link URL を渡す

`AuthManager` は `ChangeNotifier` なので `Provider` などに組み合わせて使える。

### 4. ログイン UI

`LoginForm(authManager: ...)` でメール + OAuth UI。OAuth のみなら `OAuthButtons(authManager: ...)`。

## 提供 API

- `AuthManager({required supabase, required redirectUrl})` — 認証状態の管理
- `LoginForm({required authManager, onSuccess?})` — メール + OAuth UI
- `OAuthButtons({required authManager})` — Google/Apple ボタンのみ

## v1.0.0 からの破壊的変更

- `AuthManager(_supabase)` → `AuthManager({required supabase, required redirectUrl})` に変更。redirectUrl が必須化 (以前は `io.supabase.flutter://login-callback` にハードコードされており、Supabase 許可リストに登録されていない URL が使われる問題があった)。

## 同時リリース

`web`, `reactnative`, `swift` (別リポ), `supabase` と同一バージョンで同時タグ。
