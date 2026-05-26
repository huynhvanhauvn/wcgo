
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

export default function App() {
  const { user, loading, isAdmin } = useAuth()

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 font-bold">Loading Arena...</div>
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      <Header />
      <main className="max-w-7xl mx-auto p-4 md:p-8 pt-32 md:pt-40 relative z-10">
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
    </div>
  )
}
