import React, { useEffect, useState } from 'react'
import { DateTime } from 'luxon'
import { useTranslation } from 'react-i18next'
import MatchCard from '../components/MatchCard'
import WorldCupMark from '../components/WorldCupMark'
import CountdownTimer from '../components/CountdownTimer'
import { useAuth } from '../context/AuthProvider'
import * as api from '../lib/api'

type Match = {
  id: number
  team_a: string
  team_b: string
  start_time: string
  venue?: string
  status?: string
  score_a?: number | null
  score_b?: number | null
}

type Prediction = {
  match_id: number
  predicted_a: number
  predicted_b: number
  created_at?: string | null
}

export default function MatchesPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [matches, setMatches] = useState<Match[]>([])
  const [predictionsByMatch, setPredictionsByMatch] = useState<Record<number, Prediction>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    let chan: any
    api.fetchMatches()
      .then((rows: any) => {
        if (!mounted) return
        setMatches(rows || [])
      })
      .catch((e) => {
        console.error(e)
        if (mounted) setError(e.message || t('matchesLoadError'))
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    chan = api.subscribeMatches((payload: any) => {
      const record = payload.new ?? payload.record
      if (!record) return
      setMatches((current) => {
        const next = current.filter((match) => match.id !== record.id)
        next.push(record)
        return next.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      })
    })
    return () => {
      mounted = false
      chan?.unsubscribe?.()
    }
  }, [t])

  useEffect(() => {
    let mounted = true

    if (!user) {
      setPredictionsByMatch({})
      return
    }

    api.fetchUserPredictions(user.id)
      .then((rows: any[]) => {
        if (!mounted) return
        const next: Record<number, Prediction> = {}
        ;(rows || []).forEach((prediction) => {
          next[prediction.match_id] = prediction
        })
        setPredictionsByMatch(next)
      })
      .catch((e) => console.error(e))

    return () => { mounted = false }
  }, [user])

  const handlePredictionSaved = (prediction: Prediction) => {
    setPredictionsByMatch((current) => ({
      ...current,
      [prediction.match_id]: prediction
    }))
  }

  if (loading) {
    return (
      <div className="glass-card p-10 flex flex-col items-center gap-4 bg-white shadow-xl">
        <div className="animate-spin h-8 w-8 border-4 border-wc-accent border-t-transparent rounded-full"></div>
        <div className="text-sm font-bold text-wc-accent uppercase tracking-widest">{t('loadingMatches')}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass-card p-10 text-center bg-white shadow-xl">
        <h2 className="text-xl font-bold text-rose-600 mb-2 uppercase tracking-tight">{t('matchesLoadError')}</h2>
        <p className="text-slate-500 font-medium">{error}</p>
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="glass-card p-10 text-center bg-white shadow-xl">
        <h2 className="text-xl font-bold text-wc-gold mb-2 uppercase tracking-tight">{t('noMatches')}</h2>
        <p className="text-slate-400 font-medium">{t('noMatchesHint')}</p>
      </div>
    )
  }

  const upcomingMatches = matches.filter((match) => {
    const startTime = DateTime.fromISO(match.start_time)
    return startTime >= DateTime.now() && match.status !== 'FINISHED'
  })

  const nextMatch = upcomingMatches[0] || null

  const firstUpcomingTime = nextMatch ? DateTime.fromISO(nextMatch.start_time) : null
  const highlightedMatches = firstUpcomingTime
    ? upcomingMatches.filter((match) => {
        const startTime = DateTime.fromISO(match.start_time)
        return startTime <= firstUpcomingTime.plus({ days: 2 })
      })
    : []

  return (
    <div className="space-y-12">
      {/* NEXT MATCH COUNTDOWN */}
      {nextMatch && (
        <CountdownTimer
          targetDate={nextMatch.start_time}
          teamA={nextMatch.team_a}
          teamB={nextMatch.team_b}
        />
      )}

      <section className="space-y-6">
        <div className="flex items-center gap-4 bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-white shadow-sm">
          <WorldCupMark size="md" className="drop-shadow-sm" />
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic">{t('upcomingMatches')}</h2>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{t('upcomingMatchesHint')}</p>
          </div>
        </div>
        {highlightedMatches.length > 0 ? (
          <div className="space-y-4">
            {highlightedMatches.map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                highlighted
                prediction={predictionsByMatch[m.id] ?? null}
                onPredictionSaved={handlePredictionSaved}
              />
            ))}
          </div>
        ) : (
          <div className="glass-card p-10 text-center border-dashed border-slate-200 bg-white/50">
            <p className="text-slate-400 font-medium italic">{t('noUpcomingMatches')}</p>
          </div>
        )}
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-1 border-l-4 border-wc-accent pl-4">
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic">{t('allMatches')}</h2>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{t('allMatchesHint')}</p>
        </div>
        <div className="space-y-4">
          {matches.map((m) => (
            <MatchCard
              key={m.id}
              match={m}
              prediction={predictionsByMatch[m.id] ?? null}
              onPredictionSaved={handlePredictionSaved}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
