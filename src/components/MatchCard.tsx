
import React, { useEffect, useMemo, useState } from 'react'
import { DateTime } from 'luxon'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthProvider'
import * as api from '../lib/api'
import { getFlagUrl } from '../lib/flags'
import { calculateMatchPoints } from '../lib/scoring'
import WorldCupMark from './WorldCupMark'

function TeamName({ name, align = 'left' }: { name: string; align?: 'left' | 'right' }) {
  const flagUrl = getFlagUrl(name)
  const [error, setError] = useState(false)

  return (
    <span className={`inline-flex min-w-0 items-center gap-2 ${align === 'right' ? 'flex-row-reverse text-right' : ''}`}>
      {flagUrl && !error ? (
        <img
          src={flagUrl}
          alt={`${name} flag`}
          className="h-5 w-7 shrink-0 rounded-sm object-cover ring-1 ring-slate-200 shadow-sm"
          loading="lazy"
          onError={() => setError(true)}
        />
      ) : (
        <div className="h-5 w-7 shrink-0 rounded-sm bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-400 ring-1 ring-slate-200">
          {name.substring(0, 2).toUpperCase()}
        </div>
      )}
      <span className="truncate text-slate-900 font-bold">{name}</span>
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
    const base = 'w-16 p-2 rounded-lg border text-center font-bold transition-all duration-200'
    const disabled = locked ? ' bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed' : ' bg-white border-slate-200 text-slate-900 focus:border-[#0a2647] focus:ring-1 focus:ring-[#0a2647] outline-none shadow-sm'

    if (result === 'pending' || !hasSavedPrediction || predictionChanged) return `${base}${disabled}`
    if (result === 'win') return `${base} border-emerald-200 bg-emerald-50 text-emerald-700${disabled}`
    if (result === 'loss') return `${base} border-rose-200 bg-rose-50 text-rose-700${disabled}`
    return `${base} border-sky-200 bg-sky-50 text-sky-700${disabled}`
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

  const scoreControls = (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <input type="number" min={0} value={predA} onChange={(e) => setPredA(e.target.value === '' ? '' : Number(e.target.value))} disabled={locked} className={getScoreClass(teamAResult)} />
      <span className="font-bold text-slate-300">vs</span>
      <input type="number" min={0} value={predB} onChange={(e) => setPredB(e.target.value === '' ? '' : Number(e.target.value))} disabled={locked} className={getScoreClass(teamBResult)} />
    </div>
  )

  const saveControls = (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {canSave && (
        <button
          className="btn-primary"
          disabled={predA === '' || predB === ''}
          onClick={handleSave}
        >
          {saving ? t('saving') : t('save')}
        </button>
      )}
      {locked && <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 border border-slate-200 uppercase tracking-wider">{t('closed')}</div>}
      {!user && <div className="text-sm text-slate-400 italic">{t('loginToSave')}</div>}
      {hasSavedPrediction && !predictionChanged && <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200 uppercase tracking-wider">{t('saved')}</div>}
      {earnedPoints !== null && <div className="rounded-full bg-wc-gold/10 px-3 py-1 text-xs font-bold text-wc-gold border border-wc-gold/20 uppercase tracking-wider">+{earnedPoints} {t('pointsShort')}</div>}
    </div>
  )

  const finalScore = hasFinalScore && (
    <div className="mt-3 text-center text-sm font-black text-emerald-600 uppercase tracking-widest">
      {t('finalScore')}: {match.score_a} - {match.score_b}
    </div>
  )

  const cardStyle = highlighted
    ? "glass-card p-6 border-[#0a2647]/10 bg-white shadow-[0_10px_40px_rgba(10,38,71,0.04)]"
    : "glass-card p-5 bg-white shadow-sm"

  return (
    <div className={`${cardStyle} relative overflow-hidden transition-all duration-300 hover:shadow-md group`}>
      {highlighted && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0a2647] via-wc-gold to-wc-canada"></div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 border-b border-slate-100 pb-4">
        <div className="flex flex-col items-center md:items-start gap-1">
          <div className="text-xs font-black text-[#0a2647] uppercase tracking-[0.2em]">{formattedStart}</div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{match.venue}</div>
        </div>
        {highlighted && <WorldCupMark size="sm" className="opacity-80 group-hover:scale-110 transition-transform duration-500" />}
        {finalScore}
      </div>

      <div className="grid items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
        <div className="min-w-0 md:text-right">
          <div className="mt-1 text-xl">
            <TeamName name={match.team_a} align="right" />
          </div>
        </div>
        <div className="flex justify-center bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
          {scoreControls}
        </div>
        <div className="min-w-0">
          <div className="mt-1 text-xl">
            <TeamName name={match.team_b} />
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        {saveControls}
      </div>
    </div>
  )
}
