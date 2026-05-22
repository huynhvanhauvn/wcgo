import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from './context/AuthProvider'
import AuthPage from './pages/Auth'
import MatchesPage from './pages/Matches'
import LeaderboardPage from './pages/Leaderboard'
import AdminPage from './pages/Admin'
import ProfilePage from './pages/Profile'
import Header from './components/Header'

export default function App() {
  const { t } = useTranslation()
  const { user, loading, isAdmin } = useAuth()

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">{t('loading')}</div>
  }

  return (
    <div className="min-h-screen bg-wc-bg text-wc-foreground">
      <Header />
      <main className="max-w-4xl mx-auto p-4">
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/" element={user ? <MatchesPage /> : <Navigate to="/login" />} />
          <Route path="/leaderboard" element={user ? <LeaderboardPage /> : <Navigate to="/login" />} />
          <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/login" />} />
          <Route path="/admin" element={user && isAdmin ? <AdminPage /> : <Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  )
}
