# Expo / React Native 統合ガイド

パッケージ単体の使い方は `reactnative/README.md` を参照。このドキュメントは Expo 固有の統合ヒント。

## app.json の scheme 設定

`expo.scheme` にサービス固有の文字列を指定 (例: `"scheme": "myapp"`)。これが OAuth の redirect URI のベースになる。

`expo-auth-session` の `makeRedirectUri()` は `app.json` の scheme を使って `myapp://` 形式の URI を自動生成する。本パッケージの `config.redirectUri` を省略すればこれが使われる。

明示したい場合は `config.redirectUri = 'myapp://auth-callback'` のように指定し、Supabase の Redirect URLs に登録する。

## Supabase クライアントの設定

`AsyncStorage` をセッション永続化に使う。`createClient(url, anonKey, { auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false } })`。

## OAuth フロー

本パッケージの `signInWithGoogle` / `signInWithApple` は以下を実行:

1. `supabase.auth.signInWithOAuth({ provider, options: { redirectTo, skipBrowserRedirect: true } })` で認証 URL を取得
2. `WebBrowser.openAuthSessionAsync(url, redirectTo)` でシステムブラウザを開く
3. コールバック URL から `access_token` / `refresh_token` または `code` を取り出す
4. `setSession` または `exchangeCodeForSession` でセッション確立

consumer 側で追加コールバックページを用意する必要はない (`openAuthSessionAsync` が閉じた時点で処理完了)。

## 未使用の RN dep 処理

real-insta のように RN app が `auth-shared-reactnative` を package.json に入れているが未使用のケースでは、依存 URL の更新のみで OK。import を追加しない限り bundle には含まれない。
