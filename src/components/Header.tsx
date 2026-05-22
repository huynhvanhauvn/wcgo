import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthProvider'
import { getUserDisplayName } from '../lib/auth'
import WorldCupMark from './WorldCupMark'
import UserAvatar from './UserAvatar'

export default function Header() {
  const { t } = useTranslation()
  const { user, profile, loading, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [scrolled, setScrolled] = React.useState(false)
  const displayName = profile?.display_name || profile?.username || getUserDisplayName(user)

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const getNavLinkClass = (path: string) => {
    const isActive = location.pathname === path
    return `text-sm font-bold transition-all duration-300 hover:text-wc-accent ${isActive ? 'nav-link-active scale-110 text-wc-accent' : 'text-slate-300'}`
  }

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'py-3 bg-[#0a2647]/95 backdrop-blur-md shadow-lg' : 'py-4 bg-[#0a2647]'}`}>
      <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 font-black text-2xl tracking-tighter italic group">
          <WorldCupMark size="sm" className={`transition-transform duration-300 ${scrolled ? 'scale-90' : 'scale-100'}`} />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300 pr-2">
            WCGO
          </span>
        </Link>

        <nav className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className={getNavLinkClass('/')}>{t('tabs.dashboard')}</Link>
            <Link to="/leaderboard" className={getNavLinkClass('/leaderboard')}>{t('tabs.leaderboard')}</Link>
            <Link to="/rules" className={getNavLinkClass('/rules')}>{t('tabs.rules')}</Link>
            {isAdmin && (
              <Link to="/admin" className={getNavLinkClass('/admin')}>{t('admin')}</Link>
            )}
          </div>

          {!loading && !user && (
            <Link to="/login" className="btn-primary">{t('login')}</Link>
          )}

          {user && (
            <div className="flex items-center gap-4 pl-4 border-l border-white/10">
              <Link to="/profile" className="group flex items-center gap-2">
                <div className="relative">
                  <UserAvatar name={displayName} avatarUrl={profile?.avatar_url} className="h-9 w-9 ring-2 ring-white/10 group-hover:ring-wc-accent transition-all shadow-sm" />
                </div>
                <span className="hidden sm:block text-sm font-bold text-white group-hover:text-wc-accent transition-colors">{displayName}</span>
              </Link>
              <button onClick={handleSignOut} className="p-2 text-slate-400 hover:text-rose-400 transition-colors" title={t('signOut')}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
