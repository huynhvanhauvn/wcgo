
import React, { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import * as api from '../lib/api'
import { getFlagUrl } from '../lib/flags'
import LoadingScreen from '../components/LoadingScreen'
import { useAuth } from '../context/AuthProvider'

type StageType = 'R32' | 'R16' | 'QF' | 'SF' | 'FINAL'

/**
 * TeamSelectorModal: Allows admin to pick a team for a knockout slot
 */
function TeamSelectorModal({
  onClose,
  onSelect,
  teams,
  currentTeamId
}: {
  onClose: () => void,
  onSelect: (teamId: number | null, teamName: string) => void,
  teams: any[],
  currentTeamId?: number | null
}) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')

  const filtered = search.trim() === ''
    ? teams
    : teams.filter(t => t.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0a2647]/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
           <h3 className="font-black text-[#0a2647] uppercase tracking-widest text-sm">Select Team</h3>
           <button onClick={onClose} className="text-slate-300 hover:text-[#0a2647]">✕</button>
        </div>

        <div className="p-4 bg-slate-50 border-b border-slate-100">
          <input
            type="text"
            autoFocus
            placeholder="Search teams..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none font-bold text-sm"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2 no-scrollbar">
           <button
             onClick={() => onSelect(null, '')}
             className="w-full p-4 text-left hover:bg-slate-50 rounded-xl font-bold text-rose-50 text-xs uppercase tracking-widest border border-transparent border-dashed hover:border-rose-100 transition-all mb-2"
           >
             CLEAR SLOT
           </button>

           <div className="grid grid-cols-1 gap-1">
             {filtered.map(team => (
               <button
                 key={team.id}
                 onClick={() => onSelect(team.id, team.name)}
                 className={`w-full p-3 flex items-center gap-3 hover:bg-blue-50 rounded-xl transition-all group ${currentTeamId === team.id ? 'bg-blue-50 ring-1 ring-blue-200' : ''}`}
               >
                 <img src={getFlagUrl(team.name) || ''} className="h-4 w-6 rounded-sm object-cover shadow-sm" alt="" />
                 <span className="font-bold text-slate-700 text-sm group-hover:text-blue-600">{t(`teams.${team.name}`, { defaultValue: team.name })}</span>
                 {currentTeamId === team.id && <span className="ml-auto text-blue-500">✓</span>}
               </button>
             ))}
           </div>
        </div>
      </div>
    </div>
  )
}

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

function CompactMatchCard({
  match,
  isFinal = false,
  isAdmin = false,
  onEdit
}: {
  match: any;
  isFinal?: boolean;
  isAdmin?: boolean;
  onEdit?: (side: 'a' | 'b') => void
}) {
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
           <div className={`flex flex-col items-center gap-2 relative ${isAdmin ? 'cursor-pointer hover:opacity-80' : ''}`} onClick={() => isAdmin && onEdit?.('a')}>
              {isAdmin && <div className="absolute -top-2 -right-2 bg-emerald-500 text-white p-1 rounded-lg text-[8px] font-black z-10">EDIT</div>}
              {flagA && <img src={flagA} className="h-8 w-12 rounded-sm shadow-2xl mb-1 ring-1 ring-white/10" alt="" />}
              <span className={`text-xl font-black tracking-tight ${match.team_a_data ? 'text-white' : 'text-white/30 italic'}`}>{teamAName}</span>
              {isFinished && <span className="text-4xl font-black text-wc-gold">{match.score_a}</span>}
           </div>
           <div className="text-wc-gold font-black italic text-sm">VS</div>
           <div className={`flex flex-col items-center gap-2 relative ${isAdmin ? 'cursor-pointer hover:opacity-80' : ''}`} onClick={() => isAdmin && onEdit?.('b')}>
              {isAdmin && <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1 rounded-lg text-[8px] font-black z-10">EDIT</div>}
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
        <div className={`flex items-center justify-between gap-2 relative ${isAdmin ? 'cursor-pointer hover:bg-black/5 rounded px-1 -mx-1' : ''}`} onClick={() => isAdmin && onEdit?.('a')}>
          <div className="flex items-center gap-2 min-w-0 flex-1">
             {flagA ? <img src={flagA} className="h-3 w-4.5 object-cover rounded-[1px] shadow-sm" alt="" /> : <div className="h-3 w-4.5 bg-black/5 rounded-[1px]"></div>}
             <span className={`text-[10px] font-black truncate ${match.team_a_data ? 'text-slate-900' : style.placeholder + ' italic'}`}>{teamAName}</span>
          </div>
          {isFinished && <span className="text-[11px] font-black text-[#0a2647]">{match.score_a}</span>}
          {isAdmin && <div className="absolute -top-1 -left-1 w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>}
        </div>
        <div className={`flex items-center justify-between gap-2 relative ${isAdmin ? 'cursor-pointer hover:bg-black/5 rounded px-1 -mx-1' : ''}`} onClick={() => isAdmin && onEdit?.('b')}>
          <div className="flex items-center gap-2 min-w-0 flex-1">
             {flagB ? <img src={flagB} className="h-3 w-4.5 object-cover rounded-[1px] shadow-sm" alt="" /> : <div className="h-3 w-4.5 bg-black/5 rounded-[1px]"></div>}
             <span className={`text-[10px] font-black truncate ${match.team_b_data ? 'text-slate-900' : style.placeholder + ' italic'}`}>{teamBName}</span>
          </div>
          {isFinished && <span className="text-[11px] font-black text-[#0a2647]">{match.score_b}</span>}
          {isAdmin && <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>}
        </div>
      </div>
    </div>
  )
}

function BracketWing({
  matchesByRound,
  side,
  isAdmin = false,
  onEdit
}: {
  matchesByRound: any[][];
  side: 'left' | 'right';
  isAdmin?: boolean;
  onEdit?: (match: any, side: 'a' | 'b') => void
}) {
  return (
    <div className={`flex items-center gap-12 md:gap-20 ${side === 'right' ? 'flex-row-reverse' : 'flex-row'}`}>
      {matchesByRound.map((roundMatches, rIdx) => (
        <div key={rIdx} className="flex flex-col justify-around gap-12 h-full">
           {roundMatches.map(m => (
             <div key={m.id} className="py-4">
               <CompactMatchCard
                 match={m}
                 isAdmin={isAdmin}
                 onEdit={(s) => onEdit?.(m, s)}
               />
             </div>
           ))}
        </div>
      ))}
    </div>
  )
}

export default function BracketPage() {
  const { t } = useTranslation()
  const { isAdmin } = useAuth()
  const [matches, setMatches] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingMatch, setEditingMatch] = useState<{ match: any, side: 'a' | 'b' } | null>(null)

  const finalRef = React.useRef<HTMLDivElement>(null)

  const loadData = async () => {
    try {
      const [mRows, tRows] = await Promise.all([api.fetchMatches(), api.fetchTeams()])
      setMatches(mRows || [])
      setTeams(tRows || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const chan = api.subscribeMatches(() => {
      loadData()
    })

    setTimeout(() => {
      finalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
    }, 500)

    return () => { chan?.unsubscribe?.() }
  }, [])

  const handleUpdateTeam = async (teamId: number | null, teamName: string) => {
    if (!editingMatch) return
    try {
      await api.updateMatchTeam(editingMatch.match.id, editingMatch.side, teamId, teamName)
      setEditingMatch(null)
    } catch (e: any) {
      alert(e.message)
    }
  }

  const structure = useMemo(() => {
    if (matches.length === 0) return null
    const filterSide = (ids: number[]) => matches.filter(m => ids.includes(m.id)).sort((a, b) => a.id - b.id)
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

        {/* TEAM SELECTOR FOR ADMIN */}
        {editingMatch && (
          <TeamSelectorModal
            teams={teams}
            currentTeamId={editingMatch.side === 'a' ? editingMatch.match.team_a_id : editingMatch.match.team_b_id}
            onClose={() => setEditingMatch(null)}
            onSelect={handleUpdateTeam}
          />
        )}

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
          <BracketWing matchesByRound={structure.left} side="left" isAdmin={isAdmin} onEdit={(m, s) => setEditingMatch({ match: m, side: s })} />

          <div ref={finalRef} className="flex flex-col items-center justify-center gap-16">
            <CompactMatchCard match={structure.final} isFinal isAdmin={isAdmin} onEdit={(s) => setEditingMatch({ match: structure.final, side: s })} />

            <div className="mt-4 opacity-80 hover:opacity-100 transition-all transform hover:scale-105">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] text-center mb-4 italic">{t('bracket_screen.third_place')}</h4>
               <CompactMatchCard match={structure.third} isAdmin={isAdmin} onEdit={(s) => setEditingMatch({ match: structure.third, side: s })} />
            </div>
          </div>

          <BracketWing matchesByRound={structure.right} side="right" isAdmin={isAdmin} onEdit={(m, s) => setEditingMatch({ match: m, side: s })} />
        </div>
      </div>
    </div>
  )
}
