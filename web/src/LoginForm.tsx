'use client'

import { useState } from 'react'
import { useAuth } from './AuthProvider'
import { OAuthButtons } from './OAuthButtons'

export function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const { signInWithEmail, signUpWithEmail, resetPassword } = useAuth()
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      if (mode === 'login') {
        const result = await signInWithEmail(email, password)
        if (result.error) setError(result.error)
        else if (onSuccess) onSuccess()
      } else if (mode === 'register') {
        const result = await signUpWithEmail(email, password, name)
        if (result.error) setError(result.error)
        else setMessage('確認メールを送信しました。メールのリンクをクリックしてください。')
      } else {
        const result = await resetPassword(email)
        if (result.error) setError(result.error)
        else setMessage('パスワードリセットメールを送信しました。')
      }
    } catch {
      setError('エラーが発生しました')
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', padding: '12px 16px', borderRadius: '8px',
    border: '1px solid #d1d5db', fontSize: '14px', outline: 'none',
  }
  const buttonStyle = {
    width: '100%', padding: '12px', borderRadius: '8px', border: 'none',
    background: '#111827', color: '#fff', fontSize: '14px', fontWeight: 600 as const,
    cursor: 'pointer', opacity: loading ? 0.5 : 1,
  }
  const linkStyle = {
    fontSize: '13px', color: '#6b7280', cursor: 'pointer',
    background: 'none', border: 'none', textDecoration: 'underline',
  }

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '24px', fontFamily: 'system-ui' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px', textAlign: 'center' as const }}>
        {mode === 'login' ? 'ログイン' : mode === 'register' ? '新規登録' : 'パスワードリセット'}
      </h2>

      <OAuthButtons />

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
        <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
        <span style={{ fontSize: '12px', color: '#9ca3af' }}>または</span>
        <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {mode === 'register' && (
          <input
            type="text" placeholder="表示名" value={name}
            onChange={e => setName(e.target.value)}
            style={inputStyle}
          />
        )}
        <input
          type="email" placeholder="メールアドレス" value={email}
          onChange={e => setEmail(e.target.value)} required
          style={inputStyle}
        />
        {mode !== 'reset' && (
          <input
            type="password" placeholder="パスワード" value={password}
            onChange={e => setPassword(e.target.value)} required
            style={inputStyle}
          />
        )}

        {error && <p style={{ color: '#dc2626', fontSize: '13px' }}>{error}</p>}
        {message && <p style={{ color: '#16a34a', fontSize: '13px' }}>{message}</p>}

        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? '処理中...' : mode === 'login' ? 'ログイン' : mode === 'register' ? '登録' : 'リセットメール送信'}
        </button>
      </form>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '16px' }}>
        {mode !== 'login' && (
          <button onClick={() => { setMode('login'); setError(''); setMessage('') }} style={linkStyle}>
            ログインに戻る
          </button>
        )}
        {mode === 'login' && (
          <>
            <button onClick={() => { setMode('register'); setError(''); setMessage('') }} style={linkStyle}>
              新規登録
            </button>
            <button onClick={() => { setMode('reset'); setError(''); setMessage('') }} style={linkStyle}>
              パスワードをお忘れの方
            </button>
          </>
        )}
      </div>
    </div>
  )
}
