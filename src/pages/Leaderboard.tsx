
import React, { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { DateTime } from 'luxon'
import * as api from '../lib/api'
import { calculatePenalties, getMultiplier } from '../lib/scoring'
import UserAvatar from '../components/UserAvatar'
import { useAuth } from '../context/AuthProvider'
import { getFlagUrl } from '../lib/flags'

type LeaderboardRow = {
  user_id: string
  total: number
  profile?: any
  rank?: number
}

type UserStats = {
  exact: number
  diff: number
  outcome: number
  wrong: number
  totalMatches: number
  lastFive: { points: number; label: string; matchId: number }[]
  biggestWin: number
  currentStreak: number
  history: any[]
}

function formatPenalty(amount: number) {
  if (amount === 0) return '0'
  return `-${Math.round(amount / 1000)}`
}

function getRankedRows(rows: LeaderboardRow[]) {
  let lastScore: number | null = null
  let lastRank = 0

  return rows.map((row, index) => {
    const rank = lastScore === row.total ? lastRank : index + 1
    lastScore = row.total
    lastRank = rank
    return { ...row, rank }
  })
}

function getRankClass(row: LeaderboardRow) {
  if (!row.rank || row.total <= 0 || row.rank > 3) return 'bg-white border-slate-100'
  if (row.rank === 1) return 'bg-white border-amber-300 shadow-[0_0_20px_rgba(255,183,0,0.15)] ring-1 ring-amber-100'
  if (row.rank === 2) return 'bg-white border-slate-300 ring-1 ring-slate-100'
  return 'bg-white border-orange-300 ring-1 ring-orange-100'
}

function getRankNumberClass(rank?: number) {
  if (rank === 1) return 'text-amber-500 font-black'
  if (rank === 2) return 'text-slate-400 font-bold'
  if (rank === 3) return 'text-orange-400 font-bold'
  return 'text-slate-300 font-semibold'
}

export default function LeaderboardPage() {
  const { t, i18n } = useTranslation()
  const { user, isAdmin } = useAuth()
  const [totals, setTotals] = useState<LeaderboardRow[]>([])
  const [matches, setMatches] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<LeaderboardRow | null>(null)
  const [managedUser, setManagedUser] = useState<LeaderboardRow | null>(null)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  const [activeSidebarTab, setActiveSidebarTab] = useState<'stats' | 'history'>('stats')
  const [personalStats, setPersonalStats] = useState<UserStats | null>(null)
  const [loadingPersonal, setLoadingPersonal] = useState(false)

  const [activePopupTab, setActivePopupTab] = useState<'stats' | 'history'>('stats')

  const fetchLeaderboard = () => {
    api.fetchLeaderboardWithProfiles().then((rows: any[]) => {
      const verifiedRows = rows.filter(r => r.profile?.is_verified === true)
      setTotals(verifiedRows)
    }).catch(console.error)
  }

  const fetchStatsForUser = async (userId: string) => {
    const matchPoints = await api.fetchUserMatchPoints(userId)
    const predictions = await api.fetchUserPredictions(userId)

    const sortedPoints = [...matchPoints].sort((a, b) => {
      const matchA = matches.find(m => m.id === a.match_id)
      const matchB = matches.find(m => m.id === b.match_id)
      return DateTime.fromISO(matchB?.start_time || '').toMillis() - DateTime.fromISO(matchA?.start_time || '').toMillis()
    })

    const stats: UserStats = {
      exact: 0, diff: 0, outcome: 0, wrong: 0,
      totalMatches: matchPoints.length,
      lastFive: [], biggestWin: 0, currentStreak: 0,
      history: []
    }

    matchPoints.forEach((mp: any) => {
      const mult = getMultiplier(mp.match_id)
      const basePoints = mp.points / mult
      if (mp.points > stats.biggestWin) stats.biggestWin = mp.points
      if (basePoints === 3) stats.exact++
      else if (basePoints === 2) stats.diff++
      else if (basePoints === 1) stats.outcome++
      else stats.wrong++
    })

    stats.history = sortedPoints.slice(0, 10).map(p => {
      const m = matches.find(match => match.id === p.match_id)
      const pred = predictions.find(pr => pr.match_id === p.match_id)
      return {
        id: p.match_id,
        team_a_full: m?.team_a,
        team_b_full: m?.team_b,
        team_a_code: t(`teams.${m?.team_a}`, { defaultValue: m?.team_a }).substring(0,3).toUpperCase(),
        team_b_code: t(`teams.${m?.team_b}`, { defaultValue: m?.team_b }).substring(0,3).toUpperCase(),
        score_a: m?.score_a,
        score_b: m?.score_b,
        predicted_a: pred?.predicted_a,
        predicted_b: pred?.predicted_b,
        points: p.points
      }
    })

    stats.lastFive = stats.history.slice(0, 5).map(h => ({
      points: h.points,
      label: `${h.team_a_code} vs ${h.team_b_code}`,
      matchId: h.id
    }))

    let streak = 0
    for (const p of sortedPoints) {
      if (p.points > 0) streak++
      else break
    }
    stats.currentStreak = streak
    return stats
  }

  const loadPersonalData = () => {
    if (user && matches.length > 0) {
      setLoadingPersonal(true)
      fetchStatsForUser(user.id).then(setPersonalStats).finally(() => setLoadingPersonal(false))
    }
  }

  useEffect(() => {
    api.fetchMatches().then(setMatches).catch(console.error)
    fetchLeaderboard()

    // Subscribe to multiple table changes for immediate feedback
    const chan = api.subscribeUserTotals(() => {
      fetchLeaderboard()
      loadPersonalData()
    })

    return () => { chan?.unsubscribe?.() }
  }, [user?.id])

  useEffect(() => {
    loadPersonalData()
  }, [user, matches.length])

  const handleUserClick = async (row: LeaderboardRow) => {
    setSelectedUser(row)
    setActivePopupTab('stats')
    setLoadingStats(true)
    setUserStats(null)
    try {
      const stats = await fetchStatsForUser(row.user_id)
      setUserStats(stats)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingStats(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm(t('admin_deletion.confirm_delete'))) return
    try {
      await api.deleteUserAccount(userId)
      setManagedUser(null)
      fetchLeaderboard()
    } catch (e) {
      alert(t('profileSaveFailed'))
    }
  }

  const getBadge = (stats: UserStats) => {
    if (stats.exact >= 5) return { icon: '🎯', label: t('stats.badges.sharpshooter'), color: 'text-rose-600 bg-rose-50' }
    if (stats.currentStreak >= 3) return { icon: '🔥', label: t('stats.badges.on_fire'), color: 'text-orange-600 bg-orange-50' }
    if (stats.totalMatches > 20 && stats.wrong === 0) return { icon: '🛡️', label: t('stats.badges.invincible'), color: 'text-blue-600 bg-blue-50' }
    if (stats.exact === 0 && stats.totalMatches > 5) return { icon: '🧊', label: t('stats.badges.cold_feet'), color: 'text-slate-400 bg-slate-50' }
    return { icon: '⚽', label: t('stats.badges.contender'), color: 'text-emerald-600 bg-emerald-50' }
  }

  const rankedRows = getRankedRows(totals)
  const penalties = calculatePenalties(rankedRows.map((t) => ({ user_id: t.user_id, total: t.total })))
  const myRow = rankedRows.find(r => r.user_id === user?.id)

  const renderHistoryTable = (history: any[]) => (
    <div className="overflow-hidden rounded-xl border border-slate-100 shadow-sm mb-4">
      <table className="w-full text-left border-collapse bg-white">
        <thead>
          <tr className="bg-slate-50/80 text-[8px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
            <th className="p-2">{t('stats.history_table.col_match')}</th>
            <th className="p-2 text-center">{t('stats.history_table.col_pred')}</th>
            <th className="p-2 text-center">{t('stats.history_table.col_result')}</th>
            <th className="p-2 text-right">{t('stats.history_table.col_pts')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {history.length > 0 ? history.map((h, i) => (
            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
              <td className="p-2 text-[9px] font-black text-slate-700 truncate">{h.team_a_code} <span className="text-[7px] text-slate-300">vs</span> {h.team_b_code}</td>
              <td className="p-2 text-[9px] font-bold text-center text-slate-400">{h.predicted_a}-{h.predicted_b}</td>
              <td className="p-2 text-[9px] font-black text-center text-[#0a2647]">{h.score_a !== null ? `${h.score_a}-${h.score_b}` : '-'}</td>
              <td className={`p-2 text-[10px] font-black text-right ${h.points > 0 ? 'text-emerald-500' : 'text-slate-300'}`}>+{h.points}</td>
            </tr>
          )) : (
            <tr><td colSpan={4} className="p-10 text-center text-[9px] font-bold text-slate-300 italic uppercase">{t('stats.history_table.no_history')}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="flex flex-col lg:flex-row gap-6 md:gap-8 items-start animate-in fade-in duration-500">
      {/* LEFT COLUMN */}
      <div className="flex-[7] w-full glass-card bg-white shadow-2xl border-white relative min-h-[400px] overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-2xl md:text-3xl font-black text-[#0a2647] uppercase tracking-tight italic flex items-center gap-3">
            <span className="p-2 bg-wc-accent/10 rounded-lg text-2xl">🏆</span>
            {t('realtimeLeaderboard')}
          </h2>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
            {t('liveUpdates')}
          </div>
        </div>

        <div className="p-4 md:p-8 bg-slate-100/30 space-y-3">
          {rankedRows.map((row) => {
            const pen = penalties.find((p) => p.user_id === row.user_id)
            const displayName = row.profile?.display_name || row.profile?.username || row.user_id
            const penalty = pen?.penalty ?? 0
            return (
              <div key={row.user_id} className={`flex items-center justify-between rounded-2xl border p-4 md:p-6 transition-all duration-300 hover:scale-[1.015] hover:shadow-lg cursor-pointer group shadow-sm ${getRankClass(row)}`} onClick={() => handleUserClick(row)}>
                <div className="flex items-center space-x-3 md:space-x-5 min-w-0 flex-1 h-full">
                  <div className={`w-6 md:w-8 text-xl md:text-2xl italic shrink-0 self-center ${getRankNumberClass(row.rank)}`}>{row.rank}</div>

                  <div className="flex items-center gap-6 md:gap-8 min-w-0 flex-1 relative h-full">
                    <div className="relative shrink-0 flex items-center justify-center">
                      <UserAvatar name={displayName} avatarUrl={row.profile?.avatar_url} className="h-10 w-10 md:h-12 md:w-12 lg:h-14 lg:w-14 ring-2 ring-slate-100 group-hover:ring-wc-accent transition-all shadow-md" />
                      {row.rank === 1 && <span className="absolute -top-[16px] left-1/2 -translate-x-1/2 z-10 text-2xl drop-shadow-lg animate-crown-wiggle select-none pointer-events-none">👑</span>}
                      {row.rank === 2 && <span className="absolute -bottom-1 -right-1 z-10 text-base md:text-lg drop-shadow-md transform rotate-12 select-none">🥈</span>}
                      {row.rank === 3 && <span className="absolute -bottom-1 -right-1 z-10 text-base md:text-lg drop-shadow-md transform -rotate-12 select-none">🥉</span>}
                    </div>

                    <div className="min-w-0 flex-1 flex flex-col justify-center h-full relative px-1">
                      <div className="font-black text-slate-800 text-sm md:text-base lg:text-lg leading-none group-hover:text-[#0a2647] transition-colors truncate">
                        {displayName}
                      </div>
                      <div className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest absolute top-full left-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        {row.profile?.real_name || 'ID: ' + row.user_id.substring(0, 8)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4 md:space-x-8 ml-4 shrink-0 self-center">
                  <div className="text-right">
                    <div className="font-black text-2xl md:text-3xl text-[#0a2647] tracking-tighter leading-none">
                      {row.total} <span className="text-[8px] md:text-[10px] uppercase ml-0.5 opacity-60 font-bold">{t('pts')}</span>
                    </div>
                    <div className={`text-[10px] md:text-sm font-black uppercase tracking-widest mt-2 ${penalty > 0 ? 'text-rose-600 animate-pulse-slow' : 'text-slate-200'}`}>
                      {formatPenalty(penalty)}
                    </div>
                  </div>
                  {isAdmin && (
                    <button onClick={(e) => { e.stopPropagation(); setManagedUser(row); }} className="p-2 text-slate-300 hover:text-[#0a2647] hover:bg-slate-100 rounded-full transition-all shrink-0"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zM10 12a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg></button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <aside className="hidden lg:block flex-[3] sticky top-24 w-full space-y-6 pb-10">
        <div className="glass-card bg-white shadow-xl border-none overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-wc-accent to-wc-gold"></div>
          {loadingPersonal ? (
            <div className="py-20 flex flex-col items-center gap-4"><div className="animate-spin h-8 w-8 border-2 border-[#0a2647] border-t-transparent rounded-full"></div></div>
          ) : personalStats && (
            <div className="flex flex-col">
              <div className="p-6 flex flex-col items-center text-center border-b border-slate-50">
                <div className="relative mb-4">
                  <UserAvatar name={myRow?.profile?.display_name || user?.email} avatarUrl={myRow?.profile?.avatar_url} className="h-16 w-16 md:h-20 md:w-20 ring-4 ring-slate-50 shadow-xl" />
                  <div className="absolute -bottom-1 -right-1 bg-[#0a2647] text-white font-black text-[10px] h-7 w-7 flex items-center justify-center rounded-xl shadow-lg border-2 border-white italic">#{myRow?.rank || '?'}</div>
                </div>
                <h3 className="text-lg font-black text-[#0a2647] uppercase tracking-tighter italic truncate w-full">{myRow?.profile?.display_name || user?.email?.split('@')[0]}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 mb-2">{myRow?.profile?.real_name}</p>
                {(() => { const badge = getBadge(personalStats); return <div className={`mt-2 px-3 py-1 rounded-full border border-current font-black text-[8px] uppercase tracking-widest ${badge.color}`}>{badge.icon} {badge.label}</div> })()}
              </div>
              <div className="flex bg-slate-50/50">
                <button onClick={() => setActiveSidebarTab('stats')} className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest border-b-2 transition-all ${activeSidebarTab === 'stats' ? 'border-[#0a2647] text-[#0a2647] bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>{t('stats.tabs.stats')}</button>
                <button onClick={() => setActiveSidebarTab('history')} className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest border-b-2 transition-all ${activeSidebarTab === 'history' ? 'border-[#0a2647] text-[#0a2647] bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>{t('stats.tabs.history')}</button>
              </div>
              <div className="p-5 animate-in fade-in duration-300">
                 {activeSidebarTab === 'stats' ? (
                   <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-3"><div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 flex flex-col items-center"><span className="text-xl mb-1">🎯</span><span className="text-[8px] font-black text-emerald-800 uppercase tracking-widest">{t('stats.bullseye')}</span><span className="text-xl font-black text-emerald-700">{personalStats.exact}</span></div><div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100 flex flex-col items-center"><span className="text-xl mb-1">🔥</span><span className="text-[8px] font-black text-orange-800 uppercase tracking-widest">{t('stats.streak')}</span><span className="text-xl font-black text-orange-700">{personalStats.currentStreak}</span></div></div>
                      <div className="space-y-3"><div className="flex items-center justify-between px-1"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{t('stats.current_form')}</h4><span className="text-[8px] font-bold text-slate-300 uppercase">{t('stats.history_table.last_5')}</span></div><div className="space-y-2">{personalStats.history.slice(0, 5).map((h, i) => (<div key={i} className="bg-slate-50/80 p-2 rounded-xl border border-slate-100 flex items-center justify-between gap-2 group transition-all hover:bg-white hover:shadow-sm"><div className="flex items-center gap-2 flex-1 min-w-0"><div className="flex flex-col gap-0.5 shrink-0"><img src={getFlagUrl(h.team_a_full) || ''} className="h-2.5 w-4 rounded-[1px] shadow-sm" alt="" /><img src={getFlagUrl(h.team_b_full) || ''} className="h-2.5 w-4 rounded-[1px] shadow-sm" alt="" /></div><div className="min-w-0 flex-1"><div className="text-[9px] font-black text-slate-700 truncate">{h.team_a_code} vs {h.team_b_code}</div><div className="text-[8px] font-bold text-slate-400">P:{h.predicted_a}-{h.predicted_b} | R:{h.score_a}-{h.score_b}</div></div></div><div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black ${h.points > 0 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-300'}`}>+{h.points}</div></div>))}</div></div>
                      <div className="space-y-2 pt-2 border-t border-slate-50"><div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-400"><span>{t('stats.accuracy')}</span><span className="text-[#0a2647]">{personalStats.totalMatches > 0 ? Math.round(((personalStats.totalMatches - personalStats.wrong) / personalStats.totalMatches) * 100) : 0}%</span></div><div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden"><div style={{ width: `${personalStats.totalMatches > 0 ? Math.round(((personalStats.totalMatches - personalStats.wrong) / personalStats.totalMatches) * 100) : 0}%` }} className="bg-emerald-500 h-full"></div></div></div>
                   </div>
                 ) : renderHistoryTable(personalStats.history)}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* PLAYER STATS MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 md:p-10">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedUser(null)}></div>
          <div className="relative glass-card w-full max-w-md bg-white overflow-hidden animate-in zoom-in-95 duration-300 border-slate-200 shadow-[0_20px_60px_rgba(0,0,0,0.3)] max-h-[70vh] flex flex-col rounded-[2.5rem] mt-10">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-wc-accent via-wc-gold to-wc-canada z-30"></div>
            <button onClick={() => setSelectedUser(null)} className="absolute top-4 right-4 text-slate-300 hover:text-[#0a2647] transition-all p-2 bg-white/80 rounded-full z-40 shadow-sm"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>

            <div className="overflow-y-auto no-scrollbar flex-1">
              {loadingStats ? (
                <div className="py-20 flex flex-col items-center gap-4"><div className="animate-spin h-10 w-10 border-4 border-[#0a2647] border-t-transparent rounded-full"></div><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{t('stats.analyzing')}</p></div>
              ) : userStats && (
                <div className="p-6 md:p-8 space-y-6">
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="relative shrink-0">
                      <UserAvatar name={selectedUser.profile?.display_name || selectedUser.profile?.username} avatarUrl={selectedUser.profile?.avatar_url} className="h-20 w-20 md:h-24 md:w-24 text-3xl ring-4 ring-slate-50 shadow-xl" />
                      <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-wc-gold to-orange-500 text-white font-black text-[10px] h-7 w-7 md:h-8 md:w-8 flex items-center justify-center rounded-xl shadow-lg border-2 border-white italic">#{selectedUser.rank}</div>
                    </div>
                    <div className="flex flex-col items-center min-w-0">
                      <h3 className="text-xl md:text-2xl font-black text-[#0a2647] uppercase tracking-tighter italic leading-none truncate max-w-full px-2">
                        {selectedUser.profile?.display_name || selectedUser.profile?.username}
                      </h3>
                      {selectedUser.profile?.real_name && (
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                          {selectedUser.profile?.real_name}
                        </p>
                      )}
                      {(() => { const badge = getBadge(userStats); return <div className={`mt-3 px-3 py-1 rounded-full border border-current font-black text-[8px] uppercase tracking-widest w-fit ${badge.color}`}>{badge.icon} {badge.label}</div> })()}
                    </div>
                  </div>

                  <div className="flex bg-slate-50/50 rounded-2xl overflow-hidden p-1 border border-slate-100">
                    <button onClick={() => setActivePopupTab('stats')} className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${activePopupTab === 'stats' ? 'bg-white text-[#0a2647] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{t('stats.tabs.stats')}</button>
                    <button onClick={() => setActivePopupTab('history')} className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${activePopupTab === 'history' ? 'bg-white text-[#0a2647] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{t('stats.tabs.history')}</button>
                  </div>

                  <div className="animate-in fade-in duration-300">
                    {activePopupTab === 'stats' ? (
                      <div className="space-y-6">
                        <div className="bg-slate-50/50 p-4 md:p-6 rounded-[2rem] border border-slate-100 shadow-inner">
                          <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-center mb-4 italic">{t('stats.current_form')}</h4>
                          <div className="flex justify-center items-center gap-3 overflow-x-auto no-scrollbar pb-1">{userStats.lastFive.length > 0 ? userStats.lastFive.map((f, i) => (<div key={i} className="group relative flex flex-col items-center"><div className={`w-9 h-9 md:w-11 md:h-11 rounded-xl flex items-center justify-center text-base font-black shadow-lg transition-transform hover:scale-110 ${f.points > 0 ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-rose-500 text-white shadow-rose-200'}`}>{f.points}</div><span className="absolute -bottom-6 text-[7px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-[#0a2647] text-white px-2 py-1 rounded border border-white/10 shadow-sm z-50">{f.label}</span></div>)) : <p className="text-xs text-slate-400 italic">{t('stats.no_data')}</p>}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 md:gap-4"><div className="bg-emerald-50/30 p-4 rounded-[1.5rem] border border-emerald-100 flex flex-col items-center text-center"><span className="text-2xl mb-1">🎯</span><span className="text-[8px] font-black text-emerald-800 uppercase tracking-widest mb-1">{t('stats.bullseye')}</span><span className="text-2xl font-black text-emerald-700">{userStats.exact}</span></div><div className="bg-orange-50/30 p-4 rounded-[1.5rem] border border-orange-100 flex flex-col items-center text-center"><span className="text-2xl mb-1">🔥</span><span className="text-[8px] font-black text-orange-800 uppercase tracking-widest mb-1">{t('stats.streak')}</span><span className="text-2xl font-black text-orange-700">{userStats.currentStreak}</span></div></div>
                        <div className="space-y-2"><div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400"><span>{t('stats.overall_accuracy')}</span><span className="text-[#0a2647]">{userStats.totalMatches > 0 ? Math.round(((userStats.totalMatches - userStats.wrong) / userStats.totalMatches) * 100) : 0}%</span></div><div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner"><div style={{ width: `${userStats.totalMatches > 0 ? Math.round(((userStats.totalMatches - userStats.wrong) / userStats.totalMatches) * 100) : 0}%` }} className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full transition-all duration-1000"></div></div></div>
                      </div>
                    ) : renderHistoryTable(userStats.history)}
                  </div>

                  <div className="flex flex-col items-center gap-2 pt-4 border-t border-slate-100 pb-4">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">{t('stats.since')} {DateTime.fromISO(selectedUser.profile?.created_at).setLocale(i18n.language).toLocaleString(DateTime.DATE_MED)}</p>
                    <div className="px-4 py-1.5 bg-slate-900 rounded-full text-[9px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2 shadow-xl"><span className="text-wc-accent animate-pulse">●</span> {userStats.totalMatches} {t('stats.predicted_count')}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADMIN ACTION MODAL */}
      {managedUser && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setManagedUser(null)}></div>
          <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200">
             <div className="p-8">
                <div className="flex flex-col items-center text-center mb-8">
                   <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-3xl mb-4">🛡️</div>
                   <h4 className="text-xl font-black text-[#0a2647] uppercase tracking-tighter italic">{t('admin_leaderboard.manage_player')}</h4>
                   <p className="text-sm font-bold text-slate-400 mt-1">{managedUser.profile?.display_name || managedUser.profile?.username}</p>
                   <code className="text-[10px] bg-slate-50 px-2 py-1 rounded mt-2 text-slate-400">ID: {managedUser.user_id}</code>
                </div>
                <div className="space-y-3"><button onClick={() => handleDeleteUser(managedUser.user_id)} className="w-full py-4 bg-rose-50 text-rose-600 font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center gap-3 border border-rose-100"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>{t('admin_leaderboard.delete_account')}</button><button onClick={() => setManagedUser(null)} className="w-full py-4 bg-slate-50 text-slate-400 font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-slate-100 transition-all">{t('admin_leaderboard.close')}</button></div>
             </div>
          </div>
        </div>
      )}
    </div>
  )
}
