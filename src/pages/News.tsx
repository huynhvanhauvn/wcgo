
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { DateTime } from 'luxon'
import * as api from '../lib/api'
import { getFlagUrl } from '../lib/flags'

// --- OFFICIAL FIFA WORLD CUP 2026 GROUP DATA ---
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
    { team: 'Paraguay', mp: 0, gd: 0, pts: 0, find: [] },
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
  const { t, i18n } = useTranslation()
  const flagA = getFlagUrl(match.team_a)
  const flagB = getFlagUrl(match.team_b)
  const isFinished = match.status === 'FINISHED'

  const teamAName = t(`teams.${match.team_a}`, { defaultValue: match.team_a })
  const teamBName = t(`teams.${match.team_b}`, { defaultValue: match.team_b })

  const startTime = DateTime.fromISO(match.start_time).setLocale(i18n.language).toLocaleString({
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <div className="flex-shrink-0 w-60 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex justify-between">
        <span className={isFinished ? 'text-slate-500' : 'text-blue-500'}>
          {isFinished ? t('news_screen.final') : t('news_screen.upcoming')}
        </span>
        <span>{startTime}</span>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden flex-1">
            <img src={flagA || ''} alt="" className="w-5 h-3.5 object-cover rounded-sm ring-1 ring-slate-100" />
            <span className="font-bold text-slate-800 truncate text-xs">{teamAName}</span>
          </div>
          {isFinished && <span className="font-black text-[#0a2647] ml-2">{match.score_a}</span>}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden flex-1">
            <img src={flagB || ''} alt="" className="w-5 h-3.5 object-cover rounded-sm ring-1 ring-slate-100" />
            <span className="font-bold text-slate-800 truncate text-xs">{teamBName}</span>
          </div>
          {isFinished && <span className="font-black text-[#0a2647] ml-2">{match.score_b}</span>}
        </div>
      </div>
    </div>
  )
}

function GoogleStandingTable({ stats }: { stats: any[] }) {
  const { t } = useTranslation()
  return (
    <div className="w-full overflow-x-auto no-scrollbar">
      <table className="w-full text-xs text-left min-w-[400px]">
        <thead>
          <tr className="text-slate-400 font-black uppercase tracking-widest border-b border-slate-100 bg-slate-50/30">
            <th className="px-4 py-4 text-[#0a2647]">{t('news_screen.team')}</th>
            <th className="px-2 py-4 text-center w-12">{t('mp')}</th>
            <th className="px-2 py-4 text-center w-12">{t('gd')}</th>
            <th className="px-2 py-4 text-center w-12">{t('pts')}</th>
            <th className="px-4 py-4 text-center w-24 hidden sm:table-cell">Form</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {stats.map((s, idx) => (
            <tr key={s.team} className={`hover:bg-slate-50 transition-colors h-14 ${idx < 2 ? 'bg-blue-50/10' : ''}`}>
              <td className="px-4 relative">
                <div className="flex items-center gap-3">
                   {idx < 2 && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>}
                   <span className="text-[10px] text-slate-400 font-black w-3 shrink-0">{idx + 1}</span>
                   <img src={getFlagUrl(s.team) || ''} alt="" className="w-5 h-3.5 object-cover rounded-sm shadow-sm shrink-0" />
                   <span className="font-black text-slate-800 truncate">{t(`teams.${s.team}`, { defaultValue: s.team })}</span>
                </div>
              </td>
              <td className="px-2 text-center text-slate-600 font-bold align-middle">{s.mp}</td>
              <td className="px-2 text-center text-slate-600 font-bold align-middle">{s.gd > 0 ? `+${s.gd}` : s.gd}</td>
              <td className="px-2 text-center font-black text-[#0a2647] align-middle">{s.pts}</td>
              <td className="px-4 hidden sm:table-cell align-middle">
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
      <div className="p-4 bg-slate-50/50 text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] flex gap-4 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.4)]"></div> {t('news_screen.advance')}
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
    api.fetchMatches().then((rows) => {
      const all = (rows || [])
      const now = DateTime.now()
      const finished = all.filter(m => m.status === 'FINISHED').sort((a, b) => DateTime.fromISO(b.start_time).toMillis() - DateTime.fromISO(a.start_time).toMillis()).slice(0, 3)
      const upcoming = all.filter(m => m.status !== 'FINISHED' && DateTime.fromISO(m.start_time) > now).sort((a, b) => DateTime.fromISO(a.start_time).toMillis() - DateTime.fromISO(b.start_time).toMillis()).slice(0, 3)
      setRecentMatches([...finished.reverse(), ...upcoming])
    })
  }, [])

  const articles = [
    { id: '1', title: i18n.language === 'vi' ? 'FIFA công bố lịch thi đấu chi tiết cho World Cup 2026' : 'FIFA announces detailed match schedule for World Cup 2026', summary: 'Trận khai mạc sẽ diễn ra tại Sân vận động Azteca mang tính biểu tượng với sự tham gia của các đội bóng hàng đầu thế giới...', imageUrl: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&q=80&w=800', publishedAt: '2024-03-15T09:00:00Z', source: 'FIFA.com', url: '#' },
    { id: '2', title: i18n.language === 'vi' ? 'Diện mạo mới của các sân vận động tại Mỹ trước thềm World Cup' : 'New look for US stadiums ahead of World Cup', summary: 'Các thành phố chủ nhà trên khắp nước Mỹ đang đẩy nhanh tiến độ nâng cấp cơ sở hạ tầng để sẵn sàng cho ngày hội bóng đá lớn nhất hành tinh...', imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800', publishedAt: '2024-03-12T14:30:00Z', source: 'Sport News', url: '#' }
  ]

  return (
    <div className="max-w-full space-y-10 animate-in fade-in duration-500 overflow-hidden px-1">
      <section className="glass-card overflow-hidden bg-white shadow-xl border-none w-full">
        <div className="bg-[#0a2647] p-5 md:p-8 pb-20">
          <div className="flex items-center justify-between mb-8 px-1">
            <div className="flex items-center gap-3 text-white">
              <span className="text-2xl">⚽</span>
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter italic">{t('news_screen.hub_title')}</h2>
            </div>
            <Link to="/" className="text-[10px] font-black text-wc-accent uppercase tracking-[0.2em] bg-white/5 px-4 py-2 rounded-full hover:bg-white/10 transition-all">
              {t('viewAll')}
            </Link>
          </div>
          <div className="flex overflow-x-auto gap-4 no-scrollbar scroll-smooth px-1">
            {relevantMatches.map(match => <MiniMatchCard key={match.id} match={match} />)}
          </div>
        </div>

        <div className="-mt-12 mx-4 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden mb-8">
          <div className="flex border-b border-slate-100 overflow-x-auto no-scrollbar bg-slate-50/50">
            {Object.keys(OFFICIAL_GROUP_DATA).map(group => (
              <button
                key={group}
                onClick={() => setActiveGroup(group)}
                className={`px-6 py-5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-2
                  ${activeGroup === group ? 'text-blue-600 border-blue-600 bg-white' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
              >
                {group}
              </button>
            ))}
          </div>
          <div className="animate-in fade-in slide-in-from-top-1 duration-300">
            {OFFICIAL_GROUP_DATA[activeGroup] ? (
              <GoogleStandingTable stats={OFFICIAL_GROUP_DATA[activeGroup]} />
            ) : (
              <div className="p-16 text-center text-slate-300 text-[10px] font-black uppercase tracking-[0.3em] italic">{t('news_screen.select_group')}</div>
            )}
          </div>
        </div>
      </section>

      <div className="space-y-8 w-full">
        <h2 className="text-3xl font-black text-[#0a2647] uppercase tracking-tight italic border-l-4 border-[#0a2647] pl-4">
          {t('latestNews')}
        </h2>
        <div className="grid gap-8 w-full">
          {articles.map((article) => (
            <div key={article.id} className="glass-card overflow-hidden flex flex-col md:flex-row hover:shadow-2xl transition-all duration-300 group bg-white border-white w-full min-w-0">
              <div className="w-full md:w-[30%] lg:w-1/4 h-56 md:h-auto overflow-hidden shrink-0">
                <img src={article.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              </div>
              <div className="p-6 md:p-8 flex flex-col justify-center gap-4 min-w-0 flex-1">
                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
                  <span className="bg-slate-50 px-2 py-1 rounded-md">{article.source}</span>
                  <span>{DateTime.fromISO(article.publishedAt).toRelative()}</span>
                </div>
                <div className="min-w-0">
                   <h3 className="text-xl md:text-2xl font-black text-[#0a2647] leading-tight group-hover:text-wc-accent transition-colors line-clamp-2">{article.title}</h3>
                   <p className="mt-3 text-sm text-slate-500 font-medium leading-relaxed line-clamp-3">{article.summary}</p>
                </div>
                <a href={article.url} className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-2 hover:underline flex items-center gap-2 group/link w-fit">
                  {t('readMore')} <span className="text-xs group-hover/link:translate-x-1 transition-transform">→</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
