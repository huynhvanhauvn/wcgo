
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
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const finalScore = hasFinalScore && (
    <div className="mt-4 py-2 px-4 bg-emerald-50 rounded-full inline-block text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em] border border-emerald-100">
      {t('finalScore')}: {match.score_a} - {match.score_b}
    </div>
  )

  const cardStyle = highlighted
    ? "glass-card p-6 border-[#0a2647]/10 bg-white shadow-[0_15px_50px_rgba(10,38,71,0.06)]"
    : "glass-card p-6 bg-white shadow-sm"

  return (
    <div className={`${cardStyle} relative overflow-hidden transition-all duration-300 hover:shadow-md group`}>
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
          <input type="number" min={0} value={predA} onChange={(e) => setPredA(e.target.value === '' ? '' : Number(e.target.value))} disabled={locked} className={getScoreClass(teamAResult)} />
          <span className="font-black text-slate-300 text-xl tracking-tighter italic">VS</span>
          <input type="number" min={0} value={predB} onChange={(e) => setPredB(e.target.value === '' ? '' : Number(e.target.value))} disabled={locked} className={getScoreClass(teamBResult)} />
        </div>
        <div className="min-w-0">
          <TeamName name={match.team_b} />
        </div>
      </div>

      {/* Mobile Layout: Symmetric Top-Down with Vertical Scores */}
      <div className="flex flex-col md:hidden items-center gap-4">
        <TeamName name={match.team_a} stack />

        <div className="flex flex-col items-center gap-3 w-full py-6 bg-slate-50/80 rounded-2xl border border-slate-100 shadow-inner">
          <input
            type="number"
            min={0}
            value={predA}
            onChange={(e) => setPredA(e.target.value === '' ? '' : Number(e.target.value))}
            disabled={locked}
            className={getScoreClass(teamAResult)}
          />
          <div className="h-px w-8 bg-slate-200"></div>
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">VS</span>
          <div className="h-px w-8 bg-slate-200"></div>
          <input
            type="number"
            min={0}
            value={predB}
            onChange={(e) => setPredB(e.target.value === '' ? '' : Number(e.target.value))}
            disabled={locked}
            className={getScoreClass(teamBResult)}
          />
        </div>

        <TeamName name={match.team_b} stack />
      </div>

      <div className="mt-8 flex flex-col items-center gap-4">
        <div className="flex flex-wrap justify-center gap-2">
          {canSave && (
            <button
              className="btn-primary min-w-[140px] py-3.5 uppercase tracking-widest text-xs shadow-xl"
              disabled={predA === '' || predB === ''}
              onClick={handleSave}
            >
              {saving ? t('saving') : t('save')}
            </button>
          )}
          {locked && <div className="rounded-full bg-slate-100 px-4 py-1.5 text-[10px] font-black text-slate-500 border border-slate-200 uppercase tracking-widest">{t('closed')}</div>}
          {hasSavedPrediction && !predictionChanged && <div className="rounded-full bg-emerald-100 px-4 py-1.5 text-[10px] font-black text-emerald-700 border border-emerald-200 uppercase tracking-widest">{t('saved')}</div>}
          {earnedPoints !== null && <div className="rounded-full bg-amber-100 px-4 py-1.5 text-[10px] font-black text-amber-700 border border-amber-200 uppercase tracking-widest">+{earnedPoints} {t('pointsShort')}</div>}
        </div>
      </div>
    </div>
  )
}
