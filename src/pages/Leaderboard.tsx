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
  if (!row.rank || row.total <= 0 || row.rank > 3) return 'border-gray-200 bg-white/70'
  if (row.rank === 1) return 'border-amber-300 bg-amber-50'
  if (row.rank === 2) return 'border-slate-300 bg-slate-50'
  return 'border-orange-300 bg-orange-50'
}

export default function LeaderboardPage() {
  const { t } = useTranslation()
  const [totals, setTotals] = useState<LeaderboardRow[]>([])

  useEffect(() => {
    let chan: any
    api.fetchLeaderboardWithProfiles().then((rows: any[]) => setTotals(rows || [])).catch(console.error)
    chan = api.subscribeUserTotals((payload: any) => {
      const rec = payload.record
      api.fetchLeaderboardWithProfiles().then((rows: any[]) => {
        setTotals(rows || [])
      })
    })

    return () => { chan?.unsubscribe?.() }
  }, [])

  const rankedRows = getRankedRows(totals)
  const penalties = calculatePenalties(rankedRows.map((t) => ({ user_id: t.user_id, total: t.total })))

  return (
    <div className="rounded-lg bg-white/80 p-6 shadow-md">
      <h2 className="text-xl font-semibold mb-4">{t('realtimeLeaderboard')}</h2>
      <div className="space-y-2">
        {rankedRows.map((row) => {
          const pen = penalties.find((p) => p.user_id === row.user_id)
          const displayName = row.profile?.full_name || row.user_id
          const penalty = pen?.penalty ?? 0
          return (
            <div key={row.user_id} className={`flex items-center justify-between rounded border p-3 ${getRankClass(row)}`}>
              <div className="flex items-center space-x-3">
                <div className="w-8 text-lg font-bold">{row.rank}</div>
                <UserAvatar name={displayName} avatarUrl={row.profile?.avatar_url} />
                <div className="font-medium">{displayName}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{row.total} {t('pointsShort')}</div>
                <div className={`text-sm font-medium ${penalty > 0 ? 'text-rose-700' : 'text-gray-500'}`}>
                  {penalty > 0 ? `-${currency(penalty)}` : '0'} VND
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
