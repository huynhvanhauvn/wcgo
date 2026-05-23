import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import * as auth from '../lib/auth'
import * as api from '../lib/api'
import WorldCupMark from '../components/WorldCupMark'

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
        const { data, error: err } = await auth.signInWithUsername(username, password)
        if (err) {
          setError(err.message)
        } else if (data.user) {
          // Check if profile is deleted before proceeding
          const profile = await api.fetchProfileById(data.user.id).catch(() => null)
          if (profile?.is_deleted) {
            await auth.signOut()
            setError(t('profile_deletion.account_disabled'))
          } else {
            navigate('/')
          }
        }
      }
    } catch (e: any) {
      setError(e.message || t('authFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="glass-card p-8 w-full max-w-sm border-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0a2647] via-wc-gold to-[#0a2647]"></div>

        <div className="flex flex-col items-center gap-4 mb-8">
          <WorldCupMark size="md" className="drop-shadow-sm" />
          <h1 className="text-3xl font-black text-[#0a2647] uppercase tracking-tighter italic">
            {isSignUp ? t('signUp') : t('signIn')}
          </h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('username')}</label>
            <input
              type="text"
              placeholder="e.g. mbappe7"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#0a2647] focus:ring-1 focus:ring-[#0a2647] outline-none transition-all font-medium"
              autoComplete="username"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('password')}</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#0a2647] focus:ring-1 focus:ring-[#0a2647] outline-none transition-all font-medium"
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              required
            />
          </div>

          <button type="submit" className="btn-primary w-full py-4 uppercase tracking-[0.2em] text-sm mt-2" disabled={loading}>
            {loading ? t('loading') : isSignUp ? t('signUp') : t('signIn')}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-100 pt-6">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError('')
            }}
            className="text-xs font-bold text-[#0a2647] hover:text-wc-accent transition-colors uppercase tracking-widest"
          >
            {isSignUp ? t('alreadyHaveAccount') : t('newHere')}
          </button>
        </div>
      </div>
    </div>
  )
}
