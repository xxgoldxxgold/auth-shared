# Flutter 統合ガイド

パッケージ単体の使い方は `flutter/README.md` を参照。このドキュメントは Flutter 固有の統合ヒント。

## Deep-link URL の決め方

慣習的に `com.example.yourapp://login-callback` 形式。`com.example.yourapp` 部分は iOS の Bundle ID / Android の applicationId に揃えると混乱が少ない。

## iOS (Info.plist)

`ios/Runner/Info.plist` の `CFBundleURLTypes` に `CFBundleURLSchemes` として上記 scheme (例: `com.example.yourapp`) を登録。詳細は supabase_flutter の deep-link セットアップガイドを参照。

## Android (AndroidManifest.xml)

`android/app/src/main/AndroidManifest.xml` の `<activity>` 内に `<intent-filter>` を追加し、`<data android:scheme="com.example.yourapp" android:host="login-callback" />` を指定。

## Supabase の Redirect URLs 登録

Supabase Dashboard → Auth → URL Configuration → Redirect URLs に、deep-link URL 全体 (例: `com.example.yourapp://login-callback`) を追加。

## AuthManager の生成タイミング

`main()` で `Supabase.initialize(url: ..., anonKey: ...)` を完了してから `AuthManager(supabase: Supabase.instance.client, redirectUrl: '...')` を作る。`Provider` / `ChangeNotifierProvider` で DI するのが一般的。

## トラブルシュート

- OAuth 後に deep-link が開くのにセッションが作られない → `supabase_flutter` のバージョンが古い可能性。v2.0 以降を使うこと
- `signInWithOAuth` が例外を投げる → `redirectUrl` が Supabase の Redirect URLs に登録されていない
