# 新サービス追加時のセットアップ手順

新規サービスで `auth-shared` を導入する際の手順。プラットフォーム共通部分と固有部分に分かれる。

## 1. Supabase プロジェクト作成

Supabase Dashboard で新規プロジェクトを作成。プロジェクト URL と `anon` キーを控える。

## 2. 共通 DDL の適用

`supabase/schema.sql`, `supabase/triggers.sql`, `supabase/policies.sql` をこの順で SQL Editor から実行。`supabase/README.md` 参照。

## 3. OAuth プロバイダの設定

Supabase Dashboard → Auth → Providers で Google / Apple を有効化。

- Google: Cloud Console で OAuth 2.0 クライアント ID を発行、Supabase に Client ID / Secret を設定。
- Apple: Apple Developer で Service ID と Private Key を発行、Supabase に Service ID / Secret を設定。

## 4. Redirect URLs の登録

Supabase Dashboard → Auth → URL Configuration → Redirect URLs に**使用する全 URL** を追加:

- Web の場合: `https://yourservice.example.com/auth/callback`、`http://localhost:3000/auth/callback`
- Expo / RN の場合: custom scheme (例: `myapp://auth-callback` または Expo の `makeRedirectUri()` が生成する URL)
- Flutter の場合: consumer が指定した `redirectUrl` (例: `com.example.myapp://login-callback`)
- Swift の場合: `auth-shared-swift` の `AuthConfig.callbackURLScheme` で指定した scheme

## 5. SMTP / メールテンプレート設定

パスワードリセットや新規登録確認のメール送信用に SMTP を設定。Supabase Dashboard → Auth → Email Templates でテンプレートも変更可能。

## 6. パッケージ導入

プラットフォーム別のドキュメント参照:

- Next.js: `docs/web.md`
- Expo / React Native: `docs/reactnative.md`
- Flutter: `docs/flutter.md`
- Swift: `docs/swift.md`
