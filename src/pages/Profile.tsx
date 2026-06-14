
import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthProvider'
import * as api from '../lib/api'
import UserAvatar from '../components/UserAvatar'
import { captureAndShare } from '../lib/shareUtils'

export default function ProfilePage() {
  const { t } = useTranslation()
  const { user, profile, updateProfile } = useAuth()

  const [displayName, setDisplayName] = useState('')
  const [realName, setRealName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })

  const [requestingDeletion, setRequestingDeletion] = useState(false)

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '')
      setRealName(profile.real_name || '')
      setAvatarUrl(profile.avatar_url || '')
    }
  }, [profile])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setUploading(true)
    setMessage({ text: '', type: '' })
    try {
      const publicUrl = await api.uploadAvatar(user.id, file)
      setAvatarUrl(publicUrl)
      setMessage({ text: 'Avatar uploaded successfully!', type: 'success' })
    } catch (e: any) {
      setMessage({ text: 'Upload failed: ' + e.message, type: 'error' })
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage({ text: '', type: '' })
    try {
      await updateProfile({
        displayName: displayName,
        avatarUrl: avatarUrl,
        realName: realName
      })
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
      window.location.reload()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setRequestingDeletion(false)
    }
  }

  const handleCancelDeletion = async () => {
    try {
      await api.cancelAccountDeletionRequest(user.id)
      window.location.reload()
    } catch (e: any) {
      alert(e.message)
    }
  }

  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      {/* PROFILE HEADER CARD */}
      <section id="profile-card" className="glass-card bg-white p-8 md:p-10 shadow-2xl border-none overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#0a2647] via-wc-gold to-wc-canada"></div>

        <button
          onClick={() => captureAndShare('profile-card', `Profile-${displayName}`)}
          className="absolute top-4 right-4 text-slate-300 hover:text-emerald-500 transition-all p-2 bg-slate-50 rounded-full shadow-sm z-30 group"
          title="Share Profile"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
        </button>

        <div className="flex flex-col md:flex-row items-center gap-8">
           <div className="relative group">
              <UserAvatar name={displayName || user.email} avatarUrl={avatarUrl} className="h-24 w-24 md:h-32 md:w-32 text-4xl ring-8 ring-slate-50 shadow-2xl" />

              <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-4 border-transparent">
                 <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
                 {uploading ? (
                   <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full"></div>
                 ) : (
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                 )}
              </label>

              {profile?.is_verified && (
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-xl shadow-lg border-4 border-white" title={t('verificationVerified')}>
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zM10 12a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                </div>
              )}
           </div>
           <div className="text-center md:text-left flex-1 min-w-0">
              <h2 className="text-3xl font-black text-[#0a2647] uppercase tracking-tighter italic truncate">{displayName || t('welcome')}</h2>
              <p className="text-slate-400 font-bold text-sm mt-1 uppercase tracking-widest">{user.email}</p>
              <div className={`mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${profile?.is_verified ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                 <span className={`w-2 h-2 rounded-full ${profile?.is_verified ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
                 {profile?.is_verified ? t('verificationVerified') : t('verificationPending')}
              </div>
           </div>
        </div>
      </section>

      {/* SETTINGS FORM */}
      <section className="glass-card bg-white p-6 md:p-10 shadow-xl border-none">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{t('realName')}</label>
            <input
              type="text"
              required
              value={realName}
              onChange={(e) => setRealName(e.target.value)}
              placeholder="E.g. Nguyễn Văn A"
              disabled={profile?.is_verified}
              className={`w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-[#0a2647] focus:bg-white transition-all outline-none font-bold text-[#0a2647] ${profile?.is_verified ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            {profile?.is_verified && <p className="text-[9px] text-emerald-600 font-bold ml-1 uppercase tracking-widest italic">Identity verified. Contact Admin to change.</p>}
          </div>

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
            disabled={saving || uploading}
            className="btn-primary w-full py-4 uppercase tracking-widest text-sm shadow-xl disabled:opacity-50"
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
