
import React, { useEffect, useMemo, useState } from 'react'
import { DateTime } from 'luxon'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthProvider'
import * as api from '../lib/api'
import { getFlagUrl } from '../lib/flags'
import { calculateMatchPoints } from '../lib/scoring'
import WorldCupMark from './WorldCupMark'

interface ScoreStepperProps {
  value: number | ''
  onChange: (val: number | '') => void
  disabled?: boolean
  result: 'pending' | 'win' | 'loss' | 'draw'
}

function ScoreStepper({ value, onChange, disabled, result }: ScoreStepperProps) {
  const currentVal = value === '' ? 0 : value

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (disabled) return
    onChange(currentVal + 1)
  }

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (disabled || currentVal <= 0) return
    onChange(currentVal - 1)
  }

  const getContainerClass = () => {
    const base = "flex items-center gap-0.5 md:gap-1 p-0.5 rounded-lg border-2 transition-all duration-300"
    if (disabled) return `${base} bg-slate-50 border-slate-200 opacity-60`
    if (result === 'win') return `${base} bg-emerald-50 border-emerald-500 shadow-sm`
    if (result === 'loss') return `${base} bg-rose-50 border-rose-500 shadow-sm`
    if (result === 'draw') return `${base} bg-blue-50 border-blue-500 shadow-sm`
    return `${base} bg-white border-slate-200`
  }

  const getBtnClass = () => {
    const base = "w-5 h-5 md:w-8 md:h-8 flex items-center justify-center rounded font-bold transition-all active:scale-90 border border-transparent shrink-0"
    if (disabled) return `${base} text-slate-200 cursor-not-allowed`
    return `${base} bg-white text-slate-400 hover:text-[#0a2647]`
  }

  return (
    <div className={getContainerClass()}>
      <button onClick={handleDecrement} disabled={disabled || currentVal <= 0} className={getBtnClass()}>
        <span className="text-xs md:text-lg">−</span>
      </button>

      <input
        type="number"
        min={0}
        value={value}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        disabled={disabled}
        className={`w-6 md:w-10 text-center font-black text-sm md:text-2xl bg-transparent outline-none transition-colors shrink-0 ${disabled ? 'text-slate-300' : 'text-[#0a2647]'}`}
      />

      <button onClick={handleIncrement} disabled={disabled} className={getBtnClass()}>
        <span className="text-xs md:text-lg">+</span>
      </button>
    </div>
  )
}

function TeamName({ name, teamData, align = 'left' }: { name: string; teamData?: any; align?: 'left' | 'right' }) {
  const { t } = useTranslation()
  const flagUrl = teamData ? getFlagUrl(teamData.name) : getFlagUrl(name)
  const [error, setError] = useState(false)

  const getPlaceholder = (raw: string) => {
    if (!raw) return t('news_screen.upcoming')
    if (raw.startsWith('1')) return `${t('news_screen.advance')} ${raw.substring(1)}`
    if (raw.startsWith('2')) return `Runner-up ${raw.substring(1)}`
    if (raw.startsWith('3')) return `Best 3rd ${raw.split('/')[0].substring(1)}`
    if (raw.startsWith('W')) return `Winner #${raw.substring(1)}`
    if (raw.startsWith('L')) return `Loser #${raw.substring(1)}`
    return raw
  }

  const displayName = teamData
    ? t(`teams.${teamData.name}`, { defaultValue: teamData.name })
    : (getFlagUrl(name) && !name.includes('#') ? t(`teams.${name}`, { defaultValue: name }) : getPlaceholder(name))

  const containerClass = `flex items-center gap-1.5 md:gap-2 min-w-0 flex-1 h-full ${align === 'right' ? 'flex-row-reverse' : 'flex-row'}`

  return (
    <div className={containerClass}>
      {flagUrl && !error ? (
        <img
          src={flagUrl}
          alt=""
          className="h-3.5 w-5 md:h-5 md:w-7 shrink-0 rounded-sm object-cover ring-1 ring-slate-200 shadow-sm"
          loading="lazy"
          onError={() => setError(true)}
        />
      ) : (
        <div className="h-3.5 w-5 md:h-5 md:w-7 shrink-0 rounded-sm bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center text-[6px] font-bold text-slate-300">
          ?
        </div>
      )}
      <div className={`min-w-0 flex-1 overflow-hidden flex items-center ${align === 'right' ? 'justify-end text-right' : 'justify-start text-left'}`}>
        <span className={`font-black truncate text-[10px] md:text-base lg:text-lg leading-none ${teamData || (getFlagUrl(name) && !name.includes('#')) ? 'text-slate-900' : 'text-slate-300 italic font-bold'}`}>
          {displayName}
        </span>
      </div>
    </div>
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
  matchNumber,
  highlighted = false,
  prediction,
  onPredictionSaved
}: {
  match: any
  matchNumber?: number
  highlighted?: boolean
  prediction?: Prediction | null
  onPredictionSaved?: (prediction: Prediction) => void
}) {
  const { t, i18n } = useTranslation()
  const startLocal = useMemo(() => DateTime.fromISO(match.start_time).toLocal().setLocale(i18n.language), [match.start_time, i18n.language])
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

  const isDone = !!savedAt || (!!prediction && prediction.predicted_a !== undefined);

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

  const renderTopIndicator = () => {
    if (isDone) {
       return <div className="absolute top-0 left-0 w-full h-[4px] z-20 bg-gradient-to-r from-emerald-500 to-teal-500 shadow-[0_1px_8px_rgba(16,185,129,0.4)]"></div>
    }
    if (highlighted) {
      return <div className="absolute top-0 left-0 w-full h-[4px] z-20 bg-amber-500"></div>
    }
    return <div className="absolute top-0 left-0 w-full h-[4px] z-20 bg-[#0a2647] opacity-20"></div>
  }

  const renderFinalScore = () => {
    if (!hasFinalScore) return null
    return (
      <div className="mt-1 py-0.5 px-3 bg-emerald-50 rounded-full inline-block text-[8px] font-black text-emerald-700 uppercase tracking-widest border border-emerald-100">
        {t('finalScore')}: {match.score_a} - {match.score_b}
      </div>
    )
  }

  return (
    <div
      className={`bg-white rounded-2xl md:rounded-[2rem] border border-[#0a2647]/5 shadow-sm transition-all duration-300 hover:shadow-xl w-full p-3 md:p-6 pt-5 md:pt-8 relative overflow-hidden group cursor-pointer flex flex-col min-w-0`}
      onClick={toggleStats}
    >
      {renderTopIndicator()}

      {matchNumber && (
        <div className="absolute top-2 left-3 z-30">
          <span className="text-[10px] md:text-xs font-black text-[#0a2647]/20 uppercase tracking-tighter italic">
            #{String(matchNumber).padStart(2, '0')}
          </span>
        </div>
      )}

      <div className="w-full flex flex-col items-center text-center mb-3 md:mb-6 px-4">
        <span className="text-[8px] md:text-[10px] font-black text-[#0a2647] opacity-60 uppercase tracking-[0.2em] mb-0.5">
          {formattedStart}
        </span>
        <span className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[85%] block">
          {match.venue}
        </span>
        {renderFinalScore()}
      </div>

      <div className="w-full flex items-center gap-2 md:gap-4 min-w-0 px-1 mb-2">
        <TeamName name={match.team_a} teamData={match.team_a_data} align="right" />
        <div className="shrink-0 flex items-center h-full">
          <div className="bg-slate-50/50 p-1 md:p-3 rounded-lg md:rounded-xl border border-slate-100 shadow-inner">
             <div className="flex items-center justify-center gap-1 md:gap-2">
                <ScoreStepper value={predA} onChange={setPredA} disabled={locked} result={teamAResult} />
                <span className="font-black text-slate-300 text-[8px] md:text-xs tracking-tighter italic shrink-0 px-0.5">VS</span>
                <ScoreStepper value={predB} onChange={setPredB} disabled={locked} result={teamBResult} />
             </div>
          </div>
        </div>
        <TeamName name={match.team_b} teamData={match.team_b_data} align="left" />
      </div>

      {showStats && (
        <div className="mt-3 pt-3 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300 w-full overflow-hidden">
          <div className="flex justify-between items-center mb-2 px-1 text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <h4 className="truncate">{t('match_card.community_predictions')}</h4>
            <span className="whitespace-nowrap">{stats?.total || 0} {t('stats.participants')}</span>
          </div>

          {loadingStats ? (
            <div className="flex justify-center py-2"><div className="animate-pulse flex gap-1"><div className="w-1 h-1 bg-slate-200 rounded-full"></div><div className="w-1 h-1 bg-slate-200 rounded-full"></div><div className="w-1 h-1 bg-slate-200 rounded-full"></div></div></div>
          ) : stats && (
            <div className="space-y-2">
              <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                <div style={{ width: `${stats.winA}%` }} className="bg-emerald-500 h-full"></div>
                <div style={{ width: `${stats.draw}%` }} className="bg-slate-300 h-full border-x border-white/20"></div>
                <div style={{ width: `${stats.winB}%` }} className="bg-rose-500 h-full"></div>
              </div>
              <div className="grid grid-cols-3 text-[7px] md:text-[9px] font-black uppercase tracking-wider gap-1">
                <div className="text-emerald-600 flex flex-col items-start min-w-0">
                   <span className="truncate w-full">{match.team_a_data ? t(`teams.${match.team_a_data.name}`, { defaultValue: match.team_a_data.name }) : t(`teams.${match.team_a}`, { defaultValue: match.team_a })}</span>
                   <span>{stats.winA}%</span>
                </div>
                <div className="text-slate-400 flex flex-col items-center min-w-0"><span>{t('stats.draw_label')}</span><span>{stats.draw}%</span></div>
                <div className="text-rose-600 flex flex-col items-end min-w-0">
                   <span className="truncate w-full text-right">{match.team_b_data ? t(`teams.${match.team_b_data.name}`, { defaultValue: match.team_b_data.name }) : t(`teams.${match.team_b}`, { defaultValue: match.team_b })}</span>
                   <span>{stats.winB}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-3 flex justify-center w-full">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {canSave && (
            <button
              className="btn-primary min-w-[100px] md:min-w-[140px] py-3 uppercase tracking-widest text-[8px] md:text-xs shadow-xl"
              disabled={predA === '' || predB === ''}
              onClick={(e) => { e.stopPropagation(); handleSave(); }}
            >
              {saving ? t('saving') : t('save')}
            </button>
          )}
          {locked && <div className="rounded-full bg-slate-100 px-3 py-1 text-[8px] font-black text-slate-500 border border-slate-200 uppercase tracking-widest">{t('closed')}</div>}

          {hasSavedPrediction && !predictionChanged && earnedPoints === null && (
            <div className="rounded-full bg-transparent px-3 py-1 text-[8px] md:text-[9px] font-black text-emerald-600 border border-emerald-500 uppercase tracking-widest flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
              {t('saved')}
            </div>
          )}

          {earnedPoints !== null && <div className="rounded-full bg-amber-100 px-3 py-1 text-[8px] md:text-[9px] font-black text-amber-700 border border-amber-200 uppercase tracking-widest">+{earnedPoints} {t('pointsShort')}</div>}
        </div>
      </div>

      <div className="absolute bottom-0.5 right-3 opacity-20 group-hover:opacity-100 transition-opacity hidden sm:block">
        <span className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter italic text-center">
          {showStats ? t('match_card.click_to_hide') : t('match_card.click_to_see')}
        </span>
      </div>
    </div>
  )
}
