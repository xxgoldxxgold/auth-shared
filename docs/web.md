# Next.js 統合ガイド

パッケージ単体の使い方は `web/README.md` を参照。このドキュメントは Next.js App Router 固有の統合ヒント。

## 推奨ディレクトリ配置

- `app/providers.tsx` — Client Component。`<AuthProvider config={{ supabase, ... }}>` を置く
- `app/auth/callback/page.tsx` — Client Component。`useEffect(() => { handleAuthCallback(supabase, { redirectTo: '/dashboard' }) }, [])`
- `app/login/page.tsx` — `<LoginForm onSuccess={() => router.push('/dashboard')} />`

## Supabase クライアントの共有

`lib/supabase.ts` で `createClient(url, anonKey, { auth: { flowType: 'pkce', persistSession: true, detectSessionInUrl: false } })` を export。
`detectSessionInUrl: false` を推奨 (callback ページで手動処理するため)。

## ミドルウェアでの認証ガード

Server Component / Middleware で `supabase.auth.getUser()` を使って認証状態を確認。Next.js の `@supabase/ssr` パッケージ併用を推奨。本パッケージはクライアント側の UI のみ提供。

## ログアウト後の遷移

`redirectAfterLogout` で指定した URL にフルリロード (`window.location.href = ...`)。`router.push()` ではなくフルリロードにする理由は、Server Component のキャッシュを確実にクリアするため。
