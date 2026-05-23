import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthProvider'
import { getUserDisplayName } from '../lib/auth'
import UserAvatar from '../components/UserAvatar'
import * as api from '../lib/api'

export default function ProfilePage() {
  const { t } = useTranslation()
  const { user, profile, updateProfile } = useAuth()
  const fallbackName = getUserDisplayName(user)
  const [username, setUsername] = useState(profile?.username || fallbackName)
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    setUsername(profile?.username || fallbackName)
    setDisplayName(profile?.display_name || '')
    setAvatarUrl(profile?.avatar_url || '')
  }, [profile, fallbackName])

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreviewUrl('')
      return
    }

    const objectUrl = URL.createObjectURL(avatarFile)
    setAvatarPreviewUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [avatarFile])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      let nextAvatarUrl = avatarUrl
      if (user && avatarFile) {
        nextAvatarUrl = await api.uploadAvatar(user.id, avatarFile)
        setAvatarUrl(nextAvatarUrl)
        setAvatarFile(null)
      }
      await updateProfile({ username, displayName, avatarUrl: nextAvatarUrl })
      setMessage(t('profileSaved'))
    } catch (e: any) {
      setMessage(e.message || t('profileSaveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const handleDeletionRequest = async () => {
    if (!user) return
    try {
      if (profile?.deletion_requested_at) {
        await api.cancelAccountDeletionRequest(user.id)
      } else {
        await api.requestAccountDeletion(user.id)
      }
      // Re-fetch profile or update context
      window.location.reload()
    } catch (e: any) {
      alert(e.message)
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="glass-card p-6 shadow-md border-white">
        <div className="mb-6 flex items-center gap-4">
          <UserAvatar name={displayName || username || fallbackName} avatarUrl={avatarPreviewUrl || avatarUrl} className="h-16 w-16 text-xl shadow-lg ring-2 ring-[#0a2647]/5" />
          <div>
            <h1 className="text-2xl font-black text-[#0a2647] tracking-tight">{t('profileTitle')}</h1>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{username || fallbackName}</p>
          </div>
        </div>

        {message && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs font-bold uppercase tracking-wider">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('username')}</label>
            <input
              type="text"
              value={username}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-400 cursor-not-allowed"
              disabled
            />
            <p className="mt-1 text-[10px] font-bold text-slate-400 italic ml-1">{t('usernameHint')}</p>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('displayName')}</label>
            <input
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:border-[#0a2647] focus:ring-1 focus:ring-[#0a2647] outline-none transition-all font-bold text-[#0a2647]"
              placeholder={t('displayNamePlaceholder')}
              maxLength={50}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('avatarUrl')}</label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(event) => setAvatarUrl(event.target.value)}
              className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:border-[#0a2647] focus:ring-1 focus:ring-[#0a2647] outline-none transition-all font-medium text-slate-600"
              placeholder="https://example.com/avatar.png"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('uploadAvatar')}</label>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
              className="w-full p-3 bg-slate-50 border border-slate-200 border-dashed rounded-xl text-xs font-bold text-slate-500 cursor-pointer hover:bg-slate-100 transition-all"
            />
          </div>

          <button type="submit" className="btn-primary w-full py-4 uppercase tracking-[0.2em] text-sm mt-4" disabled={saving}>
            {saving ? t('saving') : t('saveProfile')}
          </button>
        </form>
      </div>

      {/* Account Deletion Section */}
      <div className="glass-card p-6 border-rose-100 bg-rose-50/30">
        <h3 className="text-sm font-black text-rose-700 uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="text-xl">⚠️</span> {t('profile_deletion.request_title')}
        </h3>

        <p className="text-xs text-rose-800/70 mb-6 italic leading-relaxed font-medium">
          {t('profile_deletion.notice')}
        </p>

        {profile?.deletion_status === 'REJECTED' && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-100 text-amber-700 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <span>ℹ️</span> {t('profile_deletion.request_rejected')}
          </div>
        )}

        {profile?.deletion_status === 'PENDING' ? (
          <div className="space-y-4">
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl">
              <p className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-2">
                <span className="animate-pulse">⏳</span> {t('profile_deletion.request_pending')}
              </p>
            </div>
            <button
              onClick={handleDeletionRequest}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 underline uppercase tracking-widest transition-colors"
            >
              {t('profile_deletion.cancel_request')}
            </button>
          </div>
        ) : (
          <button
            onClick={handleDeletionRequest}
            className="w-full py-3 border-2 border-rose-200 text-rose-600 rounded-xl text-xs font-black uppercase tracking-[0.15em] hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all"
          >
            {t('profile_deletion.request_button')}
          </button>
        )}
      </div>
    </div>
  )
}
