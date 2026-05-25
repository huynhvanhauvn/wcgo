
import React, { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import * as api from '../lib/api'
import { getFlagUrl } from '../lib/flags'
import LoadingScreen from '../components/LoadingScreen'

type StageType = 'R32' | 'R16' | 'QF' | 'SF' | 'FINAL'

/**
 * High-visibility Stage Styling
 */
const STAGE_STYLES: Record<StageType, { card: string, accent: string, header: string, placeholder: string }> = {
  R32: {
    card: 'bg-white border-slate-200',
    accent: 'bg-slate-400',
    header: 'bg-slate-100 text-slate-600',
    placeholder: 'text-slate-400'
  },
  R16: {
    card: 'bg-blue-50 border-blue-200',
    accent: 'bg-blue-500',
    header: 'bg-blue-600 text-white',
    placeholder: 'text-blue-400'
  },
  QF: {
    card: 'bg-indigo-50 border-indigo-200',
    accent: 'bg-indigo-500',
    header: 'bg-indigo-600 text-white',
    placeholder: 'text-indigo-400'
  },
  SF: {
    card: 'bg-emerald-50 border-emerald-200',
    accent: 'bg-emerald-500',
    header: 'bg-emerald-600 text-white',
    placeholder: 'text-emerald-400'
  },
  FINAL: {
    card: 'bg-amber-50 border-wc-gold',
    accent: 'bg-wc-gold',
    header: 'bg-amber-500 text-white',
    placeholder: 'text-amber-600'
  }
}

function CompactMatchCard({ match, isFinal = false }: { match: any; isFinal?: boolean }) {
  const { t } = useTranslation()
  const flagA = match.team_a_data ? getFlagUrl(match.team_a_data.name) : null
  const flagB = match.team_b_data ? getFlagUrl(match.team_b_data.name) : null
  const isFinished = match.status === 'FINISHED'

  const stageCode = match.stage?.toUpperCase()
  const stage: StageType = stageCode === 'FINAL' ? 'FINAL' :
                         stageCode === 'SF' ? 'SF' :
                         stageCode === 'QF' ? 'QF' :
                         stageCode === 'R16' ? 'R16' : 'R32'

  const style = STAGE_STYLES[stage]

  const getPlaceholder = (raw: string) => {
    if (!raw) return 'TBD'
    if (raw.startsWith('1')) return `${t('news_screen.advance')} ${raw.substring(1)}`
    if (raw.startsWith('2')) return `Runner-up ${raw.substring(1)}`
    if (raw.startsWith('3')) return `Best 3rd ${raw.split('/')[0].substring(1)}`
    if (raw.startsWith('W')) return `Winner #${raw.substring(1)}`
    if (raw.startsWith('L')) return `Loser #${raw.substring(1)}`
    return raw
  }

  const teamAName = match.team_a_data ? t(`teams.${match.team_a_data.name}`, { defaultValue: match.team_a_data.name }) : getPlaceholder(match.team_a)
  const teamBName = match.team_b_data ? t(`teams.${match.team_b_data.name}`, { defaultValue: match.team_b_data.name }) : getPlaceholder(match.team_b)

  if (isFinal) {
    return (
      <div className="relative w-72 md:w-80 bg-[#0a2647] border-4 border-wc-gold rounded-[2.5rem] shadow-[0_0_60px_rgba(251,191,36,0.4)] p-8 flex flex-col items-center text-center group transition-all hover:scale-105 z-20">
        <div className="absolute -top-6 bg-wc-gold text-[#0a2647] px-8 py-2 rounded-full font-black text-[10px] uppercase tracking-[0.4em] shadow-xl border-2 border-white/20">The Grand Final</div>
        <div className="mb-6 animate-bounce-slow"><span className="text-6xl text-white">🏆</span></div>
        <div className="space-y-6 w-full relative">
           <div className="flex flex-col items-center gap-2">
              {flagA && <img src={flagA} className="h-8 w-12 rounded-sm shadow-2xl mb-1 ring-1 ring-white/10" alt="" />}
              <span className={`text-xl font-black tracking-tight ${match.team_a_data ? 'text-white' : 'text-white/30 italic'}`}>{teamAName}</span>
              {isFinished && <span className="text-4xl font-black text-wc-gold">{match.score_a}</span>}
           </div>
           <div className="text-wc-gold font-black italic text-sm">VS</div>
           <div className="flex flex-col items-center gap-2">
              {isFinished && <span className="text-4xl font-black text-wc-gold">{match.score_b}</span>}
              <span className={`text-xl font-black tracking-tight ${match.team_b_data ? 'text-white' : 'text-white/30 italic'}`}>{teamBName}</span>
              {flagB && <img src={flagB} className="h-8 w-12 rounded-sm shadow-2xl mt-1 ring-1 ring-white/10" alt="" />}
           </div>
        </div>
        <div className="mt-8 pt-6 border-t border-white/10 w-full text-slate-400 font-bold uppercase tracking-widest text-[9px]">
           MetLife Stadium · July 19, 2026
        </div>
      </div>
    )
  }

  return (
    <div className={`w-40 md:w-48 ${style.card} border-2 rounded-2xl shadow-md overflow-hidden flex flex-col transition-all relative`}>
      <div className={`${style.header} px-3 py-1.5 border-b border-black/5 flex justify-between items-center`}>
        <span className="text-[9px] font-black uppercase tracking-widest">#{match.id}</span>
        <span className="text-[9px] font-black uppercase">{isFinished ? 'FT' : stage}</span>
      </div>
      <div className="p-3 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
             {flagA ? <img src={flagA} className="h-3 w-4.5 object-cover rounded-[1px] shadow-sm" alt="" /> : <div className="h-3 w-4.5 bg-black/5 rounded-[1px]"></div>}
             <span className={`text-[10px] font-black truncate ${match.team_a_data ? 'text-slate-900' : style.placeholder + ' italic'}`}>{teamAName}</span>
          </div>
          {isFinished && <span className="text-[11px] font-black text-[#0a2647]">{match.score_a}</span>}
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
             {flagB ? <img src={flagB} className="h-3 w-4.5 object-cover rounded-[1px] shadow-sm" alt="" /> : <div className="h-3 w-4.5 bg-black/5 rounded-[1px]"></div>}
             <span className={`text-[10px] font-black truncate ${match.team_b_data ? 'text-slate-900' : style.placeholder + ' italic'}`}>{teamBName}</span>
          </div>
          {isFinished && <span className="text-[11px] font-black text-[#0a2647]">{match.score_b}</span>}
        </div>
      </div>
    </div>
  )
}

function BracketWing({ matchesByRound, side }: { matchesByRound: any[][]; side: 'left' | 'right' }) {
  return (
    <div className={`flex items-center gap-12 md:gap-20 ${side === 'right' ? 'flex-row-reverse' : 'flex-row'}`}>
      {matchesByRound.map((roundMatches, rIdx) => (
        <div key={rIdx} className="flex flex-col justify-around gap-12 h-full">
           {roundMatches.map(m => (
             <div key={m.id} className="py-4">
               <CompactMatchCard match={m} />
             </div>
           ))}
        </div>
      ))}
    </div>
  )
}

export default function BracketPage() {
  const { t } = useTranslation()
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const finalRef = React.useRef<HTMLDivElement>(null)

  useEffect(() => {
    api.fetchMatches().then(setMatches).finally(() => {
      setLoading(false)
      setTimeout(() => {
        finalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
      }, 300)
    })
  }, [])

  const structure = useMemo(() => {
    if (matches.length === 0) return null
    const filterSide = (ids: number[]) => matches.filter(m => ids.includes(m.id))
    return {
      left: [
        filterSide([73, 74, 75, 76, 77, 78, 79, 80]),
        filterSide([89, 90, 91, 92]),
        filterSide([97, 98]),
        filterSide([101])
      ],
      right: [
        filterSide([81, 82, 83, 84, 85, 86, 87, 88]),
        filterSide([93, 94, 95, 96]),
        filterSide([99, 100]),
        filterSide([102])
      ],
      final: matches.find(m => m.id === 104),
      third: matches.find(m => m.id === 103)
    }
  }, [matches])

  if (loading) return <LoadingScreen message="Building Tournament Roadmap..." />

  if (!structure) return null

  return (
    <div className="fixed inset-0 z-0 overflow-x-auto no-scrollbar pb-32 pt-28 md:pt-36 bg-[#f8fafc]">
      <div className="min-w-max flex flex-col items-center gap-16 px-[50vw]">

        {/* Localized Header Title */}
        <div className="text-center space-y-3 mb-4">
           <h1 className="text-3xl md:text-5xl font-black text-[#0a2647] uppercase tracking-tighter italic">
             {t('bracket_screen.title')}
           </h1>
           <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-[0.3em]">{t('bracket_screen.subtitle')}</p>
           <div className="h-1 w-24 bg-wc-accent mx-auto rounded-full mt-4"></div>
        </div>

        {/* Legend / Stage Indicator */}
        <div className="flex gap-6 md:gap-10 bg-white shadow-2xl px-12 py-6 rounded-[2.5rem] border border-slate-100 mb-8 sticky top-0 z-30">
           {(Object.keys(STAGE_STYLES) as StageType[]).map((s) => (
             <div key={s} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-lg ${STAGE_STYLES[s].accent} shadow-md`}></div>
                <span className="text-[11px] font-black text-[#0a2647] uppercase tracking-widest">{s === 'FINAL' ? 'Final' : s}</span>
             </div>
           ))}
        </div>

        {/* Symmetrical Bracket */}
        <div className="flex items-center justify-center gap-20 md:gap-32 relative">
          <BracketWing matchesByRound={structure.left} side="left" />

          <div ref={finalRef} className="flex flex-col items-center justify-center gap-16">
            <CompactMatchCard match={structure.final} isFinal />

            <div className="mt-4 opacity-80 hover:opacity-100 transition-all transform hover:scale-105">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] text-center mb-4 italic">{t('bracket_screen.third_place')}</h4>
               <CompactMatchCard match={structure.third} />
            </div>
          </div>

          <BracketWing matchesByRound={structure.right} side="right" />
        </div>
      </div>
    </div>
  )
}
