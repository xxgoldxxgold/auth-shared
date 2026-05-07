'use client'

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
  const { supabase, redirectAfterLogout = '/', oauthRedirectUrl, autoCreateProfile = false, onLogin, onLogout } = config
  const resolveRedirectUrl = () => oauthRedirectUrl ?? window.location.origin + '/auth/callback'
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
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user || null
      setUser(u)
      setLoading(false)
      if (u) loadProfile(u)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user || null
      setUser(u)
      setLoading(false)
      if (u) {
        await loadProfile(u)
        if (autoCreateProfile) await ensureProfile(u)
        if (onLogin) await onLogin(u, supabase)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user)
  }, [user, loadProfile])

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: resolveRedirectUrl() },
    })
    if (error) {
      console.error('[auth-shared] signInWithGoogle error:', error)
      throw new Error(error.message)
    }
  }, [supabase, oauthRedirectUrl])

  const signInWithApple = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: resolveRedirectUrl() },
    })
    if (error) {
      console.error('[auth-shared] signInWithApple error:', error)
      throw new Error(error.message)
    }
  }, [supabase, oauthRedirectUrl])

  // supabase-js の signInWithPassword は内部 lock / refresh hang で永久 spinner になる
  // 事故が起きるので、 GoTrue REST API を直接叩く実装に切り替え。
  // success 時は localStorage に session を直接書き、 supabase-js にも timeout 付きで通知する
  // 二段構え。 失敗時は sb-* キャッシュを掃除して clean state に戻す。
  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const url = (supabase as unknown as { supabaseUrl: string }).supabaseUrl
    const key = (supabase as unknown as { supabaseKey: string }).supabaseKey
    if (!url || !key) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return error ? { error: error.message } : {}
    }

    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 15_000)
    const projectRef = url.replace(/^https?:\/\//, '').split('.')[0] || ''
    try {
      const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': key },
        body: JSON.stringify({ email, password }),
        signal: ctrl.signal,
      })
      clearTimeout(timer)
      const body: { msg?: string; error?: string; error_description?: string; access_token?: string; refresh_token?: string; expires_in?: number; expires_at?: number; token_type?: string; user?: unknown } = await res.json().catch(() => ({}))

      if (!res.ok) {
        return { error: body.msg || body.error_description || body.error || 'Invalid login credentials' }
      }

      const session = {
        access_token: body.access_token,
        refresh_token: body.refresh_token,
        expires_in: body.expires_in,
        expires_at: body.expires_at || (Math.floor(Date.now() / 1000) + (body.expires_in || 3600)),
        token_type: body.token_type || 'bearer',
        user: body.user,
      }

      if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined' && projectRef) {
        try {
          window.localStorage.setItem(`sb-${projectRef}-auth-token`, JSON.stringify(session))
        } catch {}
      }

      // supabase-js にも通知 (= onAuthStateChange を発火させる)。 詰まっても 5 秒で諦める。
      try {
        await Promise.race([
          supabase.auth.setSession({
            access_token: body.access_token!,
            refresh_token: body.refresh_token!,
          }),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('setSession timeout')), 5_000)),
        ])
      } catch {}

      return {}
    } catch (e: unknown) {
      clearTimeout(timer)
      if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined' && projectRef) {
        try {
          const ks = Object.keys(window.localStorage).filter(k => k.startsWith(`sb-${projectRef}`))
          ks.forEach(k => { try { window.localStorage.removeItem(k) } catch {} })
        } catch {}
      }
      const isAborted = (e instanceof DOMException && e.name === 'AbortError')
        || (e instanceof Error && /aborted/i.test(e.message))
      return { error: isAborted ? 'メールログインがタイムアウトしました (15 秒)。 ネットワーク / 認証サーバに到達できていません。' : (e instanceof Error ? e.message : 'メールログイン失敗') }
    }
  }, [supabase])

  const signUpWithEmail = useCallback(async (email: string, password: string, name?: string) => {
    // supabase.auth.signUp も詰まる懸念があるので 15 秒 timeout を被せる。
    try {
      const { error } = await Promise.race([
        supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: name || '', ...(config.signupSource ? { signup_source: config.signupSource } : {}) },
            emailRedirectTo: resolveRedirectUrl(),
          },
        }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('aborted: signUp timeout')), 15_000)),
      ])
      if (error) return { error: error.message }
      return {}
    } catch (e: unknown) {
      const isAborted = e instanceof Error && /aborted/i.test(e.message)
      return { error: isAborted ? 'メール登録がタイムアウトしました (15 秒)。' : (e instanceof Error ? e.message : 'メール登録失敗') }
    }
  }, [supabase, config.signupSource, oauthRedirectUrl])

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: resolveRedirectUrl(),
    })
    if (error) return { error: error.message }
    return {}
  }, [supabase, oauthRedirectUrl])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setDisplayName('')
    setAvatarUrl('')
    if (onLogout) await onLogout()
    window.location.href = redirectAfterLogout
  }, [supabase, redirectAfterLogout, onLogout])

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
