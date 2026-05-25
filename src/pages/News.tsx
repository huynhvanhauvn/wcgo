
import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { DateTime } from 'luxon'
import * as api from '../lib/api'
import { getFlagUrl } from '../lib/flags'
import { calculateStandings, sortGroupStandings } from '../lib/standings'

/**
 * Enhanced News Interface
 */
interface Article {
  id: string
  title: string
  summary: string
  imageUrl: string
  publishedAt: string
  source: string
  url: string
}

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
    <div className="flex-shrink-0 w-44 md:w-52 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
      <div className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-3 flex justify-between">
        <span className={isFinished ? 'text-slate-500' : 'text-blue-500 font-black'}>
          {isFinished ? t('news_screen.final') : t('news_screen.upcoming')}
        </span>
        <span>{startTime}</span>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 overflow-hidden flex-1">
            <img src={flagA || ''} alt="" className="w-4 h-2.5 object-cover rounded-sm ring-1 ring-slate-100" />
            <span className="font-bold text-slate-800 truncate text-[10px]">{teamAName}</span>
          </div>
          {isFinished && <span className="font-black text-[#0a2647] ml-2 text-[10px]">{match.score_a}</span>}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 overflow-hidden flex-1">
            <img src={flagB || ''} alt="" className="w-4 h-2.5 object-cover rounded-sm ring-1 ring-slate-100" />
            <span className="font-bold text-slate-800 truncate text-[10px]">{teamBName}</span>
          </div>
          {isFinished && <span className="font-black text-[#0a2647] ml-2 text-[10px]">{match.score_b}</span>}
        </div>
      </div>
    </div>
  )
}

function GoogleStandingTable({ stats }: { stats: any[] }) {
  const { t } = useTranslation()
  const sorted = useMemo(() => sortGroupStandings(stats), [stats])

  return (
    <div className="w-full overflow-x-auto no-scrollbar bg-white">
      <table className="w-full text-[10px] text-left min-w-[360px]">
        <thead>
          <tr className="text-slate-400 font-black uppercase tracking-widest border-b border-slate-50 bg-slate-50/20">
            <th className="px-4 py-3 text-[#0a2647]">{t('news_screen.team')}</th>
            <th className="px-2 py-3 text-center w-8">{t('mp')}</th>
            <th className="px-2 py-3 text-center w-8">{t('gd')}</th>
            <th className="px-2 py-3 text-center w-8">{t('pts')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {sorted.map((s, idx) => (
            <tr key={s.teamId} className={`hover:bg-slate-50 transition-colors h-11 ${idx < 2 ? 'bg-blue-50/5' : ''}`}>
              <td className="px-4 relative">
                <div className="flex items-center gap-2.5">
                   {idx < 2 && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>}
                   <span className="text-[9px] text-slate-400 font-black w-2 shrink-0">{idx + 1}</span>
                   <img src={getFlagUrl(s.name) || ''} alt="" className="w-4 h-3 object-cover rounded-sm shadow-sm shrink-0" />
                   <span className="font-black text-slate-800 truncate text-[11px]">{t(`teams.${s.name}`, { defaultValue: s.name })}</span>
                </div>
              </td>
              <td className="px-2 text-center text-slate-600 font-bold align-middle">{s.played}</td>
              <td className="px-2 text-center text-slate-600 font-bold align-middle">{s.goalDifference > 0 ? `+${s.goalDifference}` : s.goalDifference}</td>
              <td className="px-2 text-center font-black text-[#0a2647] align-middle">{s.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function NewsPage() {
  const { t, i18n } = useTranslation()
  const [relevantMatches, setRecentMatches] = useState<any[]>([])
  const [activeGroup, setActiveGroup] = useState<string>('A')
  const [articles, setArticles] = useState<Article[]>([])
  const [loadingNews, setLoadingNews] = useState(true)
  const [standings, setStandings] = useState<any[]>([])

  const RSS_SOURCES = [
    { name: 'FIFA Official', url: 'https://www.fifa.com/en/news/rss' },
    { name: 'BBC Sport', url: 'https://push.api.bbci.co.uk/pips/ss/rss/sport/football' },
    { name: 'ESPN FC', url: 'https://www.espn.com/espn/rss/soccer/news' },
    { name: 'The Guardian', url: 'https://www.theguardian.com/football/world-cup-2026/rss' }
  ]

  const fallbackArticles: Article[] = [
    {
      id: 'f1',
      title: i18n.language === 'vi' ? 'Sẵn sàng cho World Cup 2026' : 'Ready for World Cup 2026',
      summary: i18n.language === 'vi' ? 'Với 48 đội bóng và 104 trận đấu, giải đấu hứa hẹn phá vỡ mọi kỷ lục...' : 'With 48 teams and 104 matches, the tournament promises to break all records...',
      imageUrl: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&q=80&w=800',
      publishedAt: new Date().toISOString(),
      source: 'FIFA.com',
      url: 'https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026'
    }
  ]

  // Fetch Matches and Standings
  useEffect(() => {
    Promise.all([api.fetchMatches(), api.fetchTeams()]).then(([matches, teamRows]) => {
      const all = (matches || [])
      const now = DateTime.now()
      const finished = all.filter(m => m.status === 'FINISHED').sort((a, b) => DateTime.fromISO(b.start_time).toMillis() - DateTime.fromISO(a.start_time).toMillis()).slice(0, 3)
      const upcoming = all.filter(m => m.status !== 'FINISHED' && DateTime.fromISO(m.start_time) > now).sort((a, b) => DateTime.fromISO(a.start_time).toMillis() - DateTime.fromISO(b.start_time).toMillis()).slice(0, 3)
      setRecentMatches([...finished.reverse(), ...upcoming])
      setStandings(calculateStandings(all, teamRows || []))
    })
  }, [])

  // Multi-source News Fetching with improved image extraction
  useEffect(() => {
    setLoadingNews(true)

    const fetchArticlesFromRSS = async () => {
      try {
        const fetchPromises = RSS_SOURCES.map(source =>
          fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(source.url)}`)
            .then(res => res.json())
            .then(data => {
              if (data.status === 'ok') {
                return data.items.map((item: any) => {
                  // Robust image extraction
                  let img = item.enclosure?.link || item.thumbnail || ''

                  // If no direct image, try to parse from description/content
                  if (!img && item.description) {
                    const match = item.description.match(/<img[^>]+src="([^">]+)"/)
                    if (match) img = match[1]
                  }

                  // Use source-specific fallbacks if still missing
                  if (!img) {
                    if (source.name === 'FIFA Official') img = 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&q=80&w=800'
                    else if (source.name === 'BBC Sport') img = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800'
                    else img = 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&q=80&w=800'
                  }

                  return {
                    id: item.guid || item.link,
                    title: item.title,
                    summary: item.description.replace(/<[^>]*>?/gm, '').substring(0, 160) + '...',
                    imageUrl: img,
                    publishedAt: item.pubDate,
                    source: source.name,
                    url: item.link
                  }
                })
              }
              return []
            })
            .catch(() => [])
        )

        const results = await Promise.all(fetchPromises)
        const combined = results.flat()
          .sort((a, b) => DateTime.fromISO(b.publishedAt).toMillis() - DateTime.fromISO(a.publishedAt).toMillis())
          .slice(0, 12)

        setArticles(combined.length > 0 ? combined : fallbackArticles)
      } catch (err) {
        console.error('RSS Fetch error:', err)
        setArticles(fallbackArticles)
      } finally {
        setLoadingNews(false)
      }
    }

    fetchArticlesFromRSS()
  }, [i18n.language])

  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500 pb-32">

      {/* 1. HERO SECTION: MATCH TRACKER */}
      <section className="bg-[#0a2647] rounded-[2rem] shadow-2xl overflow-hidden border border-white/5 relative mx-2">
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-6 relative z-10 gap-4">
            <div className="flex items-center gap-3 text-white">
               <span className="text-2xl">🏆</span>
               <h2 className="text-lg md:text-xl font-black uppercase tracking-tighter italic">{t('news_screen.hub_title')}</h2>
            </div>
            <Link to="/" className="shrink-0 text-[8px] font-black text-wc-gold uppercase tracking-[0.2em] bg-white/10 px-4 py-2 rounded-full border border-white/10">
              {t('viewAll')}
            </Link>
          </div>

          <div className="flex overflow-x-auto gap-4 no-scrollbar scroll-smooth relative z-10 pb-2">
            {relevantMatches.map(match => <MiniMatchCard key={match.id} match={match} />)}
            {relevantMatches.length === 0 && <p className="text-white/20 font-black uppercase italic text-[10px] tracking-widest py-4">Syncing tournament data...</p>}
          </div>
        </div>
      </section>

      {/* 2. STANDINGS SECTION */}
      <section className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden mx-2">
        <div className="bg-slate-50/50 px-2 flex border-b border-slate-100 overflow-x-auto no-scrollbar">
          {groups.map(group => (
            <button
              key={group}
              onClick={() => setActiveGroup(group)}
              className={`px-4 py-4 text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-2
                ${activeGroup === group ? 'text-blue-600 border-blue-600 bg-white' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
            >
              Grp {group}
            </button>
          ))}
        </div>
        <div className="animate-in fade-in duration-300 min-h-[220px]">
           <GoogleStandingTable stats={standings.filter(s => s.group === activeGroup)} />
        </div>
      </section>

      {/* 3. LATEST NEWS: GRID */}
      <div className="space-y-8 mx-2">
        <div className="flex items-center gap-4 px-2">
           <h2 className="text-xl md:text-2xl font-black text-[#0a2647] uppercase tracking-tight italic border-l-4 border-wc-accent pl-4 leading-none">
             {t('latestNews')}
           </h2>
           <div className="flex-1 h-[1px] bg-slate-100"></div>
        </div>

        {loadingNews ? (
          <div className="grid gap-6 sm:grid-cols-2">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-44 bg-slate-100 rounded-2xl animate-pulse"></div>)}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {articles.map((article) => (
              <div key={article.id} className="bg-white border border-slate-100 rounded-3xl overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300 group shadow-sm">
                <div className="w-full h-44 overflow-hidden shrink-0 relative bg-slate-100">
                  <img src={article.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[8px] font-black text-[#0a2647] uppercase tracking-widest border border-slate-100 shadow-sm">
                    {article.source}
                  </div>
                </div>
                <div className="p-5 flex flex-col gap-3 flex-1">
                  <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">{DateTime.fromISO(article.publishedAt).toRelative()}</span>
                  <div className="min-w-0">
                     <h3 className="text-sm font-black text-[#0a2647] leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">{article.title}</h3>
                     <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-2 mt-2">{article.summary}</p>
                  </div>
                  <a href={article.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[9px] font-black text-blue-600 uppercase tracking-widest mt-auto group/link hover:underline">
                    {t('readMore')} <span className="text-[10px] transform group-hover/link:translate-x-1 transition-transform">→</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
