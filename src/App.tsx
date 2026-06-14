
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthProvider'
import Header from './components/Header'
import AuthPage from './pages/Auth'
import MatchesPage from './pages/Matches'
import LeaderboardPage from './pages/Leaderboard'
import StandingsPage from './pages/Standings'
import BracketPage from './pages/Bracket'
import NewsPage from './pages/News'
import RulesPage from './pages/Rules'
import ProfilePage from './pages/Profile'
import AdminPage from './pages/Admin'
import MatchHubPage from './pages/MatchHub'
import GatePage from './pages/Gate'
import FloatingMusicPlayer from './components/FloatingMusicPlayer'
import WorldCupBall from './components/WorldCupBall'

export default function App() {
  const { user, loading, isAdmin } = useAuth()
  const [hasTeamAccess, setHasTeamAccess] = React.useState(() => {
    return localStorage.getItem('team_access_granted') === 'true'
  })

  if (!hasTeamAccess) {
    return <GatePage onAccessGranted={() => setHasTeamAccess(true)} />
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 font-bold">Loading Arena...</div>
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 relative antialiased">
      {/* WORLD CUP 2026 BACKGROUND SYSTEM */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Base layer */}
        <div className="absolute inset-0 bg-[#f8fafc]"></div>

        {/* Ambient Host Nation Glows */}
        <div className="absolute top-[-10%] left-[-5%] w-[60%] h-[60%] bg-wc-canada rounded-full blur-[120px] opacity-[0.05]"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[60%] h-[60%] bg-wc-mexico rounded-full blur-[120px] opacity-[0.04]"></div>
        <div className="absolute top-[30%] right-[5%] w-[40%] h-[40%] bg-wc-usa rounded-full blur-[120px] opacity-[0.04]"></div>

        {/* Prominent Official Tri-Onda Balls in Background */}
        <div className="absolute top-[15%] right-[10%] opacity-[0.08]">
          <WorldCupBall size={150} animate="spin" />
        </div>
        <div className="absolute bottom-[20%] left-[5%] opacity-[0.06]">
          <WorldCupBall size={220} animate="bounce" />
        </div>
        <div className="absolute top-[40%] left-[15%] opacity-[0.04] hidden md:block">
          <WorldCupBall size={80} animate="spin" />
        </div>
        <div className="absolute top-[60%] right-[15%] opacity-[0.03] hidden md:block">
          <WorldCupBall size={120} animate="bounce" />
        </div>
        <div className="absolute bottom-[10%] right-[5%] opacity-[0.05]">
          <WorldCupBall size={100} animate="spin" />
        </div>
        <div className="absolute top-[5%] left-[25%] opacity-[0.02] hidden lg:block">
          <WorldCupBall size={60} animate="bounce" />
        </div>

        {/* Subtle center light */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-white/20"></div>
      </div>

      <Header />
      <main className="relative z-10 max-w-7xl mx-auto p-4 md:p-8 pt-32 md:pt-40">
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/" element={user ? <MatchesPage /> : <Navigate to="/login" />} />
          <Route path="/leaderboard" element={user ? <LeaderboardPage /> : <Navigate to="/login" />} />
          <Route path="/standings" element={user ? <StandingsPage /> : <Navigate to="/login" />} />
          <Route path="/bracket" element={user ? <BracketPage /> : <Navigate to="/login" />} />
          <Route path="/match/:id" element={user ? <MatchHubPage /> : <Navigate to="/login" />} />
          <Route path="/news" element={user ? <NewsPage /> : <Navigate to="/login" />} />
          <Route path="/rules" element={user ? <RulesPage /> : <Navigate to="/login" />} />
          <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/login" />} />
          <Route path="/admin" element={user && isAdmin ? <AdminPage /> : <Navigate to="/" />} />
        </Routes>
      </main>
      <FloatingMusicPlayer />
    </div>
  )
}
