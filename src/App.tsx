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
import Header from './components/Header'

export default function App() {
  const { t } = useTranslation()
  const { user, loading, isAdmin } = useAuth()

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">{t('loading')}</div>
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 relative">
      {/* Background Layer for Light Theme */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[#f1f5f9]"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-wc-canada rounded-full blur-[120px] opacity-[0.07]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-wc-mexico rounded-full blur-[120px] opacity-[0.05]"></div>
        <div className="absolute top-[20%] right-[10%] w-[50%] h-[50%] bg-wc-usa rounded-full blur-[120px] opacity-[0.05]"></div>
      </div>

      <Header />

      <main className="relative z-10 max-w-4xl mx-auto p-4 md:py-8 pt-32 md:pt-40">
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/" element={user ? <MatchesPage /> : <Navigate to="/login" />} />
          <Route path="/leaderboard" element={user ? <LeaderboardPage /> : <Navigate to="/login" />} />
          <Route path="/rules" element={user ? <RulesPage /> : <Navigate to="/login" />} />
          <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/login" />} />
          <Route path="/admin" element={user && isAdmin ? <AdminPage /> : <Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  )
}
