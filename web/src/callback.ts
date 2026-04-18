import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * OAuth/PKCEコールバック処理（クライアントサイド）
 * URLのcodeパラメータからセッションを取得する
 */
export async function handleAuthCallback(
  supabase: SupabaseClient,
  options?: {
    redirectTo?: string
    onError?: (error: string) => void
  }
): Promise<boolean> {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')

  if (!code) {
    if (options?.onError) options.onError('認証コードがありません')
    return false
  }

  try {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      if (options?.onError) options.onError(error.message)
      return false
    }

    // shared_profilesに自動登録
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: existing } = await supabase
          .from('shared_profiles')
          .select('id')
          .eq('id', user.id)
          .single()
        if (!existing) {
          const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || ''
          await supabase.from('shared_profiles').insert({
            id: user.id,
            display_name: name,
            updated_at: new Date().toISOString(),
          })
        }
      }
    } catch { /* ignore profile creation error */ }

    if (options?.redirectTo) {
      window.location.href = options.redirectTo
    }
    return true
  } catch {
    if (options?.onError) options.onError('認証処理に失敗しました')
    return false
  }
}
