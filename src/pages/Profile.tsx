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

  return (
    <div className="mx-auto max-w-xl rounded-lg bg-white/90 p-6 shadow-md">
      <div className="mb-6 flex items-center gap-4">
        <UserAvatar name={displayName || username || fallbackName} avatarUrl={avatarPreviewUrl || avatarUrl} className="h-16 w-16 text-xl" />
        <div>
          <h1 className="text-2xl font-semibold">{t('profileTitle')}</h1>
          <p className="text-sm text-gray-500">{username || fallbackName}</p>
        </div>
      </div>

      {message && (
        <div className="mb-4 rounded bg-slate-100 p-3 text-sm text-slate-700">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">{t('username')}</span>
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="w-full rounded border p-2 bg-gray-50"
            maxLength={80}
            required
            disabled
          />
          <p className="mt-1 text-xs text-gray-500">{t('usernameHint')}</p>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">{t('displayName')}</span>
          <input
            type="text"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className="w-full rounded border p-2"
            placeholder={t('displayNamePlaceholder')}
            maxLength={50}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">{t('avatarUrl')}</span>
          <input
            type="url"
            value={avatarUrl}
            onChange={(event) => setAvatarUrl(event.target.value)}
            className="w-full rounded border p-2"
            placeholder="https://example.com/avatar.png"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">{t('uploadAvatar')}</span>
          <input
            type="file"
            accept="image/*"
            onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
            className="w-full rounded border p-2 text-sm"
          />
        </label>

        <button type="submit" className="btn-primary w-full" disabled={saving}>
          {saving ? t('saving') : t('saveProfile')}
        </button>
      </form>
    </div>
  )
}
