import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { DateTime } from 'luxon'
import * as api from '../lib/api'
import { getFlagUrl } from '../lib/flags'

// --- OFFICIAL FIFA WORLD CUP 2026 GROUP DATA (As per final draw) ---
const OFFICIAL_GROUP_DATA: Record<string, any[]> = {
  'Group A': [
    { team: 'Mexico', mp: 0, gd: 0, pts: 0, form: [] },
    { team: 'South Korea', mp: 0, gd: 0, pts: 0, form: [] },
    { team: 'South Africa', mp: 0, gd: 0, pts: 0, form: [] },
    { team: 'Czech Rep.', mp: 0, gd: 0, pts: 0, form: [] },
  ],
  'Group B': [
    { team: 'Canada', mp: 0, gd: 0, pts: 0, form: [] },
    { team: 'Switzerland', mp: 0, gd: 0, pts: 0, form: [] },
    { team: 'Qatar', mp: 0, gd: 0, pts: 0, form: [] },
    { team: 'Bosnia/Herzeg.', mp: 0, gd: 0, pts: 0, form: [] },
  ],
  'Group C': [
    { team: 'Brazil', mp: 0, gd: 0, pts: 0, form: [] },
    { team: 'Morocco', mp: 0, gd: 0, pts: 0, form: [] },
    { team: 'Haiti', mp: 0, gd: 0, pts: 0, form: [] },
    { team: 'Scotland', mp: 0, gd: 0, pts: 0, form: [] },
  ],
  'Group D': [
    { team: 'USA', mp: 0, gd: 0, pts: 0, form: [] },
    { team: 'Paraguay', mp: 0, gd: 0, pts: 0, form: [] },
    { team: 'Australia', mp: 0, gd: 0, pts: 0, form: [] },
    { team: 'Turkey', mp: 0, gd: 0, pts: 0, form: [] },
  ],
  'Group E': [
    { team: 'Germany', mp: 0, gd: 0, pts: 0, form: [] },
    { team: 'Ecuador', mp: 0, gd: 0, pts: 0, form: [] },
    { team: 'Ivory Coast', mp: 0, gd: 0, pts: 0, form: [] },
    { team: 'Curacao', mp: 0, gd: 0, pts: 0, form: [] },
  ],
  'Group F': [
    { team: 'Netherlands', mp: 0, gd: 0, pts: 0, form: [] },
    { team: 'Japan', mp: 0, gd: 0, pts: 0, form: [] },
    { team: 'Tunisia', mp: 0, gd: 0, pts: 0, form: [] },
    { team: 'Sweden', mp: 0, gd: 0, pts: 0, form: [] },
  ],
  'Group G': [
    { team: 'Belgium', mp: 0, gd: 0, pts: 0, form: [] },
    { team: 'IR Iran', mp: 0, gd: 0, pts: 0, form: [] },
    { team: 'Egypt', mp: 0, gd: 0, pts: 0, form: [] },
    { team: 'New Zealand', mp: 0, gd: 0, pts: 0, form: [] },
  ],
  'Group H': [
    { team: 'Spain', mp: 0, gd: 0, pts: 0, form: [] },
    { team: 'Uruguay', mp: 0, gd: 0, pts: 0, form: [] },
    { team: 'Saudi Arabia', mp: 0, gd: 0, pts: 0, form: [] },
    { team: 'Cape Verde', mp: 0, gd: 0, pts: 0, form: [] },
  ],
  'Group I': [
    { team: 'France', mp: 0, gd: 0, pts: 0, form: [] },
    { team: 'Senegal', mp: 0, gd: 0, pts: 0, form: [] },
    { team: 'Iraq', mp: 0, gd: 0, pts: 0, form: [] },
    { team: 'Norway', mp: 0, gd: 0, pts: 0, form: [] },
  ],
  'Group J': [
    { team: 'Argentina', mp: 0, gd: 0, pts: 0, form: [] },
    { team: 'Algeria', mp: 0, gd: 0, pts: 0, form: [] },
    { team: 'Austria', mp: 0, gd: 0, pts: 0, form: [] },
    { team: 'Jordan', mp: 0, gd: 0, pts: 0, form: [] },
  ],
  'Group K': [
    { team: 'Portugal', mp: 0, gd: 0, pts: 0, form: [] },
    { team: 'Colombia', mp: 0, gd: 0, pts: 0, form: [] },
    { team: 'Uzbekistan', mp: 0, gd: 0, pts: 0, form: [] },
    { team: 'DR Congo', mp: 0, gd: 0, pts: 0, form: [] },
  ],
  'Group L': [
    { team: 'England', mp: 0, gd: 0, pts: 0, form: [] },
    { team: 'Croatia', mp: 0, gd: 0, pts: 0, form: [] },
    { team: 'Ghana', mp: 0, gd: 0, pts: 0, form: [] },
    { team: 'Panama', mp: 0, gd: 0, pts: 0, form: [] },
  ],
};

function MiniMatchCard({ match }: { match: any }) {
  const { i18n } = useTranslation()
  const flagA = getFlagUrl(match.team_a)
  const flagB = getFlagUrl(match.team_b)
  const isFinished = match.status === 'FINISHED'

  const startTime = DateTime.fromISO(match.start_time).setLocale(i18n.language).toLocaleString({
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <div className="flex-shrink-0 w-64 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex justify-between">
        <span className={isFinished ? 'text-slate-500' : 'text-blue-500'}>{isFinished ? 'Final' : 'Upcoming'}</span>
        <span>{startTime}</span>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <img src={flagA || ''} alt="" className="w-5 h-3.5 object-cover rounded-sm ring-1 ring-slate-100" />
            <span className="font-bold text-slate-800 truncate text-sm">{match.team_a}</span>
          </div>
          {isFinished && <span className="font-black text-[#0a2647]">{match.score_a}</span>}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <img src={flagB || ''} alt="" className="w-5 h-3.5 object-cover rounded-sm ring-1 ring-slate-100" />
            <span className="font-bold text-slate-800 truncate text-sm">{match.team_b}</span>
          </div>
          {isFinished && <span className="font-black text-[#0a2647]">{match.score_b}</span>}
        </div>
      </div>
    </div>
  )
}

function GoogleStandingTable({ stats }: { stats: any[] }) {
  return (
    <div className="overflow-hidden">
      <table className="w-full text-xs text-left">
        <thead>
          <tr className="text-slate-400 font-bold uppercase tracking-widest border-b border-slate-100">
            <th className="px-4 py-3 font-black text-[#0a2647]">Team</th>
            <th className="px-2 py-3 text-center w-10">MP</th>
            <th className="px-2 py-3 text-center w-10">GD</th>
            <th className="px-2 py-3 text-center w-10">Pts</th>
            <th className="px-4 py-3 text-center w-24 hidden sm:table-cell">Form</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {stats.map((s, idx) => (
            <tr key={s.team} className={`hover:bg-slate-50/50 transition-colors ${idx < 2 ? 'bg-blue-50/30' : ''}`}>
              <td className="px-4 py-3 flex items-center gap-3 relative">
                {idx < 2 && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>}
                <span className="text-[10px] text-slate-400 font-bold w-3">{idx + 1}</span>
                <img src={getFlagUrl(s.team) || ''} alt="" className="w-5 h-3.5 object-cover rounded-sm shadow-sm" />
                <span className="font-bold text-slate-800 truncate">{s.team}</span>
              </td>
              <td className="px-2 py-3 text-center text-slate-600 font-semibold">{s.mp}</td>
              <td className="px-2 py-3 text-center text-slate-600 font-semibold">{s.gd > 0 ? `+${s.gd}` : s.gd}</td>
              <td className="px-2 py-3 text-center font-black text-[#0a2647]">{s.pts}</td>
              <td className="px-4 py-3 hidden sm:table-cell">
                <div className="flex justify-center gap-1">
                  {s.form.length > 0 ? s.form.map((f: string, i: number) => (
                    <span key={i} className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white ${f === 'W' ? 'bg-emerald-500' : f === 'D' ? 'bg-slate-400' : 'bg-rose-500'}`}>
                      {f}
                    </span>
                  )) : [1,2,3].map(i => <div key={i} className="w-4 h-4 rounded-full bg-slate-100 border border-slate-200"></div>)}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="p-3 bg-slate-50 text-[10px] text-slate-400 font-bold uppercase tracking-widest flex gap-4 border-t border-slate-100">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div> Advance to Knockout
        </div>
      </div>
    </div>
  )
}

export default function NewsPage() {
  const { t, i18n } = useTranslation()
  const [relevantMatches, setRecentMatches] = useState<any[]>([])
  const [activeGroup, setActiveGroup] = useState<string>('Group A')

  useEffect(() => {
    // Fetch only matches for the Tracker
    api.fetchMatches().then((rows) => {
      const all = (rows || [])
      const now = DateTime.now()
      const finished = all.filter(m => m.status === 'FINISHED').sort((a, b) => DateTime.fromISO(b.start_time).toMillis() - DateTime.fromISO(a.start_time).toMillis()).slice(0, 3)
      const upcoming = all.filter(m => m.status !== 'FINISHED' && DateTime.fromISO(m.start_time) > now).sort((a, b) => DateTime.fromISO(a.start_time).toMillis() - DateTime.fromISO(b.start_time).toMillis()).slice(0, 3)
      setRecentMatches([...finished.reverse(), ...upcoming])
    })
  }, [])

  const articles = [
    { id: '1', title: i18n.language === 'vi' ? 'FIFA công bố lịch thi đấu chi tiết cho World Cup 2026' : 'FIFA announces detailed match schedule for World Cup 2026', summary: 'Trận khai mạc sẽ diễn ra tại Sân vận động Azteca mang tính biểu tượng...', imageUrl: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&q=80&w=800', publishedAt: '2024-03-15T09:00:00Z', source: 'FIFA.com', url: '#' },
    { id: '2', title: i18n.language === 'vi' ? 'Diện mạo mới của các sân vận động tại Mỹ trước thềm World Cup' : 'New look for US stadiums ahead of World Cup', summary: 'Các thành phố chủ nhà trên khắp nước Mỹ đang đẩy nhanh tiến độ nâng cấp...', imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800', publishedAt: '2024-03-12T14:30:00Z', source: 'Sport News', url: '#' }
  ]

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <section className="glass-card overflow-hidden bg-white shadow-xl border-none">
        <div className="bg-[#0a2647] p-6 pb-20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3 text-white">
              <span className="text-xl">⚽</span>
              <h2 className="text-xl font-black uppercase tracking-tighter italic">World Cup 2026 Hub</h2>
            </div>
            <Link to="/" className="text-[10px] font-black text-wc-accent uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors">
              {t('viewAll')}
            </Link>
          </div>
          <div className="flex overflow-x-auto gap-4 no-scrollbar -mx-2 px-2 scroll-smooth">
            {relevantMatches.map(match => <MiniMatchCard key={match.id} match={match} />)}
          </div>
        </div>

        <div className="-mt-12 mx-4 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden mb-6">
          <div className="flex border-b border-slate-100 overflow-x-auto no-scrollbar bg-slate-50/50">
            {Object.keys(OFFICIAL_GROUP_DATA).map(group => (
              <button
                key={group}
                onClick={() => setActiveGroup(group)}
                className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-2
                  ${activeGroup === group ? 'text-blue-600 border-blue-600 bg-white' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
              >
                {group}
              </button>
            ))}
          </div>
          <div className="animate-in fade-in slide-in-from-top-1 duration-300">
            <GoogleStandingTable stats={OFFICIAL_GROUP_DATA[activeGroup]} />
          </div>
        </div>
      </section>

      <div className="space-y-8">
        <h2 className="text-3xl font-black text-[#0a2647] uppercase tracking-tight italic border-l-4 border-[#0a2647] pl-4">
          {t('latestNews')}
        </h2>
        <div className="grid gap-6">
          {articles.map((article) => (
            <div key={article.id} className="glass-card overflow-hidden flex flex-col md:flex-row hover:shadow-xl transition-all duration-300 group bg-white border-white">
              <div className="md:w-1/4 h-40 md:h-auto overflow-hidden">
                <img src={article.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-6 md:w-3/4 flex flex-col justify-center gap-2">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                  <span>{article.source}</span>
                  <span>{DateTime.fromISO(article.publishedAt).toRelative()}</span>
                </div>
                <h3 className="text-lg font-black text-[#0a2647] leading-tight group-hover:text-wc-accent transition-colors">{article.title}</h3>
                <a href={article.url} className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-2 hover:underline flex items-center gap-1">
                  {t('readMore')} <span className="text-xs">→</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
