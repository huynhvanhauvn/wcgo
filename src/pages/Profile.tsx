
import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthProvider'
import * as api from '../lib/api'
import UserAvatar from '../components/UserAvatar'

export default function ProfilePage() {
  const { t } = useTranslation()
  const { user, profile, refreshProfile } = useAuth()

  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })

  const [requestingDeletion, setRequestingDeletion] = useState(false)

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '')
      setAvatarUrl(profile.avatar_url || '')
    }
  }, [profile])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage({ text: '', type: '' })
    try {
      await api.updateProfile(user.id, {
        display_name: displayName,
        avatar_url: avatarUrl
      })
      await refreshProfile()
      setMessage({ text: t('profileSaved'), type: 'success' })
    } catch (e: any) {
      setMessage({ text: t('profileSaveFailed'), type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleRequestDeletion = async () => {
    setRequestingDeletion(true)
    try {
      await api.requestAccountDeletion(user.id)
      await refreshProfile()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setRequestingDeletion(false)
    }
  }

  const handleCancelDeletion = async () => {
    try {
      await api.cancelDeletionRequest(user.id)
      await refreshProfile()
    } catch (e: any) {
      alert(e.message)
    }
  }

  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      {/* PROFILE HEADER CARD */}
      <section className="glass-card bg-white p-8 md:p-10 shadow-2xl border-none overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#0a2647] via-wc-gold to-wc-canada"></div>
        <div className="flex flex-col md:flex-row items-center gap-8">
           <div className="relative">
              <UserAvatar name={displayName || user.email} avatarUrl={avatarUrl} className="h-24 w-24 md:h-32 md:w-32 text-4xl ring-8 ring-slate-50 shadow-2xl" />
              <div className="absolute -bottom-2 -right-2 bg-[#0a2647] text-white p-2 rounded-xl shadow-lg border-4 border-white">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
              </div>
           </div>
           <div className="text-center md:text-left flex-1 min-w-0">
              <h2 className="text-3xl font-black text-[#0a2647] uppercase tracking-tighter italic truncate">{displayName || t('welcome')}</h2>
              <p className="text-slate-400 font-bold text-sm mt-1 uppercase tracking-widest">{user.email}</p>
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest">
                 <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                 Active Member
              </div>
           </div>
        </div>
      </section>

      {/* SETTINGS FORM */}
      <section className="glass-card bg-white p-6 md:p-10 shadow-xl border-none">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{t('displayName')}</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t('displayNamePlaceholder')}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-[#0a2647] focus:bg-white transition-all outline-none font-bold text-[#0a2647]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{t('avatarUrl')}</label>
              <input
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-[#0a2647] focus:bg-white transition-all outline-none font-bold text-[#0a2647]"
              />
            </div>
          </div>

          {message.text && (
            <div className={`p-4 rounded-xl text-sm font-bold animate-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="btn-primary w-full py-4 uppercase tracking-widest text-sm shadow-xl"
          >
            {saving ? t('saving') : t('saveProfile')}
          </button>
        </form>
      </section>

      {/* ACCOUNT DELETION AREA */}
      <section className="glass-card bg-white p-6 md:p-10 shadow-xl border-none border-t-4 border-rose-500">
        <div className="flex items-center gap-4 mb-6">
           <div className="p-3 bg-rose-50 rounded-2xl text-rose-500 text-2xl">🗑️</div>
           <div>
              <h3 className="text-xl font-black text-[#0a2647] uppercase tracking-tight">{t('profile_deletion.request_title')}</h3>
              <p className="text-xs font-medium text-slate-400 mt-1">{t('profile_deletion.notice')}</p>
           </div>
        </div>

        <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
          {!profile?.deletion_requested_at ? (
            <button
              onClick={handleRequestDeletion}
              disabled={requestingDeletion}
              className="w-full py-4 bg-white text-rose-600 font-black uppercase tracking-widest text-xs rounded-2xl border-2 border-rose-100 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all shadow-sm"
            >
              {requestingDeletion ? t('saving') : t('profile_deletion.request_button')}
            </button>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-4 rounded-xl border border-amber-100">
                 <div className="animate-spin h-4 w-4 border-2 border-amber-600 border-t-transparent rounded-full"></div>
                 <span className="text-xs font-black uppercase tracking-widest">{t('profile_deletion.request_pending')}</span>
              </div>
              <button
                onClick={handleCancelDeletion}
                className="w-full py-3 text-slate-400 font-bold uppercase tracking-widest text-[10px] hover:text-[#0a2647] transition-all"
              >
                {t('profile_deletion.cancel_request')}
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
