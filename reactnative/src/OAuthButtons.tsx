import React, { useState } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { useAuth } from './AuthProvider'

export function OAuthButtons() {
  const { signInWithGoogle, signInWithApple } = useAuth()
  const [loading, setLoading] = useState<string | null>(null)

  const handleGoogle = async () => {
    setLoading('google')
    try { await signInWithGoogle() } catch {} finally { setLoading(null) }
  }

  const handleApple = async () => {
    setLoading('apple')
    try { await signInWithApple() } catch {} finally { setLoading(null) }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.googleButton} onPress={handleGoogle} disabled={!!loading}>
        {loading === 'google' ? (
          <ActivityIndicator color="#374151" />
        ) : (
          <Text style={styles.googleText}>Googleでログイン</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.appleButton} onPress={handleApple} disabled={!!loading}>
        {loading === 'apple' ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.appleText}>Appleでログイン</Text>
        )}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  googleButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  googleText: { fontSize: 14, fontWeight: '500', color: '#374151' },
  appleButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 14, borderRadius: 8, backgroundColor: '#000',
  },
  appleText: { fontSize: 14, fontWeight: '500', color: '#fff' },
})
