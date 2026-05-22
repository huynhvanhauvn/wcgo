
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

  return (
    <span className={`inline-flex min-w-0 items-center gap-2 ${align === 'right' ? 'flex-row-reverse text-right' : ''}`}>
      {flagUrl && (
        <img
          src={flagUrl}
          alt={`${name} flag`}
          className="h-5 w-7 shrink-0 rounded-sm object-cover ring-1 ring-black/10"
          loading="lazy"
        />
      )}
      <span className="truncate">{name}</span>
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
    const base = 'w-16 p-2 rounded border text-center font-semibold transition'
    const disabled = locked ? ' disabled:bg-gray-100 disabled:text-gray-500' : ''
    if (!hasSavedPrediction || predictionChanged || result === 'pending') return `${base}${disabled}`
    if (result === 'win') return `${base} border-emerald-400 bg-emerald-50 text-emerald-800${disabled}`
    if (result === 'loss') return `${base} border-rose-300 bg-rose-50 text-rose-800${disabled}`
    return `${base} border-sky-300 bg-sky-50 text-sky-800${disabled}`
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
      <span className="font-bold text-gray-400">-</span>
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
      {locked && <div className="rounded bg-gray-100 px-2 py-1 text-sm text-gray-600">{t('closed')}</div>}
      {!user && <div className="text-sm text-gray-500">{t('loginToSave')}</div>}
      {hasSavedPrediction && !predictionChanged && <div className="rounded bg-emerald-50 px-2 py-1 text-sm font-medium text-emerald-700">{t('saved')}</div>}
      {earnedPoints !== null && <div className="rounded bg-amber-50 px-2 py-1 text-sm font-semibold text-amber-800">+{earnedPoints} {t('pointsShort')}</div>}
    </div>
  )

  const finalScore = hasFinalScore && (
    <div className="mt-2 text-center text-sm font-semibold text-emerald-700">
      {t('finalScore')}: {match.score_a} - {match.score_b}
    </div>
  )

  if (highlighted) {
    return (
      <div className={`rounded-lg border p-5 shadow-sm ${locked ? 'border-gray-200 bg-gray-50/90 opacity-80' : 'border-amber-300 bg-white ring-2 ring-amber-100'}`}>
        <div className="flex justify-center">
          <WorldCupMark size="lg" className="mb-2" />
        </div>
        <div className="text-center text-sm text-gray-500">{formattedStart}</div>
        {finalScore}
        <div className="mt-3 grid items-center gap-3 md:grid-cols-[1fr_auto_1fr]">
          <div className="flex justify-center md:justify-end">
            <div className="max-w-full text-lg font-semibold">
              <TeamName name={match.team_a} align="right" />
            </div>
          </div>
          <div>{scoreControls}</div>
          <div className="flex justify-center md:justify-start">
            <div className="max-w-full text-lg font-semibold">
              <TeamName name={match.team_b} />
            </div>
          </div>
        </div>
        <div className="mt-2 text-center text-sm text-gray-500">{match.venue}</div>
        <div className="mt-4">{saveControls}</div>
      </div>
    )
  }

  return (
    <div className={`p-4 rounded-lg shadow-sm ${locked ? 'bg-gray-50/90 opacity-80' : 'bg-white/90'}`}>
      <div className="mb-3">
        <div className="text-sm text-gray-500">{formattedStart}</div>
        <div className="text-sm text-gray-500">{match.venue}</div>
        {hasFinalScore && (
          <div className="mt-1 text-sm font-semibold text-emerald-700">
            {t('finalScore')}: {match.score_a} - {match.score_b}
          </div>
        )}
      </div>
      <div className="grid items-center gap-3 md:grid-cols-[1fr_auto_1fr]">
        <div className="min-w-0 md:text-right">
          <div className="mt-1 text-lg font-semibold">
            <TeamName name={match.team_a} align="right" />
          </div>
        </div>
        <div className="flex justify-center">
          {scoreControls}
        </div>
        <div className="min-w-0">
          <div className="mt-1 text-lg font-semibold">
            <TeamName name={match.team_b} />
          </div>
        </div>
      </div>
      <div className="mt-3 flex justify-center">
        {saveControls}
      </div>
    </div>
  )
}
