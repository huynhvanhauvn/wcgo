
import React, { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import * as api from '../lib/api'
import { calculateStandings, sortGroupStandings, TeamStanding } from '../lib/standings'
import { getFlagUrl } from '../lib/flags'
import { captureAndShare } from '../lib/shareUtils'
import LoadingScreen from '../components/LoadingScreen'

function StandingTable({ group, teams }: { group: string; teams: TeamStanding[] }) {
  const { t } = useTranslation()
  const sorted = useMemo(() => sortGroupStandings(teams), [teams])
  const tableId = `standing-table-${group}`

  return (
    <div id={tableId} className="glass-card overflow-hidden bg-white shadow-lg border-slate-100 relative group/table">
      <div className="bg-[#0a2647] p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-white font-black uppercase tracking-widest italic text-[13px]">Group {group}</h3>
          <button
            onClick={() => captureAndShare(tableId, `Group-${group}-Standings`)}
            className="p-2 bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl transition-all flex items-center gap-2 shadow-lg border border-emerald-400/20"
            title="Share Group Standings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">Share</span>
          </button>
        </div>
        <span className="text-[9px] text-white/50 font-bold uppercase tracking-[0.2em]">WC2026</span>
      </div>
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-[10px] md:text-xs text-left min-w-[420px]">
          <thead>
            <tr className="text-slate-400 font-black uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">
              <th className="px-4 py-3 text-[#0a2647]">{t('news_screen.team')}</th>
              <th className="px-1 py-3 text-center w-6" title="Played">P</th>
              <th className="px-1 py-3 text-center w-6 text-emerald-600" title="Won">W</th>
              <th className="px-1 py-3 text-center w-6 text-slate-400" title="Drawn">D</th>
              <th className="px-1 py-3 text-center w-6 text-rose-500" title="Lost">L</th>
              <th className="px-1 py-3 text-center w-10" title="Goals For">GF</th>
              <th className="px-1 py-3 text-center w-10" title="Goals Against">GA</th>
              <th className="px-1 py-3 text-center w-10" title="Goal Difference">GD</th>
              <th className="px-2 py-3 text-center w-10 font-black text-[#0a2647]" title="Points">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sorted.map((s, idx) => (
              <tr key={s.teamId} className={`hover:bg-slate-50/50 transition-colors ${idx < 2 ? 'bg-blue-50/20' : idx === 2 ? 'bg-amber-50/10' : ''}`}>
                <td className="px-4 py-3 flex items-center gap-2 relative min-w-0">
                  {idx < 2 && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>}
                  {idx === 2 && <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400"></div>}
                  <span className="text-[9px] text-slate-400 font-black w-3 shrink-0">{idx + 1}</span>
                  <img
                    src={getFlagUrl(s.name) || ''}
                    className="w-4 h-3 md:w-5 md:h-3.5 object-cover rounded-sm shadow-sm shrink-0"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.crossOrigin) {
                        target.removeAttribute('crossOrigin');
                        target.src = getFlagUrl(s.name) || '';
                      }
                    }}
                  />
                  <span className="font-bold text-slate-800 truncate">{t(`teams.${s.name}`, { defaultValue: s.name })}</span>
                </td>
                <td className="px-1 py-3 text-center text-slate-500">{s.played}</td>
                <td className="px-1 py-3 text-center text-emerald-600 font-bold">{s.won}</td>
                <td className="px-1 py-3 text-center text-slate-400">{s.drawn}</td>
                <td className="px-1 py-3 text-center text-rose-500">{s.lost}</td>
                <td className="px-1 py-3 text-center text-slate-600">{s.goalsFor}</td>
                <td className="px-1 py-3 text-center text-slate-600">{s.goalsAgainst}</td>
                <td className={`px-1 py-3 text-center font-bold ${s.goalDifference > 0 ? 'text-blue-600' : s.goalDifference < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                  {s.goalDifference > 0 ? `+${s.goalDifference}` : s.goalDifference}
                </td>
                <td className="px-2 py-3 text-center font-black text-[#0a2647] bg-slate-50/50">{s.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function StandingsPage() {
  const { t } = useTranslation()
  const [matches, setMatches] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.fetchMatches(), api.fetchTeams()])
      .then(([m, tRows]) => {
        setMatches(m || [])
        setTeams(tRows || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const standings = useMemo(() => calculateStandings(matches, teams), [matches, teams])
  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

  if (loading) return <LoadingScreen message="Updating Group Data..." />

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-7xl mx-auto px-4">
      <div className="flex flex-col gap-2 border-l-4 border-wc-accent pl-4">
        <h2 className="text-3xl font-black text-[#0a2647] uppercase tracking-tight italic leading-none">{t('groupStandings')}</h2>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Official World Cup 2026 Progression</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {groups.map(g => (
          <StandingTable key={g} group={g} teams={standings.filter(s => s.group === g)} />
        ))}
      </div>
    </div>
  )
}
