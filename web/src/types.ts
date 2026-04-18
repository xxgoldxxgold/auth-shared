import type { SupabaseClient, User } from '@supabase/supabase-js'

export interface AuthConfig {
  supabase: SupabaseClient
  /** ログアウト後のリダイレクト先 URL (デフォルト: '/') */
  redirectAfterLogout?: string
  /** OAuth / メール確認 / パスワードリセットの戻り先 URL (デフォルト: `${window.location.origin}/auth/callback`) */
  oauthRedirectUrl?: string
  /** shared_profiles テーブルに自動登録するか (デフォルト: false、DB トリガーでの作成が前提) */
  autoCreateProfile?: boolean
  /** signup_source 識別子 (サービス名) */
  signupSource?: string
  /** ログイン成功後に呼ばれるフック (サービス固有のプロフィール作成等) */
  onLogin?: (user: User, supabase: SupabaseClient) => Promise<void>
  /** ログアウト後に呼ばれるフック */
  onLogout?: () => Promise<void>
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
}
