import type { SupabaseClient, User } from '@supabase/supabase-js'

export interface AuthConfig {
  supabase: SupabaseClient
  /**
   * OAuth コールバックに使う redirect URI。
   * 未指定なら expo-auth-session の makeRedirectUri() のデフォルト (app.json の scheme) を使う。
   * 明示する例: "myapp://auth-callback"
   * Supabase Dashboard → Auth → URL Configuration → Redirect URLs に登録済みであること。
   */
  redirectUri?: string
  /** shared_profiles テーブルに自動登録するか (デフォルト: false、DB トリガー併用時は false のまま) */
  autoCreateProfile?: boolean
  /** signup_source 識別子 (サービス名) */
  signupSource?: string
  /**
   * 退会 (アプリ個別 opt-out) 用 Edge Function 名。
   * 省略時は `delete-${signupSource}-user` を解決して使う (signupSource 未指定時は deleteAccount 不可)。
   */
  deleteUserFunctionName?: string
  /** ログイン成功後に呼ばれるフック (サービス固有のプロフィール作成等) */
  onLogin?: (user: User, supabase: SupabaseClient) => Promise<void>
  /** ログアウト後に呼ばれるフック */
  onLogout?: () => Promise<void>
  /** ログアウト後のナビゲーション */
  onNavigateAfterLogout?: () => void
}

export interface AuthContextValue {
  user: User | null
  displayName: string
  avatarUrl: string
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithApple: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<{ error?: string }>
  resetPassword: (email: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  /**
   * このアプリだけの退会 (opt-out)。
   * 成功時: Edge Function → signOut → onNavigateAfterLogout。
   * 失敗時: `{ error }` を返す (signOut しない)。auth.users は触らない。
   */
  deleteAccount: () => Promise<{ error?: string }>
}
