import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import * as auth from '../lib/auth'

export default function AuthPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isSignUp) {
        const { data, error: err } = await auth.signUpWithUsername(username, password)
        if (err) {
          setError(err.message)
      } else if (data.session) {
          navigate('/')
        } else {
          setError(t('accountCreated'))
          setIsSignUp(false)
        }
      } else {
        const { error: err } = await auth.signInWithUsername(username, password)
        if (err) {
          setError(err.message)
        } else {
          navigate('/')
        }
      }
    } catch (e: any) {
      setError(e.message || t('authFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="rounded-lg bg-white/80 p-8 shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-4 text-center">{isSignUp ? t('signUp') : t('signIn')}</h1>
        {error && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded text-sm">{error}</div>}
        <form onSubmit={handleAuth} className="space-y-4">
          <input
            type="text"
            placeholder={t('username')}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 border rounded"
            autoComplete="username"
            required
          />
          <input
            type="password"
            placeholder={t('password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            required
          />
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? t('loading') : isSignUp ? t('signUp') : t('signIn')}
          </button>
        </form>
        <div className="mt-4 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-blue-600 underline"
          >
            {isSignUp ? t('alreadyHaveAccount') : t('newHere')}
          </button>
        </div>
      </div>
    </div>
  )
}
