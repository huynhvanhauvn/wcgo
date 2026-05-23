import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DateTime } from 'luxon'
import * as api from '../lib/api'
import { calculatePenalties, getMultiplier } from '../lib/scoring'
import UserAvatar from '../components/UserAvatar'

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
}

function currency(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount)
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
  if (row.rank === 1) return 'bg-amber-50/50 border-amber-200 shadow-[0_0_15px_rgba(255,183,0,0.1)]'
  if (row.rank === 2) return 'bg-slate-50/50 border-slate-200'
  return 'bg-orange-50/50 border-orange-200'
}

function getRankNumberClass(rank?: number) {
  if (rank === 1) return 'text-amber-500 font-black'
  if (rank === 2) return 'text-slate-400 font-bold'
  if (rank === 3) return 'text-orange-400 font-bold'
  return 'text-slate-300 font-semibold'
}

export default function LeaderboardPage() {
  const { t, i18n } = useTranslation()
  const [totals, setTotals] = useState<LeaderboardRow[]>([])
  const [matches, setMatches] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<LeaderboardRow | null>(null)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  useEffect(() => {
    api.fetchMatches().then(setMatches).catch(console.error)
    api.fetchLeaderboardWithProfiles().then((rows: any[]) => setTotals(rows || [])).catch(console.error)
    const chan = api.subscribeUserTotals(() => {
      api.fetchLeaderboardWithProfiles().then((rows: any[]) => {
        setTotals(rows || [])
      })
    })

    return () => { chan?.unsubscribe?.() }
  }, [])

  const handleUserClick = async (row: LeaderboardRow) => {
    setSelectedUser(row)
    setLoadingStats(true)
    setUserStats(null)
    try {
      const matchPoints = await api.fetchUserMatchPoints(row.user_id)

      const sortedPoints = [...matchPoints].sort((a, b) => {
        const timeA = matches.find(m => m.id === a.match_id)?.start_time || ''
        const timeB = matches.find(m => m.id === b.match_id)?.start_time || ''
        return DateTime.fromISO(timeB).toMillis() - DateTime.fromISO(timeA).toMillis()
      })

      const stats: UserStats = {
        exact: 0,
        diff: 0,
        outcome: 0,
        wrong: 0,
        totalMatches: matchPoints.length,
        lastFive: [],
        biggestWin: 0,
        currentStreak: 0
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

      stats.lastFive = sortedPoints.slice(0, 5).map(p => {
        const m = matches.find(match => match.id === p.match_id)
        return {
          points: p.points,
          label: m ? `${m.team_a.substring(0,3)} vs ${m.team_b.substring(0,3)}` : 'Match',
          matchId: p.match_id
        }
      })

      let streak = 0
      for (const p of sortedPoints) {
        if (p.points > 0) streak++
        else break
      }
      stats.currentStreak = streak

      setUserStats(stats)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingStats(false)
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

  return (
    <div className="glass-card p-6 md:p-8 bg-white/90 shadow-xl border-white relative min-h-[400px]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-slate-100 pb-6">
        <h2 className="text-3xl font-black text-[#0a2647] uppercase tracking-tight italic flex items-center gap-3">
          <span className="p-2 bg-wc-accent/10 rounded-lg text-2xl">🏆</span>
          {t('realtimeLeaderboard')}
        </h2>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
          {t('liveUpdates')}
        </div>
      </div>

      <div className="space-y-3">
        {rankedRows.map((row) => {
          const pen = penalties.find((p) => p.user_id === row.user_id)
          const displayName = row.profile?.display_name || row.profile?.username || row.user_id
          const penalty = pen?.penalty ?? 0

          return (
            <div
              key={row.user_id}
              onClick={() => handleUserClick(row)}
              className={`flex items-center justify-between rounded-2xl border p-4 transition-all duration-300 hover:scale-[1.01] cursor-pointer group shadow-sm ${getRankClass(row)}`}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-8 text-2xl italic ${getRankNumberClass(row.rank)}`}>
                  {row.rank}
                </div>
                <div className="relative">
                  <UserAvatar name={displayName} avatarUrl={row.profile?.avatar_url} className="h-12 w-12 ring-2 ring-slate-100 group-hover:ring-wc-accent transition-all shadow-sm" />
                  {row.rank === 1 && (
                    <span className="absolute -top-[20px] left-[38%] -translate-x-1/2 z-10 text-2xl drop-shadow-lg animate-crown-wiggle select-none pointer-events-none">👑</span>
                  )}
                </div>
                <div className="flex flex-col">
                  <div className="font-bold text-slate-800 text-lg leading-tight group-hover:text-[#0a2647]">{displayName}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{row.user_id.substring(0, 8)}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-black text-xl text-[#0a2647] tracking-tighter">
                  {row.total} <span className="text-xs uppercase ml-1 opacity-70">{t('pts')}</span>
                </div>
                <div className={`text-xs font-black uppercase tracking-wider ${penalty > 0 ? 'text-rose-600 animate-pulse-slow' : 'text-slate-300'}`}>
                  {penalty > 0 ? `- ${currency(penalty)}` : '0'} <span className="text-[10px]">VND</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* MODAL OVERLAY */}
      {selectedUser && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-transparent animate-in fade-in duration-300"
            onClick={() => setSelectedUser(null)}
          ></div>

          <div className="relative glass-card w-full max-w-lg bg-white p-6 md:p-10 overflow-hidden animate-in zoom-in-95 duration-300 border-slate-200 shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-wc-accent via-wc-gold to-wc-canada"></div>

            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 text-slate-300 hover:text-[#0a2647] transition-all p-2 bg-slate-50 rounded-full"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {loadingStats ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="animate-spin h-12 w-12 border-4 border-[#0a2647] border-t-transparent rounded-full"></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{t('stats.analyzing')}</p>
              </div>
            ) : userStats && (
              <div className="space-y-8">
                <div className="flex flex-col items-center">
                  <div className="relative mb-4">
                    <UserAvatar
                      name={selectedUser.profile?.display_name || selectedUser.profile?.username}
                      avatarUrl={selectedUser.profile?.avatar_url}
                      className="h-28 w-28 text-4xl ring-8 ring-slate-50 shadow-2xl"
                    />
                    <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-wc-gold to-orange-500 text-white font-black text-lg h-12 w-12 flex items-center justify-center rounded-2xl shadow-xl border-4 border-white italic">
                      #{selectedUser.rank}
                    </div>
                  </div>

                  {(() => {
                    const badge = getBadge(userStats)
                    return (
                      <div className={`mt-2 px-4 py-1 rounded-full border border-current font-black text-[10px] uppercase tracking-widest ${badge.color}`}>
                        {badge.icon} {badge.label}
                      </div>
                    )
                  })()}

                  <h3 className="text-3xl font-black text-[#0a2647] uppercase tracking-tighter italic mt-4">
                    {selectedUser.profile?.display_name || selectedUser.profile?.username}
                  </h3>
                </div>

                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-inner">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-center mb-5">{t('stats.current_form')}</h4>
                  <div className="flex justify-center items-center gap-3 overflow-x-auto no-scrollbar pb-2">
                    {userStats.lastFive.length > 0 ? userStats.lastFive.map((f, i) => (
                      <div key={i} className="group relative flex flex-col items-center">
                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center text-lg font-black shadow-lg transition-transform hover:scale-110
                          ${f.points > 0 ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-rose-500 text-white shadow-rose-200'}`}>
                          {f.points}
                        </div>
                        <span className="absolute -bottom-6 text-[8px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-[#0a2647] text-white px-2 py-1 rounded border border-white/10 shadow-sm z-20">
                          {f.label}
                        </span>
                      </div>
                    )) : (
                      <p className="text-xs text-slate-400 italic">{t('stats.no_data')}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 flex flex-col items-center">
                     <span className="text-2xl mb-1">🎯</span>
                     <span className="text-[9px] font-black text-emerald-800 uppercase tracking-widest mb-1">{t('stats.exact')}</span>
                     <span className="text-2xl font-black text-emerald-700">{userStats.exact}</span>
                   </div>
                   <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100 flex flex-col items-center">
                     <span className="text-2xl mb-1">🔥</span>
                     <span className="text-[9px] font-black text-orange-800 uppercase tracking-widest mb-1">Streak</span>
                     <span className="text-2xl font-black text-orange-700">{userStats.currentStreak}</span>
                   </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span>{t('stats.accuracy')}</span>
                    <span className="text-[#0a2647]">
                      {userStats.totalMatches > 0 ? Math.round(((userStats.totalMatches - userStats.wrong) / userStats.totalMatches) * 100) : 0}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <div
                      style={{ width: `${userStats.totalMatches > 0 ? Math.round(((userStats.totalMatches - userStats.wrong) / userStats.totalMatches) * 100) : 0}%` }}
                      className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full transition-all duration-1000"
                    ></div>
                  </div>
                </div>

                <p className="text-center text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] pt-4">
                  {t('stats.since')} {DateTime.fromISO(selectedUser.profile?.created_at).setLocale(i18n.language).toLocaleString(DateTime.DATE_MED)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
