# @xxgoldxxgold/auth-shared-reactnative

Expo / React Native 用の共通認証 UI。Supabase + Google/Apple OAuth + メール認証 + 共通プロフィール (`shared_profiles`)。

モノレポ `xxgoldxxgold/auth-shared` の `reactnative/` サブディレクトリ。

## インストール

consumer の `package.json` の `dependencies` に以下を追加:

- キー: `@xxgoldxxgold/auth-shared-reactnative`
- 値: `github:xxgoldxxgold/auth-shared#path:reactnative`

その後 `pnpm install` (または `npm install`)。

peer deps を満たすパッケージは consumer 側でインストール:

- `@supabase/supabase-js` (>=2.0.0)
- `expo-auth-session` (>=5.0.0)
- `expo-web-browser` (>=12.0.0)
- `react` (>=18.0.0)
- `react-native` (>=0.70.0)

## セットアップ

### 1. app.json に scheme を登録

OAuth 後の redirect 受け口になる custom scheme を `app.json` の `expo.scheme` に設定する。例: `"scheme": "myapp"` を指定すると `myapp://auth-callback` 的な redirect URI が生成可能になる。

### 2. Supabase の Redirect URLs に登録

Supabase Dashboard → Auth → URL Configuration → Redirect URLs に、1 の scheme を含む URI (例: `myapp://*`) を追加。

### 3. AuthProvider でアプリを囲む

`App.tsx` または root 相当のファイルで `AuthProvider` に `config` を渡す。

- `supabase`: 必須。`createClient()` で作った SupabaseClient
- `redirectUri`: 省略可。省略時は `expo-auth-session` の `makeRedirectUri()` のデフォルト (app.json の scheme から自動生成) を使用。明示する場合は Supabase の Redirect URLs に登録済みの URI を指定
- `autoCreateProfile`: 省略可。DB トリガーで `shared_profiles` を自動作成する設計なら `false` (デフォルト) のままでよい
- `signupSource`: 省略可。サービス名 (例: `"realinsta"`)。`shared_profiles.signup_source` に記録される
- `onLogin`, `onLogout`, `onNavigateAfterLogout`: 省略可。サービス固有の後処理フック

### 4. ログイン UI

`LoginForm` を任意の画面に配置すれば Google/Apple/メール のログイン UI が表示される。OAuth ボタンだけ欲しい場合は `OAuthButtons` を使用。

## 提供 API

- `<AuthProvider config={...}>` — ルートに置く
- `useAuth()` — `user`, `displayName`, `avatarUrl`, `loading`, `signIn*`, `signOut`, `resetPassword`, `refreshProfile` を返すフック
- `<LoginForm onSuccess?={() => void} title?={string} />` — メール + OAuth UI
- `<OAuthButtons />` — Google/Apple ボタンのみ

## バージョン

v2.0.0 — モノレポ構造化。以前の `@xxgoldxxgold/auth-shared-reactnative` (独立リポ v1.x) からの破壊的変更は設定では無いが、インストール URL が変わった。

## 同時リリース

`web`, `flutter`, `swift` (別リポ), `supabase` と同一バージョンで同時タグ。
