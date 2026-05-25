
import React, { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import * as api from '../lib/api'
import { getFlagUrl } from '../lib/flags'

/**
 * MiniBracketCard: A compact representation of a match for the bracket view.
 */
function MiniBracketCard({ match, isFinal = false }: { match: any; isFinal?: boolean }) {
  const { t } = useTranslation()
  const flagA = match.team_a_data ? getFlagUrl(match.team_a_data.name) : null
  const flagB = match.team_b_data ? getFlagUrl(match.team_b_data.name) : null
  const isFinished = match.status === 'FINISHED'

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

  return (
    <div className={`relative w-40 md:w-56 bg-white border border-slate-100 rounded-lg shadow-sm overflow-hidden flex flex-col z-10 hover:border-blue-200 transition-colors ${isFinal ? 'ring-2 ring-wc-gold/20 scale-110' : ''}`}>
      <div className="bg-slate-50/80 px-2 py-0.5 border-b border-slate-50 flex justify-between items-center">
        <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Match #{match.id}</span>
        {isFinished && <span className="text-[7px] font-black text-emerald-500 uppercase">FT</span>}
      </div>
      <div className="p-1.5 space-y-1">
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
             {flagA ? <img src={flagA} className="h-2.5 w-4 object-cover rounded-[1px] shadow-sm" alt="" /> : <div className="h-2.5 w-4 bg-slate-50 rounded-[1px] flex items-center justify-center text-[5px] text-slate-300 border border-slate-100">?</div>}
             <span className={`text-[9px] font-bold truncate ${match.team_a_data ? 'text-slate-800' : 'text-slate-300 italic'}`}>
                {teamAName}
             </span>
          </div>
          {isFinished && <span className="text-[9px] font-black text-[#0a2647]">{match.score_a}</span>}
        </div>
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
             {flagB ? <img src={flagB} className="h-2.5 w-4 object-cover rounded-[1px] shadow-sm" alt="" /> : <div className="h-2.5 w-4 bg-slate-50 rounded-[1px] flex items-center justify-center text-[5px] text-slate-300 border border-slate-100">?</div>}
             <span className={`text-[9px] font-bold truncate ${match.team_b_data ? 'text-slate-800' : 'text-slate-300 italic'}`}>
                {teamBName}
             </span>
          </div>
          {isFinished && <span className="text-[9px] font-black text-[#0a2647]">{match.score_b}</span>}
        </div>
      </div>
    </div>
  )
}

export default function BracketPage() {
  const { t } = useTranslation()
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.fetchMatches().then(setMatches).finally(() => setLoading(false))
  }, [])

  const r32 = useMemo(() => matches.filter(m => m.stage === 'R32'), [matches])
  const r16 = useMemo(() => matches.filter(m => m.stage === 'R16'), [matches])
  const qf = useMemo(() => matches.filter(m => m.stage === 'QF'), [matches])
  const sf = useMemo(() => matches.filter(m => m.stage === 'SF'), [matches])
  const finalMatch = useMemo(() => matches.find(m => m.stage === 'FINAL' && m.id === 104), [matches])
  const thirdMatch = useMemo(() => matches.find(m => m.stage === 'FINAL' && m.id === 103), [matches])

  if (loading) {
    return (
      <div className="p-20 flex flex-col items-center gap-4 bg-white/50 rounded-3xl">
        <div className="h-10 w-10 border-4 border-[#0a2647] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('loading')}</p>
      </div>
    )
  }

  // Fallback in case no matches found for some stages
  if (matches.length === 0) {
    return (
      <div className="p-20 text-center">
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No bracket data found. Please run the migration scripts.</p>
      </div>
    )
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-32">
       <div className="flex flex-col gap-2 border-l-4 border-wc-accent pl-4">
        <h2 className="text-3xl font-black text-[#0a2647] uppercase tracking-tight italic">Tournament Roadmap</h2>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Visual Progression to the 2026 World Cup Final</p>
      </div>

      <div className="overflow-x-auto no-scrollbar cursor-grab active:cursor-grabbing pb-10">
        <div className="inline-flex items-center gap-16 md:gap-24 p-8 min-w-max relative">

          {/* ROUND OF 32 */}
          <div className="flex flex-col gap-6">
            <h4 className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em] text-center mb-4 py-2 bg-slate-50 rounded-md">Round of 32</h4>
            <div className="grid grid-cols-2 gap-x-12 gap-y-6">
               {r32.map(m => (
                 <div key={m.id} className="relative">
                    <MiniBracketCard match={m} />
                    <div className="absolute top-1/2 -right-6 w-6 h-[1px] bg-slate-100 -z-10"></div>
                 </div>
               ))}
            </div>
          </div>

          {/* ROUND OF 16 */}
          <div className="flex flex-col h-full pt-10">
            <h4 className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em] text-center mb-8 py-2 bg-slate-50 rounded-md">Round of 16</h4>
            <div className="flex flex-col justify-between h-full gap-24">
              {r16.map(m => (
                <div key={m.id} className="relative">
                  <MiniBracketCard match={m} />
                  <div className="absolute top-1/2 -right-12 w-12 h-[2px] bg-slate-200/50 -z-10"></div>
                  <div className="absolute top-1/2 -left-12 w-12 h-[2px] bg-slate-200/50 -z-10"></div>
                </div>
              ))}
            </div>
          </div>

          {/* QUARTER FINALS */}
          <div className="flex flex-col h-full pt-20">
            <h4 className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em] text-center mb-8 py-2 bg-slate-50 rounded-md">Quarter-Finals</h4>
            <div className="flex flex-col justify-between h-full gap-48">
              {qf.map(m => (
                <div key={m.id} className="relative">
                  <MiniBracketCard match={m} />
                  <div className="absolute top-1/2 -right-12 w-12 h-[2px] bg-slate-200 -z-10"></div>
                  <div className="absolute top-1/2 -left-12 w-12 h-[2px] bg-slate-200 -z-10"></div>
                </div>
              ))}
            </div>
          </div>

          {/* SEMI FINALS */}
          <div className="flex flex-col h-full pt-32">
            <h4 className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em] text-center mb-8 py-2 bg-slate-50 rounded-md">Semi-Finals</h4>
            <div className="flex flex-col justify-around h-full gap-[32rem]">
              {sf.map(m => (
                <div key={m.id} className="relative">
                  <MiniBracketCard match={m} />
                  <div className="absolute top-1/2 -right-12 w-12 h-[2px] bg-blue-100 -z-10"></div>
                  <div className="absolute top-1/2 -left-12 w-12 h-[2px] bg-blue-100 -z-10"></div>
                </div>
              ))}
            </div>
          </div>

          {/* FINAL & 3RD PLACE */}
          <div className="flex flex-col gap-32 pt-48 items-center">
            <div className="flex flex-col items-center gap-10 relative">
              <h4 className="text-[8px] font-black text-wc-gold uppercase tracking-[0.5em] text-center py-2 px-8 bg-amber-50 rounded-full border border-amber-100 shadow-sm">The Final</h4>
              {finalMatch && (
                <div className="relative">
                  <MiniBracketCard match={finalMatch} isFinal />
                  <div className="absolute top-1/2 -left-12 w-12 h-[2px] bg-wc-gold/30 -z-10"></div>
                </div>
              )}
              {finalMatch?.status === 'FINISHED' && (
                <div className="absolute inset-0 bg-wc-gold/5 blur-3xl -z-20 animate-pulse"></div>
              )}
            </div>

            {thirdMatch && (
              <div className="flex flex-col items-center gap-4 mt-20 opacity-80">
                <h4 className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] text-center">3rd Place Play-off</h4>
                <MiniBracketCard match={thirdMatch} />
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center">
         <div className="bg-white/80 backdrop-blur-sm border border-slate-100 px-6 py-3 rounded-2xl shadow-sm flex gap-8">
            <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-slate-400">
               <div className="w-3 h-0.5 bg-slate-200"></div> Connection
            </div>
            <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-wc-gold">
               <div className="w-3 h-0.5 bg-wc-gold/30"></div> Final Path
            </div>
            <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-blue-400">
               <div className="w-3 h-0.5 bg-blue-100"></div> SF Path
            </div>
         </div>
      </div>
    </div>
  )
}
