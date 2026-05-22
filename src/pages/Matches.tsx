import React, { useEffect, useState } from 'react'
import { DateTime } from 'luxon'
import { useTranslation } from 'react-i18next'
import MatchCard from '../components/MatchCard'
import WorldCupMark from '../components/WorldCupMark'
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
      <div className="rounded-lg bg-white/80 p-6 shadow-md">
        <div className="text-sm text-gray-500">{t('loadingMatches')}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg bg-white/80 p-6 shadow-md">
        <h2 className="text-lg font-semibold mb-2">{t('matchesLoadError')}</h2>
        <p className="text-sm text-red-700">{error}</p>
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="rounded-lg bg-white/80 p-6 shadow-md">
        <h2 className="text-lg font-semibold mb-2">{t('noMatches')}</h2>
        <p className="text-sm text-gray-600">{t('noMatchesHint')}</p>
      </div>
    )
  }

  const upcomingMatches = matches.filter((match) => {
    const startTime = DateTime.fromISO(match.start_time)
    return startTime >= DateTime.now() && match.status !== 'FINISHED'
  })
  const firstUpcomingTime = upcomingMatches[0] ? DateTime.fromISO(upcomingMatches[0].start_time) : null
  const highlightedMatches = firstUpcomingTime
    ? upcomingMatches.filter((match) => {
        const startTime = DateTime.fromISO(match.start_time)
        return startTime <= firstUpcomingTime.plus({ days: 2 })
      })
    : []

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <WorldCupMark size="md" />
          <div>
            <h2 className="text-xl font-semibold">{t('upcomingMatches')}</h2>
            <p className="text-sm text-gray-600">{t('upcomingMatchesHint')}</p>
          </div>
        </div>
        {highlightedMatches.length > 0 ? (
          <div className="space-y-3">
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
          <div className="rounded-lg bg-white/80 p-6 shadow-md">
            <p className="text-sm text-gray-600">{t('noUpcomingMatches')}</p>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-xl font-semibold">{t('allMatches')}</h2>
          <p className="text-sm text-gray-600">{t('allMatchesHint')}</p>
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
