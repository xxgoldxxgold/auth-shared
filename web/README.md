# @xxgoldxxgold/auth-shared-web

Next.js / React 用の共通認証 UI。Supabase + Google/Apple OAuth + メール認証 + 共通プロフィール (`shared_profiles`)。

モノレポ `xxgoldxxgold/auth-shared` の `web/` サブディレクトリ。

## インストール

consumer の `package.json` の `dependencies` に以下を追加:

- キー: `@xxgoldxxgold/auth-shared-web`
- 値: `github:xxgoldxxgold/auth-shared#path:web`

その後 `pnpm install` (または `npm install`)。

peer deps を満たすパッケージは consumer 側でインストール:

- `@supabase/supabase-js` (>=2.0.0)
- `react` (>=18.0.0)
- `next` (>=14.0.0)

## セットアップ

### 1. Supabase の Redirect URLs に登録

Supabase Dashboard → Auth → URL Configuration → Redirect URLs に、以下を追加:

- `https://yourapp.example.com/auth/callback`
- `http://localhost:3000/auth/callback` (ローカル開発用)

本パッケージは OAuth / メール確認 / パスワードリセット のすべてで `{origin}/auth/callback` をコールバック URL として使う。

### 2. AuthProvider でアプリを囲む

`app/providers.tsx` (Client Component) で `AuthProvider` に `config` を渡す。設定項目:

- `supabase`: 必須。`createClient()` で作った SupabaseClient
- `redirectAfterLogout`: 省略可。ログアウト後のリダイレクト先 URL (デフォルト: `'/'`)
- `oauthRedirectUrl`: 省略可。OAuth / メール確認 / パスワードリセットの戻り先 URL (デフォルト: `${window.location.origin}/auth/callback`)。consumer 側のコールバックページの URL が `/auth/callback` 以外の場合はここで指定
- `autoCreateProfile`: 省略可。`shared_profiles` を自動作成するか (デフォルト: `false`。`supabase/triggers.sql` 適用前提)
- `signupSource`: 省略可。サービス名。`shared_profiles.signup_source` に記録
- `onLogin`, `onLogout`: 省略可。サービス固有の後処理フック

### 3. コールバックページ

`app/auth/callback/page.tsx` で `handleAuthCallback(supabase, { redirectTo: '/dashboard' })` を `useEffect` で呼び出す。

### 4. ログインページ

`app/login/page.tsx` で `<LoginForm onSuccess={() => router.push('/dashboard')} />` を配置。

## 提供 API

- `<AuthProvider config={...}>` — ルートに置く
- `useAuth()` — `user`, `displayName`, `avatarUrl`, `loading`, `signIn*`, `signOut`, `resetPassword`, `refreshProfile` を返すフック
- `<LoginForm onSuccess?={() => void} />` — メール + OAuth UI
- `<OAuthButtons />` — Google/Apple ボタンのみ
- `handleAuthCallback(supabase, { redirectTo?, onError? })` — コールバックページで呼ぶヘルパー

## v1.0.0 からの変更

- 名前空間を `@xxgoldxxgold/auth-shared` から `@xxgoldxxgold/auth-shared-web` へ変更 (モノレポ構造化に伴う)
- 未使用だった `signInWithOAuthOverride` と `onNavigateAfterLogout` を AuthConfig から削除
- `signupSource` が `ensureProfile` の insert に反映されるよう修正
- `autoCreateProfile` のデフォルトを `true` → `false` に変更 (DB トリガー適用を前提とする設計に統一)

## 同時リリース

`reactnative`, `flutter`, `swift` (別リポ), `supabase` と同一バージョンで同時タグ。
