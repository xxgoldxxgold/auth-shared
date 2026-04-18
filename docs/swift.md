# Swift (iOS) 統合ガイド

Swift 版は別リポジトリ `xxgoldxxgold/auth-shared-swift` (SPM の制約で本モノレポには含められないため)。本モノレポと同一バージョンで同時タグ。

パッケージ単体の使い方は `auth-shared-swift` リポジトリの README.md を参照。このドキュメントは iOS 固有の統合ヒント。

## URL Types / Custom Scheme 登録

`Info.plist` の `CFBundleURLTypes` に `CFBundleURLSchemes` としてサービス固有の scheme (例: `com.example.yourapp`) を登録。

## AuthConfig の `callbackURLScheme`

`AuthManager` の `init` で渡す `AuthConfig(callbackURLScheme: "com.example.yourapp")` は、`ASWebAuthenticationSession` の `callbackURLScheme` 引数にそのまま使われる。scheme 部分のみを渡す (URL 全体ではない)。

## ASWebAuthenticationSession の Presentation Context

iOS 13+ では `ASWebAuthenticationPresentationContextProviding` の実装が必要。本パッケージは内部で適切な UIWindow を取得する実装を提供 (詳細は Swift パッケージ側の README 参照)。

## Supabase の Redirect URLs 登録

Supabase Dashboard に `com.example.yourapp://login-callback` 形式の URL を追加。`callbackURLScheme` に指定した scheme と一致すること。

## SwiftUI での配置

`@StateObject var authManager = AuthManager(supabase: ..., config: AuthConfig(callbackURLScheme: "..."))` を `App` 直下または ルート View で保持し、`.environmentObject(authManager)` で下層に配る。
