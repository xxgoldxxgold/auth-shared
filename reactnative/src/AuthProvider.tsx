import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import type { AuthConfig, AuthContextValue } from './types'

const AuthContext = createContext<AuthContextValue>({
  user: null,
  displayName: '',
  avatarUrl: '',
  loading: true,
  signInWithGoogle: async () => {},
  signInWithApple: async () => {},
  signInWithEmail: async () => ({}),
  signUpWithEmail: async () => ({}),
  resetPassword: async () => ({}),
  signOut: async () => {},
  refreshProfile: async () => {},
  deleteAccount: async () => ({}),
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({
  children,
  config,
}: {
  children: ReactNode
  config: AuthConfig
}) {
  const { supabase, autoCreateProfile = false, onLogin, onLogout, onNavigateAfterLogout, redirectUri: configRedirectUri } = config
  const [user, setUser] = useState<User | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (u: User) => {
    try {
      const { data } = await supabase
        .from('shared_profiles')
        .select('display_name, avatar_url')
        .eq('id', u.id)
        .single()
      setDisplayName(data?.display_name || u.user_metadata?.full_name || u.user_metadata?.name || '')
      setAvatarUrl(data?.avatar_url || u.user_metadata?.avatar_url || '')
    } catch {
      setDisplayName(u.user_metadata?.full_name || u.user_metadata?.name || '')
      setAvatarUrl(u.user_metadata?.avatar_url || '')
    }
  }, [supabase])

  const ensureProfile = useCallback(async (u: User) => {
    try {
      const { data: existing } = await supabase
        .from('shared_profiles')
        .select('id')
        .eq('id', u.id)
        .single()
      if (!existing) {
        const name = u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || ''
        const avatar = u.user_metadata?.avatar_url || ''
        await supabase.from('shared_profiles').insert({
          id: u.id,
          display_name: name,
          avatar_url: avatar,
          signup_source: config.signupSource || '',
          updated_at: new Date().toISOString(),
        })
      }
    } catch {}
  }, [supabase, config.signupSource])

  useEffect(() => {
    let cancelled = false

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      const u = data.session?.user || null
      setUser(u)
      setLoading(false)
      if (u) loadProfile(u)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return
      const u = session?.user || null
      setUser(u)
      setLoading(false)
      if (u) {
        // Defer async work: awaiting Supabase queries inside onAuthStateChange
        // deadlocks the internal auth lock (known supabase-js pitfall).
        setTimeout(() => {
          if (cancelled) return
          loadProfile(u).catch(() => {})
          if (autoCreateProfile) ensureProfile(u).catch(() => {})
          if (onLogin) onLogin(u, supabase).catch(() => {})
        }, 0)
      }
    })

    return () => { cancelled = true; subscription.unsubscribe() }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user)
  }, [user, loadProfile])

  const signInWithOAuth = useCallback(async (provider: 'google' | 'apple') => {
    const { makeRedirectUri } = await import('expo-auth-session')
    const WebBrowser = await import('expo-web-browser')
    const Linking = await import('expo-linking')
    const redirectTo = configRedirectUri ?? makeRedirectUri()

    // Android では Apple web flow が Custom Tabs から URL を取りこぼし、
    // OS の Linking 経由でのみ deep link が届くケースがある。両方を race。
    let linkingResolve: ((url: string | null) => void) | null = null
    const linkingPromise = new Promise<string | null>((resolve) => {
      linkingResolve = resolve
    })
    const linkingSub = Linking.addEventListener('url', ({ url }) => {
      if (linkingResolve) linkingResolve(url)
    })
    // 60秒経っても来なければ諦める
    const linkingTimeout = setTimeout(() => {
      if (linkingResolve) linkingResolve(null)
    }, 60000)
    const cleanup = () => {
      linkingSub.remove()
      clearTimeout(linkingTimeout)
    }

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo, skipBrowserRedirect: true },
      })
      if (error || !data.url) {
        throw new Error(error?.message || `OAuth initiation failed for ${provider}`)
      }

      const browserPromise = WebBrowser.openAuthSessionAsync(data.url, redirectTo).then(r => {
        if (r.type === 'success' && r.url) return r.url
        return null
      })

      // どちらか先に URL を返した方を採用
      const callbackUrl = await Promise.race([linkingPromise, browserPromise])

      if (!callbackUrl) {
        // どちらも URL を返さなかった: session が確立済みか確認
        const { data: sess } = await supabase.auth.getSession()
        if (sess.session) return
        return // ユーザーがキャンセル扱い (silent)
      }

      const url = new URL(callbackUrl)
      const params = new URLSearchParams(url.hash.substring(1) || url.search.substring(1))
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      if (accessToken && refreshToken) {
        const { error: setErr } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        if (setErr) throw new Error(`setSession failed: ${setErr.message}`)
        return
      }
      const code = params.get('code')
      if (code) {
        const { error: exErr } = await supabase.auth.exchangeCodeForSession(code)
        if (exErr) throw new Error(`exchangeCodeForSession failed: ${exErr.message}`)
        return
      }
      // URL は来たが token も code も無い → session が確立してる可能性 (Supabase 自動処理)
      const { data: sess } = await supabase.auth.getSession()
      if (sess.session) return
      throw new Error('OAuth callback URL missing both tokens and code')
    } finally {
      cleanup()
    }
  }, [supabase, configRedirectUri])

  const signInWithGoogle = useCallback(async () => {
    await signInWithOAuth('google')
  }, [signInWithOAuth])

  const signInWithApple = useCallback(async () => {
    await signInWithOAuth('apple')
  }, [signInWithOAuth])

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return {}
  }, [supabase])

  const signUpWithEmail = useCallback(async (email: string, password: string, name?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name || '', ...(config.signupSource ? { signup_source: config.signupSource } : {}) },
      },
    })
    if (error) return { error: error.message }
    return {}
  }, [supabase, config.signupSource])

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) return { error: error.message }
    return {}
  }, [supabase])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setDisplayName('')
    setAvatarUrl('')
    if (onLogout) await onLogout()
    if (onNavigateAfterLogout) onNavigateAfterLogout()
  }, [supabase, onLogout, onNavigateAfterLogout])

  const deleteAccount = useCallback(async () => {
    const fnName = config.deleteUserFunctionName
      ?? (config.signupSource ? `delete-${config.signupSource}-user` : null)
    if (!fnName) {
      return { error: 'auth-shared: deleteAccount requires signupSource or deleteUserFunctionName' }
    }
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return { error: 'not_authenticated' }
    const { data, error } = await supabase.functions.invoke(fnName, { method: 'POST' })
    if (error) {
      const body = (data && typeof data === 'object') ? (data as { error?: string }) : null
      return { error: body?.error ?? error.message }
    }
    await signOut()
    return {}
  }, [supabase, config.deleteUserFunctionName, config.signupSource, signOut])

  return (
    <AuthContext.Provider value={{
      user, displayName, avatarUrl, loading,
      signInWithGoogle, signInWithApple,
      signInWithEmail, signUpWithEmail,
      resetPassword, signOut, refreshProfile,
      deleteAccount,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
