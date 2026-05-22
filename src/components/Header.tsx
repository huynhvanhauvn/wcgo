import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthProvider'
import { getUserDisplayName } from '../lib/auth'
import WorldCupMark from './WorldCupMark'
import UserAvatar from './UserAvatar'

export default function Header() {
  const { t } = useTranslation()
  const { user, profile, loading, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()
  const displayName = profile?.full_name || getUserDisplayName(user)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <header className="bg-wc-primary text-white p-4 shadow-md">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <WorldCupMark size="sm" />
          <span>WCGO</span>
        </Link>
        <nav className="space-x-4 flex items-center">
          <Link to="/" className="opacity-90 hover:opacity-100 mr-4">{t('matches')}</Link>
          <Link to="/leaderboard" className="opacity-90 hover:opacity-100 mr-4">{t('leaderboard')}</Link>
          {isAdmin && (
            <Link to="/admin" className="opacity-90 hover:opacity-100 mr-4">{t('admin')}</Link>
          )}
          {!loading && !user && (
            <Link to="/login" className="btn-primary">{t('login')}</Link>
          )}
          {user && (
            <div className="flex items-center space-x-3">
              <Link to="/profile" className="flex items-center gap-2 opacity-90 hover:opacity-100">
                <UserAvatar name={displayName} avatarUrl={profile?.avatar_url} className="h-8 w-8" />
                <span className="text-sm">{displayName}</span>
              </Link>
              <button onClick={handleSignOut} className="ml-2 text-sm underline">{t('signOut')}</button>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
