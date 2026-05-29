
import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthProvider'
import { getUserDisplayName } from '../lib/auth'
import WorldCupMark from './WorldCupMark'
import UserAvatar from './UserAvatar'

export default function Header() {
  const { t, i18n } = useTranslation()
  const { user, profile, loading, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const displayName = profile?.display_name || profile?.username || getUserDisplayName(user)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'vi' ? 'en' : 'vi'
    i18n.changeLanguage(nextLang)
  }

  const getNavLinkClass = (path: string, mobile = false) => {
    const isActive = location.pathname === path
    const base = mobile
      ? "flex items-center gap-4 p-4 rounded-xl transition-all duration-200 w-full"
      : "text-sm font-bold transition-all duration-300 hover:text-wc-accent flex items-center justify-center h-full gap-2 leading-none"

    const activeClass = isActive
      ? mobile ? "bg-wc-accent/10 text-wc-accent" : "nav-link-active scale-110 text-wc-accent"
      : mobile ? "text-slate-200 hover:bg-white/5" : "text-slate-300"

    return `${base} ${activeClass}`
  }

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-300 ${scrolled ? 'py-2 bg-[#0a2647]/95 backdrop-blur-md shadow-lg' : 'py-5 bg-[#0a2647]'}`}>
        <div className="max-w-7xl mx-auto px-6 md:px-8 flex items-center justify-between h-12">
          <Link to="/" className="flex items-center gap-3 font-black text-2xl tracking-tighter italic group shrink-0">
            <WorldCupMark size="sm" className={`transition-transform duration-300 ${scrolled ? 'scale-90' : 'scale-100'}`} />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300 pr-2">
              WCGO
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center h-full gap-6 lg:gap-10">
            <Link to="/" className={getNavLinkClass('/')}>{t('tabs.dashboard')}</Link>
            <Link to="/standings" className={getNavLinkClass('/standings')}>{t('tabs.standings')}</Link>
            <Link to="/bracket" className={getNavLinkClass('/bracket')}>{t('tabs.bracket')}</Link>
            <Link to="/leaderboard" className={getNavLinkClass('/leaderboard')}>{t('tabs.leaderboard')}</Link>
            <Link to="/news" className={getNavLinkClass('/news')}>{t('tabs.news')}</Link>
            <Link to="/rules" className={getNavLinkClass('/rules')}>{t('tabs.rules')}</Link>
            {isAdmin && (
              <Link to="/admin" className={getNavLinkClass('/admin')}>{t('admin')}</Link>
            )}

            {/* Language Switcher Desktop */}
            <button
              onClick={toggleLanguage}
              className="px-3 py-1.5 rounded-full border border-white/10 text-[10px] font-black text-white hover:bg-white/5 transition-all flex items-center gap-2 uppercase tracking-widest ml-2"
            >
              {i18n.language === 'vi' ? 'VN 🇻🇳' : 'EN 🇺🇸'}
            </button>

            {user && (
              <div className="flex items-center h-full gap-3 pl-4 border-l border-white/10">
                <Link to="/profile" className={`${getNavLinkClass('/profile')} !p-0`}>
                  <div className="flex items-center gap-2 group">
                    <UserAvatar name={displayName} avatarUrl={profile?.avatar_url} className="h-8 w-8 ring-2 ring-white/20 group-hover:ring-wc-accent transition-all shadow-md shrink-0" />
                    <span className="truncate max-w-[80px] text-white font-bold text-xs">{displayName}</span>
                  </div>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all border border-rose-500/20 shadow-lg group"
                  title={t('signOut')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            )}
            {!loading && !user && (
              <Link to="/login" className="btn-primary py-1.5 px-5 text-xs uppercase tracking-widest">{t('login')}</Link>
            )}
          </nav>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            {menuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      <div className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ${menuOpen ? 'visible' : 'invisible'}`}>
        <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${menuOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setMenuOpen(false)}></div>
        <aside className={`absolute right-0 top-0 bottom-0 w-[280px] bg-[#0a2647] shadow-2xl transition-transform duration-300 ease-out ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex flex-col h-full pt-20 p-6">
            {user && (
              <div className="mb-8 p-4 bg-white/5 rounded-2xl border border-white/10">
                <Link to="/profile" className="flex items-center gap-4">
                  <UserAvatar name={displayName} avatarUrl={profile?.avatar_url} className="h-12 w-12 ring-2 ring-wc-accent shadow-lg" />
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-white font-black truncate">{displayName}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t('profileTitle')}</span>
                  </div>
                </Link>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Link to="/" className={getNavLinkClass('/', true)}><span className="text-xl">📅</span><span className="font-bold uppercase tracking-widest text-xs">{t('tabs.dashboard')}</span></Link>
              <Link to="/standings" className={getNavLinkClass('/standings', true)}><span className="text-xl">📊</span><span className="font-bold uppercase tracking-widest text-xs">{t('tabs.standings')}</span></Link>
              <Link to="/bracket" className={getNavLinkClass('/bracket', true)}><span className="text-xl">🌳</span><span className="font-bold uppercase tracking-widest text-xs">{t('tabs.bracket')}</span></Link>
              <Link to="/leaderboard" className={getNavLinkClass('/leaderboard', true)}><span className="text-xl">🏆</span><span className="font-bold uppercase tracking-widest text-xs">{t('tabs.leaderboard')}</span></Link>
              <Link to="/news" className={getNavLinkClass('/news', true)}><span className="text-xl">📰</span><span className="font-bold uppercase tracking-widest text-xs">{t('tabs.news')}</span></Link>
              <Link to="/rules" className={getNavLinkClass('/rules', true)}><span className="text-xl">📜</span><span className="font-bold uppercase tracking-widest text-xs">{t('tabs.rules')}</span></Link>
              {isAdmin && (<Link to="/admin" className={getNavLinkClass('/admin', true)}><span className="text-xl">🛡️</span><span className="font-bold uppercase tracking-widest text-xs">{t('admin')}</span></Link>)}
            </div>

            {/* Language Switcher Mobile */}
            <div className="mt-6 pt-6 border-t border-white/10">
               <button
                onClick={toggleLanguage}
                className="w-full flex items-center justify-between p-4 bg-white/5 rounded-xl text-white font-bold text-xs uppercase tracking-widest"
               >
                 <span>Ngôn ngữ / Language</span>
                 <span className="bg-wc-accent/20 px-3 py-1 rounded-full text-wc-accent">{i18n.language === 'vi' ? 'VN 🇻🇳' : 'EN 🇺🇸'}</span>
               </button>
            </div>

            <div className="mt-auto pt-6 border-t border-white/10 flex flex-col gap-4">
              {!loading && !user ? (
                <Link to="/login" className="btn-primary w-full text-center uppercase tracking-widest text-xs py-4">{t('login')}</Link>
              ) : (
                <button onClick={handleSignOut} className="flex items-center gap-4 p-4 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all font-bold uppercase tracking-widest text-xs">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  {t('signOut')}
                </button>
              )}
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}
