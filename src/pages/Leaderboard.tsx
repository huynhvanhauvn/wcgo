import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as api from '../lib/api'
import { calculatePenalties } from '../lib/scoring'
import UserAvatar from '../components/UserAvatar'

type LeaderboardRow = {
  user_id: string
  total: number
  profile?: any
  rank?: number
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
  const { t } = useTranslation()
  const [totals, setTotals] = useState<LeaderboardRow[]>([])

  useEffect(() => {
    let chan: any
    api.fetchLeaderboardWithProfiles().then((rows: any[]) => setTotals(rows || [])).catch(console.error)
    chan = api.subscribeUserTotals((payload: any) => {
      api.fetchLeaderboardWithProfiles().then((rows: any[]) => {
        setTotals(rows || [])
      })
    })

    return () => { chan?.unsubscribe?.() }
  }, [])

  const rankedRows = getRankedRows(totals)
  const penalties = calculatePenalties(rankedRows.map((t) => ({ user_id: t.user_id, total: t.total })))

  return (
    <div className="glass-card p-6 md:p-8 bg-white/90 shadow-xl border-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-slate-100 pb-6">
        <h2 className="text-3xl font-black text-[#0a2647] uppercase tracking-tight italic flex items-center gap-3">
          <span className="p-2 bg-wc-accent/10 rounded-lg">🏆</span>
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
            <div key={row.user_id} className={`flex items-center justify-between rounded-2xl border p-4 transition-all duration-300 hover:shadow-md ${getRankClass(row)}`}>
              <div className="flex items-center space-x-4">
                <div className={`w-8 text-2xl italic ${getRankNumberClass(row.rank)}`}>
                  {row.rank}
                </div>
                <div className="relative group">
                  <UserAvatar name={displayName} avatarUrl={row.profile?.avatar_url} className="h-12 w-12 ring-2 ring-slate-100 group-hover:ring-wc-accent transition-all shadow-sm" />
                  {row.rank === 1 && <span className="absolute -top-1 -right-1 text-lg">👑</span>}
                </div>
                <div className="flex flex-col">
                  <div className="font-bold text-slate-800 text-lg leading-tight">{displayName}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{row.user_id.substring(0, 8)}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-black text-xl text-[#0a2647] tracking-tighter">
                  {row.total} <span className="text-xs uppercase ml-1 opacity-70">{t('pointsShort')}</span>
                </div>
                {/* Penalty highlight: Red text with minus sign */}
                <div className={`text-xs font-black uppercase tracking-wider ${penalty > 0 ? 'text-rose-600 animate-pulse-slow' : 'text-slate-300'}`}>
                  {penalty > 0 ? `- ${currency(penalty)}` : '0'} <span className="text-[10px]">VND</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
