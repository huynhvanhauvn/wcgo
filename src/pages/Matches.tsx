import React, { useEffect, useState, useMemo } from 'react'
import { DateTime } from 'luxon'
import { useTranslation } from 'react-i18next'
import MatchCard from '../components/MatchCard'
import WorldCupMark from '../components/WorldCupMark'
import CountdownTimer from '../components/CountdownTimer'
import { useAuth } from '../context/AuthProvider'
import * as api from '../lib/api'
import { calculateMatchPoints, getMultiplier } from '../lib/scoring'

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

type MatchTab = 'not_predicted' | 'predicted' | 'all' | 'pts_0' | 'pts_1' | 'pts_2' | 'pts_3'

export default function MatchesPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [matches, setMatches] = useState<Match[]>([])
  const [predictionsByMatch, setPredictionsByMatch] = useState<Record<number, Prediction>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [activeTab, setActiveTab] = useState<MatchTab>(() => {
    return (localStorage.getItem('matches_active_tab') as MatchTab) || 'not_predicted'
  })

  useEffect(() => {
    localStorage.setItem('matches_active_tab', activeTab)
  }, [activeTab])

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

  const upcomingMatchesList = useMemo(() => {
    return matches.filter((match) => {
      const startTime = DateTime.fromISO(match.start_time)
      return startTime >= DateTime.now() && match.status !== 'FINISHED'
    })
  }, [matches])

  const nextMatch = upcomingMatchesList[0] || null

  const highlightedMatches = useMemo(() => {
    if (upcomingMatchesList.length === 0) return []
    const firstUpcomingTime = DateTime.fromISO(upcomingMatchesList[0].start_time)
    return upcomingMatchesList.filter((match) => {
      const startTime = DateTime.fromISO(match.start_time)
      return startTime <= firstUpcomingTime.plus({ days: 2 })
    })
  }, [upcomingMatchesList])

  // Improved filter logic based on BASE points (before multiplier)
  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      const pred = predictionsByMatch[m.id]
      const isPredicted = !!pred

      if (activeTab === 'all') return true
      if (activeTab === 'predicted') return isPredicted
      if (activeTab === 'not_predicted') return !isPredicted

      if (activeTab.startsWith('pts_') && m.status === 'FINISHED' && isPredicted) {
        const targetBasePts = parseInt(activeTab.split('_')[1])
        const totalEarned = calculateMatchPoints(
          { id: '', user_id: user?.id || '', match_id: m.id, ...pred },
          m.score_a || 0,
          m.score_b || 0
        )
        const mult = getMultiplier(m.id)
        const baseEarned = totalEarned / mult
        return baseEarned === targetBasePts
      }
      return false
    })
  }, [matches, predictionsByMatch, activeTab, user])

  if (loading) {
    return (
      <div className="glass-card p-10 flex flex-col items-center gap-4 bg-white shadow-xl">
        <div className="animate-spin h-8 w-8 border-4 border-wc-accent border-t-transparent rounded-full"></div>
        <div className="text-sm font-bold text-wc-accent uppercase tracking-widest">{t('loadingMatches')}</div>
      </div>
    )
  }

  const TabButton = ({ id, label, count }: { id: MatchTab; label: string, count: number }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-5 py-4 text-[10px] font-black uppercase tracking-[0.15em] transition-all border-b-2 whitespace-nowrap flex items-center gap-2
        ${activeTab === id ? 'text-[#0a2647] border-[#0a2647] bg-white' : 'text-slate-400 border-transparent hover:text-slate-600 bg-slate-50/30'}`}
    >
      {label}
      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${activeTab === id ? 'bg-[#0a2647] text-white' : 'bg-slate-200 text-slate-500'}`}>
        {count}
      </span>
    </button>
  )

  const countByBasePoints = (target: number) => {
    return matches.filter(m => {
      const pred = predictionsByMatch[m.id]
      if (!pred || m.status !== 'FINISHED' || m.score_a === null || m.score_b === null) return false
      const total = calculateMatchPoints({ id: '', user_id: '', match_id: m.id, ...pred }, m.score_a, m.score_b)
      const mult = getMultiplier(m.id)
      return (total / mult) === target
    }).length
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* NEXT MATCH COUNTDOWN */}
      {nextMatch && (
        <CountdownTimer
          targetDate={nextMatch.start_time}
          teamA={nextMatch.team_a}
          teamB={nextMatch.team_b}
        />
      )}

      {highlightedMatches.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-4 bg-white/60 backdrop-blur-sm p-5 rounded-3xl border border-white shadow-sm">
            <WorldCupMark size="md" className="drop-shadow-sm" />
            <div>
              <h2 className="text-2xl font-black text-[#0a2647] uppercase tracking-tight italic">{t('upcomingMatches')}</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('upcomingMatchesHint')}</p>
            </div>
          </div>
          <div className="space-y-6">
            {highlightedMatches.map((m) => {
              // Find global index in full matches list
              const globalIndex = matches.findIndex(match => match.id === m.id) + 1;
              return (
                <MatchCard
                  key={m.id}
                  match={m}
                  matchNumber={globalIndex}
                  highlighted
                  prediction={predictionsByMatch[m.id] ?? null}
                  onPredictionSaved={handlePredictionSaved}
                />
              );
            })}
          </div>
        </section>
      )}

      <section className="space-y-0 pb-20">
        <div className="glass-card bg-white shadow-2xl overflow-hidden border-none">
          <div className="flex border-b border-slate-100 overflow-x-auto no-scrollbar bg-slate-50/50">
            <TabButton id="not_predicted" label={t('match_tabs.not_predicted')} count={matches.filter(m => !predictionsByMatch[m.id] && m.status !== 'FINISHED').length} />
            <TabButton id="predicted" label={t('match_tabs.predicted')} count={Object.keys(predictionsByMatch).length} />
            <TabButton id="all" label={t('match_tabs.all')} count={matches.length} />
            <TabButton id="pts_3" label={t('match_tabs.pts_3')} count={countByBasePoints(3)} />
            <TabButton id="pts_2" label={t('match_tabs.pts_2')} count={countByBasePoints(2)} />
            <TabButton id="pts_1" label={t('match_tabs.pts_1')} count={countByBasePoints(1)} />
            <TabButton id="pts_0" label={t('match_tabs.pts_0')} count={countByBasePoints(0)} />
          </div>

          <div className="p-4 md:p-8 bg-slate-100/40 space-y-6 animate-in fade-in duration-500 min-h-[400px]">
            <div className="flex flex-col gap-1 border-l-4 border-[#0a2647] pl-4 mb-8">
              <h2 className="text-2xl font-black text-[#0a2647] uppercase tracking-tight italic">
                {t(`match_tabs.${activeTab}`)}
              </h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                {filteredMatches.length} {t('match_tabs.matches_found')}
              </p>
            </div>

            {filteredMatches.length > 0 ? (
              <div className="grid gap-6">
                {filteredMatches.map((m) => {
                   const globalIndex = matches.findIndex(match => match.id === m.id) + 1;
                   return (
                    <MatchCard
                      key={m.id}
                      match={m}
                      matchNumber={globalIndex}
                      prediction={predictionsByMatch[m.id] ?? null}
                      onPredictionSaved={handlePredictionSaved}
                    />
                   );
                })}
              </div>
            ) : (
              <div className="py-24 text-center border-2 border-dashed border-slate-200 rounded-[2rem] bg-white/50">
                <span className="text-5xl block mb-6 grayscale opacity-20">⚽</span>
                <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">{t('match_tabs.no_matches_found')}</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
