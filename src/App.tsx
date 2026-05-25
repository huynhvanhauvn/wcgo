import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from './context/AuthProvider'
import AuthPage from './pages/Auth'
import MatchesPage from './pages/Matches'
import LeaderboardPage from './pages/Leaderboard'
import AdminPage from './pages/Admin'
import ProfilePage from './pages/Profile'
import RulesPage from './pages/Rules'
import NewsPage from './pages/News'
import StandingsPage from './pages/Standings'
import BracketPage from './pages/Bracket'
import Header from './components/Header'

export default function App() {
  const { t } = useTranslation()
  const { user, loading, isAdmin } = useAuth()

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">{t('loading')}</div>
  }

  // Refined WC2026 Blueprint Pattern - Cleaned for Data URI compatibility
  const wcPattern = `
    <svg width='160' height='160' viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'>
      <g stroke='black' stroke-width='0.5' fill='none'>
        <g transform='translate(15, 15)'>
          <path d='M8 2 h4 v6 a2 2 0 0 1-4 0 v-6 z M6 4 h2 M12 4 h2 M10 8 v2 M8 10 h4' stroke-width='0.3'/>
          <text x='7' y='18' font-family='sans-serif' font-weight='bold' font-size='6' fill='black' stroke='none'>2</text>
          <text x='7' y='25' font-family='sans-serif' font-weight='bold' font-size='6' fill='black' stroke='none'>6</text>
        </g>
        <path d='M90 20 l2 6 6-2-2 8 8 2-6 5 3 9-9-3-3 8-3-8-9 3 3-9-6-5 8-2-2-8 6 2 2-6z' />
        <path d='M130 30 l3 10 10 0-8 7 3 10-8-7-8 7 3-10-8-7 10 0z' opacity='0.5'/>
        <g transform='translate(30, 90)'>
          <circle cx='20' cy='20' r='12'/>
          <circle cx='20' cy='20' r='8' stroke-dasharray='2,1'/>
          <path d='M20 5 v5 M20 35 v-5 M5 20 h5 M35 20 h-5'/>
        </g>
        <g transform='translate(100, 100)'>
          <circle cx='20' cy='20' r='15'/>
          <path d='M20 5 l4 6 h-8 z M5 15 l6-2 2 6-6 2z M35 15 l-6-2-2 6 6 2z M10 30 l8-2 8 2-4 5z'/>
        </g>
        <path d='M0 80 h160 M80 0 v160' stroke-width='0.1' stroke-dasharray='5,5' opacity='0.2'/>
      </g>
    </svg>
  `.replace(/\s+/g, ' ').trim();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 relative antialiased">
      {/* ADVANCED WORLD CUP 2026 BACKGROUND SYSTEM */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Base layer */}
        <div className="absolute inset-0 bg-[#f8fafc]"></div>

        {/* Detailed Pattern layer - Higher opacity and fixed encoding */}
        <div className="absolute inset-0 opacity-[0.08]"
             style={{
               backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(wcPattern)}")`,
               backgroundSize: '320px'
             }}>
        </div>

        {/* Ambient Host Nation Glows */}
        <div className="absolute top-[-10%] left-[-5%] w-[60%] h-[60%] bg-wc-canada rounded-full blur-[120px] opacity-[0.05]"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[60%] h-[60%] bg-wc-mexico rounded-full blur-[120px] opacity-[0.04]"></div>
        <div className="absolute top-[30%] right-[5%] w-[40%] h-[40%] bg-wc-usa rounded-full blur-[120px] opacity-[0.04]"></div>

        {/* Subtle center light */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-white/20"></div>
      </div>

      <Header />

      <main className="relative z-10 max-w-7xl mx-auto p-4 md:p-8 pt-28 md:pt-40">
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/" element={user ? <MatchesPage /> : <Navigate to="/login" />} />
          <Route path="/leaderboard" element={user ? <LeaderboardPage /> : <Navigate to="/login" />} />
          <Route path="/standings" element={user ? <StandingsPage /> : <Navigate to="/login" />} />
          <Route path="/bracket" element={user ? <BracketPage /> : <Navigate to="/login" />} />
          <Route path="/news" element={user ? <NewsPage /> : <Navigate to="/login" />} />
          <Route path="/rules" element={user ? <RulesPage /> : <Navigate to="/login" />} />
          <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/login" />} />
          <Route path="/admin" element={user && isAdmin ? <AdminPage /> : <Navigate to="/" />} />
        </Routes>
      </main>

      {/* Modern footer spacing */}
      <footer className="h-10 md:h-0"></footer>
    </div>
  )
}
