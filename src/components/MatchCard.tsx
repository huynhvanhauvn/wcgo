
import React, { useEffect, useMemo, useState } from 'react'
import { DateTime } from 'luxon'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthProvider'
import * as api from '../lib/api'
import { getFlagUrl } from '../lib/flags'
import { calculateMatchPoints } from '../lib/scoring'
import WorldCupMark from './WorldCupMark'

function TeamName({ name, align = 'left', stack = false }: { name: string; align?: 'left' | 'right'; stack?: boolean }) {
  const flagUrl = getFlagUrl(name)
  const [error, setError] = useState(false)

  const containerClass = stack
    ? "flex flex-col items-center gap-2"
    : `inline-flex min-w-0 items-center gap-2 ${align === 'right' ? 'flex-row-reverse text-right' : ''}`

  return (
    <span className={containerClass}>
      {flagUrl && !error ? (
        <img
          src={flagUrl}
          alt={`${name} flag`}
          className={`${stack ? 'h-8 w-11' : 'h-5 w-7'} shrink-0 rounded-sm object-cover ring-1 ring-slate-200 shadow-sm transition-all`}
          loading="lazy"
          onError={() => setError(true)}
        />
      ) : (
        <div className={`${stack ? 'h-8 w-11' : 'h-5 w-7'} shrink-0 rounded-sm bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-400 ring-1 ring-slate-200`}>
          {name.substring(0, 2).toUpperCase()}
        </div>
      )}
      <span className={`truncate text-slate-900 font-bold ${stack ? 'text-base' : 'text-lg'}`}>{name}</span>
    </span>
  )
}

type Prediction = {
  match_id: number
  predicted_a: number
  predicted_b: number
  created_at?: string | null
}

export default function MatchCard({
  match,
  highlighted = false,
  prediction,
  onPredictionSaved
}: {
  match: any
  highlighted?: boolean
  prediction?: Prediction | null
  onPredictionSaved?: (prediction: Prediction) => void
}) {
  const { t, i18n } = useTranslation()
  const startLocal = useMemo(() => DateTime.fromISO(match.start_time).toLocal().setLocale(i18n.language), [match, i18n.language])
  const formattedStart = startLocal.toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY)
  const locked = match.status === 'FINISHED' || DateTime.now() > startLocal.minus({ minutes: 15 })

  const [predA, setPredA] = useState<number | ''>('')
  const [predB, setPredB] = useState<number | ''>('')
  const [savedPredA, setSavedPredA] = useState<number | ''>('')
  const [savedPredB, setSavedPredB] = useState<number | ''>('')
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)

  const [showStats, setShowStats] = useState(false)
  const [stats, setStats] = useState<{ winA: number; draw: number; winB: number; total: number } | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  const { user } = useAuth()

  const hasSavedPrediction = savedAt && savedPredA !== '' && savedPredB !== ''
  const predictionChanged = predA !== savedPredA || predB !== savedPredB
  const canSave = !locked && !!user && !saving && (!hasSavedPrediction || predictionChanged)

  const teamAResult = predA === '' || predB === '' ? 'pending' : predA > predB ? 'win' : predA < predB ? 'loss' : 'draw'
  const teamBResult = predA === '' || predB === '' ? 'pending' : predB > predA ? 'win' : predB < predA ? 'loss' : 'draw'

  const hasFinalScore = match.status === 'FINISHED' && match.score_a !== null && match.score_b !== null
  const earnedPoints = hasFinalScore && hasSavedPrediction
    ? calculateMatchPoints(
        { id: `${match.id}-${user?.id ?? 'user'}`, user_id: user?.id ?? '', match_id: match.id, predicted_a: savedPredA as number, predicted_b: savedPredB as number },
        match.score_a,
        match.score_b
      )
    : null

  useEffect(() => {
    if (!prediction) {
      setPredA('')
      setPredB('')
      setSavedPredA('')
      setSavedPredB('')
      setSavedAt(null)
      return
    }

    setPredA(prediction.predicted_a)
    setPredB(prediction.predicted_b)
    setSavedPredA(prediction.predicted_a)
    setSavedPredB(prediction.predicted_b)
    setSavedAt(prediction.created_at ?? new Date().toISOString())
  }, [prediction])

  const fetchStats = async () => {
    if (stats || loadingStats) return
    setLoadingStats(true)
    try {
      const allPreds = await api.fetchPredictionsByMatch(match.id)
      const total = allPreds.length
      if (total === 0) {
        setStats({ winA: 0, draw: 0, winB: 0, total: 0 })
        return
      }

      let winA = 0, draw = 0, winB = 0
      allPreds.forEach((p: any) => {
        if (p.predicted_a > p.predicted_b) winA++
        else if (p.predicted_a < p.predicted_b) winB++
        else draw++
      })

      setStats({
        winA: Math.round((winA / total) * 100),
        draw: Math.round((draw / total) * 100),
        winB: Math.round((winB / total) * 100),
        total
      })
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingStats(false)
    }
  }

  const toggleStats = () => {
    const nextShow = !showStats
    setShowStats(nextShow)
    if (nextShow) fetchStats()
  }

  const getScoreClass = (result: 'pending' | 'win' | 'loss' | 'draw') => {
    const base = 'w-16 md:w-20 p-3 rounded-xl border text-center font-black text-xl transition-all duration-300 shadow-sm'
    const disabled = locked ? ' bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed' : ' outline-none focus:ring-2 focus:ring-opacity-30'

    if (result === 'pending') return `${base} bg-white border-slate-200 text-slate-900 focus:border-[#0a2647] focus:ring-[#0a2647] ${disabled}`
    if (result === 'win') return `${base} border-emerald-500 bg-emerald-50 text-emerald-700 focus:border-emerald-600 focus:ring-emerald-500 ${disabled}`
    if (result === 'loss') return `${base} border-rose-500 bg-rose-50 text-rose-700 focus:border-rose-600 focus:ring-rose-500 ${disabled}`
    return `${base} border-blue-500 bg-blue-50 text-blue-700 focus:border-blue-600 focus:ring-blue-500 ${disabled}`
  }

  const handleSave = async () => {
    if (!canSave || predA === '' || predB === '') return
    setSaving(true)
    try {
      await api.savePrediction(user.id, match.id, predA, predB)
      const nextPrediction = {
        match_id: match.id,
        predicted_a: predA,
        predicted_b: predB,
        created_at: new Date().toISOString()
      }
      setSavedPredA(predA)
      setSavedPredB(predB)
      setSavedAt(nextPrediction.created_at)
      onPredictionSaved?.(nextPrediction)
      // Refresh stats if they are showing
      if (showStats) {
        setStats(null)
        fetchStats()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const scoreControls = (
    <div className="flex items-center justify-center gap-3">
      <input type="number" min={0} value={predA} onClick={(e) => e.stopPropagation()} onChange={(e) => setPredA(e.target.value === '' ? '' : Number(e.target.value))} disabled={locked} className={getScoreClass(teamAResult)} />
      <span className="font-black text-slate-300 text-xl tracking-tighter italic">VS</span>
      <input type="number" min={0} value={predB} onClick={(e) => e.stopPropagation()} onChange={(e) => setPredB(e.target.value === '' ? '' : Number(e.target.value))} disabled={locked} className={getScoreClass(teamBResult)} />
    </div>
  )

  const saveControls = (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {canSave && (
        <button
          className="btn-primary min-w-[140px] py-3.5 uppercase tracking-widest text-xs shadow-xl"
          disabled={predA === '' || predB === ''}
          onClick={(e) => { e.stopPropagation(); handleSave(); }}
        >
          {saving ? t('saving') : t('save')}
        </button>
      )}
      {locked && <div className="rounded-full bg-slate-100 px-4 py-1.5 text-[10px] font-black text-slate-500 border border-slate-200 uppercase tracking-widest">{t('closed')}</div>}
      {hasSavedPrediction && !predictionChanged && <div className="rounded-full bg-emerald-100 px-4 py-1.5 text-[10px] font-black text-emerald-700 border border-emerald-200 uppercase tracking-widest">{t('saved')}</div>}
      {earnedPoints !== null && <div className="rounded-full bg-amber-100 px-4 py-1.5 text-[10px] font-black text-amber-700 border border-amber-200 uppercase tracking-widest">+{earnedPoints} {t('pointsShort')}</div>}
    </div>
  )

  const finalScore = hasFinalScore && (
    <div className="mt-4 py-2 px-4 bg-emerald-50 rounded-full inline-block text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em] border border-emerald-100">
      {t('finalScore')}: {match.score_a} - {match.score_b}
    </div>
  )

  const cardStyle = highlighted
    ? "glass-card p-6 border-[#0a2647]/10 bg-white shadow-[0_15px_50px_rgba(10,38,71,0.06)]"
    : "glass-card p-6 bg-white shadow-sm"

  return (
    <div
      className={`${cardStyle} relative overflow-hidden transition-all duration-300 hover:shadow-md group cursor-pointer`}
      onClick={toggleStats}
    >
      {highlighted && (
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#0a2647] via-wc-gold to-wc-canada"></div>
      )}

      <div className="flex flex-col items-center mb-8 text-center">
        <div className="text-[10px] font-black text-[#0a2647] uppercase tracking-[0.3em] mb-1">{formattedStart}</div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{match.venue}</div>
        {finalScore}
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:grid items-center gap-8 grid-cols-[1fr_auto_1fr]">
        <div className="min-w-0 text-right">
          <TeamName name={match.team_a} align="right" />
        </div>
        <div className="flex justify-center items-center gap-4 bg-slate-50/50 p-6 rounded-3xl border border-slate-100 shadow-inner">
          {scoreControls}
        </div>
        <div className="min-w-0">
          <TeamName name={match.team_b} />
        </div>
      </div>

      {/* Mobile Layout: Symmetric Top-Down with Vertical Scores */}
      <div className="flex flex-col md:hidden items-center gap-4">
        <TeamName name={match.team_a} stack />

        <div className="flex flex-col items-center gap-3 w-full py-6 bg-slate-50/80 rounded-2xl border border-slate-100 shadow-inner">
          {scoreControls}
        </div>

        <TeamName name={match.team_b} stack />
      </div>

      {/* Statistics Section */}
      {showStats && (
        <div className="mt-8 pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex justify-between items-center mb-4 px-1">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Community Predictions</h4>
            <span className="text-[10px] font-bold text-slate-400">{stats?.total || 0} participants</span>
          </div>

          {loadingStats ? (
            <div className="flex justify-center py-4">
              <div className="animate-pulse flex gap-2">
                <div className="w-2 h-2 bg-slate-200 rounded-full"></div>
                <div className="w-2 h-2 bg-slate-200 rounded-full"></div>
                <div className="w-2 h-2 bg-slate-200 rounded-full"></div>
              </div>
            </div>
          ) : stats && (
            <div className="space-y-4">
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                <div style={{ width: `${stats.winA}%` }} className="bg-emerald-500 h-full transition-all duration-1000"></div>
                <div style={{ width: `${stats.draw}%` }} className="bg-slate-300 h-full transition-all duration-1000 border-x border-white/20"></div>
                <div style={{ width: `${stats.winB}%` }} className="bg-rose-500 h-full transition-all duration-1000"></div>
              </div>
              <div className="grid grid-cols-3 text-[10px] font-black uppercase tracking-wider">
                <div className="text-emerald-600 flex flex-col items-start">
                  <span>{match.team_a} Win</span>
                  <span className="text-lg">{stats.winA}%</span>
                </div>
                <div className="text-slate-400 flex flex-col items-center">
                  <span>Draw</span>
                  <span className="text-lg">{stats.draw}%</span>
                </div>
                <div className="text-rose-600 flex flex-col items-end">
                  <span>{match.team_b} Win</span>
                  <span className="text-lg">{stats.winB}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 flex justify-center">
        {saveControls}
      </div>

      <div className="absolute bottom-2 right-4 opacity-20 group-hover:opacity-100 transition-opacity">
        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
          {showStats ? 'Click to hide stats' : 'Click to see stats'}
        </span>
      </div>
    </div>
  )
}
