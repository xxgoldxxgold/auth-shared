import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { useAuth } from './AuthProvider'
import { OAuthButtons } from './OAuthButtons'

const errorJa: Record<string, string> = {
  'User already registered': 'このメールアドレスは既に登録されています',
  'Invalid login credentials': 'メールアドレスまたはパスワードが正しくありません',
  'Email not confirmed': 'メールアドレスの確認が完了していません',
  'Password should be at least 6 characters': 'パスワードは6文字以上で入力してください',
  'Unable to validate email address: invalid format': 'メールアドレスの形式が正しくありません',
  'Signup requires a valid password': 'パスワードを入力してください',
}

function toJa(msg: string): string {
  if (errorJa[msg]) return errorJa[msg]
  for (const [en, ja] of Object.entries(errorJa)) {
    if (msg.includes(en)) return ja
  }
  return 'エラーが発生しました'
}

interface LoginFormProps {
  onSuccess?: () => void
  title?: string
}

export function LoginForm({ onSuccess, title }: LoginFormProps) {
  const { signInWithEmail, signUpWithEmail, resetPassword } = useAuth()
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError('')
    setMessage('')
    setLoading(true)
    try {
      if (mode === 'login') {
        const result = await signInWithEmail(email, password)
        if (result.error) setError(toJa(result.error))
        else if (onSuccess) onSuccess()
      } else if (mode === 'register') {
        const result = await signUpWithEmail(email, password, name)
        if (result.error) setError(toJa(result.error))
        else setMessage('確認メールを送信しました。メールのリンクをクリックしてください。')
      } else {
        const result = await resetPassword(email)
        if (result.error) setError(toJa(result.error))
        else setMessage('パスワードリセットメールを送信しました。')
      }
    } catch {
      setError('エラーが発生しました')
    }
    setLoading(false)
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>
          {title || (mode === 'login' ? 'ログイン' : mode === 'register' ? '新規登録' : 'パスワードリセット')}
        </Text>

        <OAuthButtons />

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>または</Text>
          <View style={styles.dividerLine} />
        </View>

        {mode === 'register' && (
          <TextInput
            style={styles.input}
            placeholder="表示名"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="メールアドレス"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        {mode !== 'reset' && (
          <TextInput
            style={styles.input}
            placeholder="パスワード"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {message ? <Text style={styles.successText}>{message}</Text> : null}

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {mode === 'login' ? 'ログイン' : mode === 'register' ? '登録' : 'リセットメール送信'}
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.links}>
          {mode !== 'login' && (
            <TouchableOpacity onPress={() => { setMode('login'); setError(''); setMessage('') }}>
              <Text style={styles.linkText}>ログインに戻る</Text>
            </TouchableOpacity>
          )}
          {mode === 'login' && (
            <>
              <TouchableOpacity onPress={() => { setMode('register'); setError(''); setMessage('') }}>
                <Text style={styles.linkText}>新規登録</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setMode('reset'); setError(''); setMessage('') }}>
                <Text style={styles.linkText}>パスワードを忘れた方</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 24, justifyContent: 'center', minHeight: '100%' },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 24 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e5e7eb' },
  dividerText: { marginHorizontal: 12, fontSize: 12, color: '#9ca3af' },
  input: {
    width: '100%', padding: 14, borderRadius: 8,
    borderWidth: 1, borderColor: '#d1d5db', fontSize: 14,
    marginBottom: 12, color: '#000',
  },
  errorText: { color: '#dc2626', fontSize: 13, marginBottom: 8 },
  successText: { color: '#16a34a', fontSize: 13, marginBottom: 8 },
  submitButton: {
    width: '100%', padding: 14, borderRadius: 8,
    backgroundColor: '#111827', alignItems: 'center', marginTop: 4,
  },
  disabledButton: { opacity: 0.5 },
  submitButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  links: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 16 },
  linkText: { fontSize: 13, color: '#6b7280', textDecorationLine: 'underline' },
})
