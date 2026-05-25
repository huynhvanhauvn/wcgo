
import React, { useEffect, useState, useRef, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { DateTime } from 'luxon'
import * as api from '../lib/api'
import { useAuth } from '../context/AuthProvider'
import { getFlagUrl } from '../lib/flags'
import UserAvatar from '../components/UserAvatar'
import LoadingScreen from '../components/LoadingScreen'

/**
 * Floating Emoji Effect Component
 */
function FloatingEmoji({ emoji, onComplete }: { emoji: string; onComplete: () => void }) {
  const left = useMemo(() => Math.random() * 80 + 10, []) // 10% to 90%

  useEffect(() => {
    const timer = setTimeout(onComplete, 3000)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div
      className="fixed bottom-24 pointer-events-none animate-float-up text-4xl z-[60]"
      style={{ left: `${left}%` }}
    >
      {emoji}
    </div>
  )
}

export default function MatchHubPage() {
  const { id } = useParams()
  const matchId = parseInt(id || '0')
  const { t, i18n } = useTranslation()
  const { user } = useAuth()

  const [match, setMatch] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [activeReacts, setActiveReacts] = useState<{ id: number; emoji: string }[]>([])

  const chatEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadData = async () => {
    try {
      const [mRows, cRows] = await Promise.all([
        api.fetchMatches(),
        api.fetchComments(matchId)
      ])
      const currentMatch = mRows.find((m: any) => m.id === matchId)
      setMatch(currentMatch)
      setComments(cRows || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()

    // Real-time Subscription
    const channel = api.subscribeToMatchHub(matchId, (payload: any) => {
      const { new: record } = payload
      if (record.type === 'REACT') {
        setActiveReacts(prev => [...prev, { id: Date.now(), emoji: record.emoji }])
      } else {
        // We need to fetch the profile data for the new comment
        // For simplicity in free tier, we'll just prepend a local placeholder or refetch
        // Here we'll do a quick loadData or just append if we can
        loadData()
      }
    })

    return () => {
      channel?.unsubscribe()
    }
  }, [matchId])

  useEffect(() => {
    scrollToBottom()
  }, [comments])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !user) return
    const content = newComment.trim()
    setNewComment('')
    try {
      await api.postComment(matchId, user.id, content, 'CHAT')
      // Local feedback handled by subscription
    } catch (e) {
      console.error(e)
    }
  }

  const handleSendReact = async (emoji: string) => {
    if (!user) return
    try {
      await api.postComment(matchId, user.id, `Reacted ${emoji}`, 'REACT', emoji)
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) return <LoadingScreen message="Connecting to Stadium..." />
  if (!match) return <div className="p-20 text-center font-black uppercase text-slate-400 tracking-widest">Match not found.</div>

  const isFinished = match.status === 'FINISHED'
  const startTime = DateTime.fromISO(match.start_time).toLocal().setLocale(i18n.language)

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-140px)] animate-in fade-in duration-500">

      {/* 1. TOP LIVE SCORE HEADER */}
      <section className="bg-[#0a2647] rounded-t-[2.5rem] p-6 md:p-10 shadow-2xl relative overflow-hidden shrink-0 border-b border-white/5">
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-wc-accent via-wc-gold to-wc-canada opacity-50"></div>

         <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full border border-white/5 backdrop-blur-md">
               <span className={`w-2 h-2 rounded-full ${isFinished ? 'bg-slate-400' : 'bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]'}`}></span>
               <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                 {isFinished ? t('news_screen.final') : t('news_screen.upcoming')}
               </span>
            </div>

            <div className="w-full flex items-center justify-between gap-4 md:gap-12 px-2 md:px-10">
               {/* Team A */}
               <div className="flex-1 flex flex-col items-center gap-4 text-center">
                  <div className="relative group">
                    <img src={getFlagUrl(match.team_a) || ''} className="h-12 w-18 md:h-16 md:w-24 object-cover rounded-md shadow-2xl ring-2 ring-white/10 group-hover:scale-110 transition-transform duration-500" alt="" />
                    <div className="absolute inset-0 bg-white/10 blur-xl opacity-0 group-hover:opacity-40 transition-opacity"></div>
                  </div>
                  <h3 className="text-sm md:text-xl font-black text-white uppercase tracking-tight">{t(`teams.${match.team_a}`, { defaultValue: match.team_a })}</h3>
               </div>

               {/* Score Display */}
               <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-3 md:gap-6">
                    <span className="text-4xl md:text-7xl font-black text-white tracking-tighter drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                      {match.score_a ?? 0}
                    </span>
                    <span className="text-xl md:text-3xl font-black text-white/20 italic tracking-tighter">VS</span>
                    <span className="text-4xl md:text-7xl font-black text-white tracking-tighter drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                      {match.score_b ?? 0}
                    </span>
                  </div>
               </div>

               {/* Team B */}
               <div className="flex-1 flex flex-col items-center gap-4 text-center">
                  <div className="relative group">
                    <img src={getFlagUrl(match.team_b) || ''} className="h-12 w-18 md:h-16 md:w-24 object-cover rounded-md shadow-2xl ring-2 ring-white/10 group-hover:scale-110 transition-transform duration-500" alt="" />
                    <div className="absolute inset-0 bg-white/10 blur-xl opacity-0 group-hover:opacity-40 transition-opacity"></div>
                  </div>
                  <h3 className="text-sm md:text-xl font-black text-white uppercase tracking-tight">{t(`teams.${match.team_b}`, { defaultValue: match.team_b })}</h3>
               </div>
            </div>

            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-black/20 px-6 py-2 rounded-xl">
               {match.venue} · {startTime.toLocaleString(DateTime.DATETIME_MED)}
            </p>
         </div>
      </section>

      {/* 2. LIVE CHAT SECTION */}
      <section className="flex-1 bg-white flex flex-col overflow-hidden shadow-2xl relative">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
           <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#0a2647] rounded-lg text-white text-xs">💬</div>
              <h4 className="text-[10px] font-black text-[#0a2647] uppercase tracking-[0.2em]">Match Live Discussion</h4>
           </div>
           <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{comments.length} Messages</span>
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
           {comments.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-center p-10 opacity-30 grayscale grayscale-50 scale-90">
                <span className="text-6xl mb-4">🏟️</span>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest italic">The stadium is quiet. Be the first to shout!</p>
             </div>
           ) : comments.map((c, idx) => {
             const isMe = c.user_id === user?.id
             const profile = c.profiles || {}
             if (c.type === 'REACT') return null // Reacts are floating

             return (
               <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-start gap-3 animate-in slide-in-from-bottom-1 duration-300`}>
                  {!isMe && <UserAvatar name={profile.display_name || profile.username} avatarUrl={profile.avatar_url} className="h-8 w-8 ring-2 ring-slate-100 shadow-sm" />}
                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[80%]`}>
                     <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">{profile.display_name || profile.username}</span>
                     <div className={`p-4 rounded-3xl text-sm font-bold shadow-sm ${isMe ? 'bg-[#0a2647] text-white rounded-tr-none' : 'bg-slate-100 text-slate-700 rounded-tl-none border border-slate-200'}`}>
                        {c.content}
                     </div>
                     <span className="text-[7px] text-slate-300 mt-1 uppercase font-bold">{DateTime.fromISO(c.created_at).toRelative()}</span>
                  </div>
               </div>
             )
           })}
           <div ref={chatEndRef} />
        </div>

        {/* 3. INPUT AREA */}
        <div className="p-4 md:p-6 bg-slate-50 border-t border-slate-100 shrink-0">
           {/* Quick Reacts */}
           <div className="flex justify-center gap-4 mb-4">
              {['🔥', '⚽', '😱', '🧤', '🤡', '👏', '💔'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleSendReact(emoji)}
                  className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-xl hover:scale-125 hover:border-wc-accent transition-all shadow-sm active:bg-slate-100"
                >
                  {emoji}
                </button>
              ))}
           </div>

           <form onSubmit={handleSendMessage} className="flex gap-3 relative">
             <input
              type="text"
              placeholder={user ? "Khịa một câu xem nào..." : "Đăng nhập để tham gia chat"}
              disabled={!user}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 bg-white border border-slate-200 px-6 py-4 rounded-full font-bold text-[#0a2647] shadow-inner focus:ring-2 focus:ring-[#0a2647]/10 outline-none pr-16"
             />
             <button
              type="submit"
              disabled={!newComment.trim() || !user}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-[#0a2647] text-white rounded-full flex items-center justify-center hover:bg-wc-accent transition-all shadow-lg active:scale-90 disabled:opacity-30 disabled:grayscale"
             >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
             </button>
           </form>
        </div>
      </section>

      {/* FOOTER NAVIGATION */}
      <div className="bg-slate-900 px-8 py-4 rounded-b-[2.5rem] flex items-center justify-between shadow-2xl">
         <Link to="/" className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">← Thoát khán đài</Link>
         <div className="text-white/20 font-black italic tracking-widest text-[9px] uppercase">WC2026 Arena Protocol</div>
      </div>

      {/* LIVE REACTIONS OVERLAY */}
      {activeReacts.map(r => (
        <FloatingEmoji
          key={r.id}
          emoji={r.emoji}
          onComplete={() => setActiveReacts(prev => prev.filter(x => x.id !== r.id))}
        />
      ))}
    </div>
  )
}
