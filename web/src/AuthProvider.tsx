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
        emailRedirectTo: resolveRedirectUrl(),
      },
    })
    if (error) return { error: error.message }
    return {}
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

  return (
    <AuthContext.Provider value={{
      user, displayName, avatarUrl, loading,
      signInWithGoogle, signInWithApple,
      signInWithEmail, signUpWithEmail,
      resetPassword, signOut, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
