
import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { DateTime } from 'luxon'
import axios from 'axios'
import * as api from '../lib/api'
import { useAuth } from '../context/AuthProvider'
import { getFlagUrl } from '../lib/flags'
import UserAvatar from '../components/UserAvatar'
import LoadingScreen from '../components/LoadingScreen'

/**
 * Giphy API Configuration
 */
const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY || 'dc6zaTOxFJmzC'

const EMOJI_CATEGORIES = {
  banter: ['🤡', '🤮', '🤫', '💸', '👀', '🤐', '🥱', '🤷‍♂️', '🤣', '🥶', '🧐', '🤨', '💩', '🔥', '👺', '💀', '👻', '🖕', '👎', '🤞', '🤕', '🤒', '🤐', '🙄', '😤', '🤬'],
  reaction: ['🔥', '⚽', '😱', '🧤', '👏', '💔', '🏆', '🍺', '✅', '❌', '💯', '🙌', '⭐', '🧿', '🔊', '📣', '📢', '🥅', '🏃', '🦶', '⚡', '🌈', '🧨', '💣', '🪄', '🎩'],
  flags: [
    '🇻🇳', '🇦🇷', '🇧🇷', '🇫🇷', '🇵🇹', '🇩🇪', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '🇯🇵', '🇰🇷', '🇺🇸', '🇲🇽', '🇨🇦',
    '🇪🇸', '🇮🇹', '🇳🇱', '🇧🇪', '🇭🇷', '🇺🇾', '🇨🇴', '🇲🇦', '🇸🇳', '🇪🇬', '🇩🇿', '🇳🇬',
    '🇨🇭', '🇩🇰', '🇺🇦', '🇵🇱', '🇸🇦', '🇶🇦', '🇮🇶', '🇺🇿', '🇦🇪', '🇯🇴', '🇦🇺', '🇳🇿',
    '🇨🇱', '🇵🇾', '🇪🇨', '🇵🇪', '🇨🇷', '🇵🇦', '🇯🇲', '🇭🇹', '🇬🇭', '🇨🇲', '🇹🇳', '🇿🇦',
    '🇸🇪', '🇳🇴', '🇹🇷', '🇷🇴', '🇮🇪', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', '🏴󠁧󠁢󠁷󠁬ẽ󠁮󠁧󠁿', '🏴󠁧󠁢󠁷󠁬ês', '🇮🇸', '🇦🇹', '🇨🇿', '🇭🇺', '🇷🇸',
    '🇨🇮', '🇲🇱', '🇬🇳', '🇧 earth_africa:', '🇦🇴', '🇿🇲', '🇮🇷', '🇰🇵', '🇹🇭', '🇮🇩', '🇲🇾', '🇵🇭',
    '🇸🇬', '🇱🇦', '🇰🇭', '🇲🇲', '🇧🇳', '🇹🇱', '🇮🇳', '🇵🇰', '🇧🇩', '🇱🇰', '🇳🇵', '🇰🇿',
    '🇬🇪', '🇬🇷', '🇸🇮', '🇸🇰', '🇦🇱', '🇱🇺', '🇫🇮', '🇧🇴', '🇻🇪', '🇬🇺'
  ]
}

const SUGGESTED_TAGS = ['Soccer', 'Goal', 'Messi', 'Ronaldo', 'Funny', 'Cry', 'Siuuu', 'VAR', 'Celebrate', 'Angry', 'Referee']

const CHAT_HINTS = [
  "Định gáy gì mà căng thế?",
  "Gáy một câu xem ai trầm trồ?",
  "VAR đang check, gõ nhanh kẻo lỡ!",
  "Phun câu nào, chất câu nấy!",
  "Sút một phát vào khung chat đi...",
  "Messi hay Ronaldo đây?",
  "Khịa nhẹ một cái cho vui cửa nhà...",
  "Gõ gì đó thật 'gắt' vào nào!"
]

function FloatingEmoji({ emoji, onComplete }: { emoji: string; onComplete: () => void }) {
  const left = useMemo(() => Math.random() * 80 + 10, [])
  useEffect(() => {
    const timer = setTimeout(onComplete, 3000)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div className="fixed bottom-24 pointer-events-none animate-float-up text-4xl md:text-6xl z-[100] drop-shadow-2xl" style={{ left: `${left}%` }}>
      {emoji}
    </div>
  )
}

export default function MatchHubPage() {
  const { id } = useParams()
  const matchId = parseInt(id || '0')
  const { t, i18n } = useTranslation()
  const { user, isAdmin } = useAuth()

  const [match, setMatch] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [activeReacts, setActiveReacts] = useState<{ id: number; emoji: string }[]>([])

  const [showPicker, setShowPicker] = useState<'emoji' | 'giphy' | null>(null)
  const [giphySearch, setGiphySearch] = useState('')
  const [giphyResults, setGiphyResults] = useState<any[]>([])
  const [loadingGiphy, setLoadingGiphy] = useState(false)
  const [activeGiphyTab, setActiveGiphyTab] = useState<'gifs' | 'stickers'>('gifs')
  const [isInputCollapsed, setIsInputCollapsed] = useState(false)

  const randomHint = useMemo(() => CHAT_HINTS[Math.floor(Math.random() * CHAT_HINTS.length)], [])

  const chatEndRef = useRef<HTMLDivElement>(null)
  const searchTimeoutRef = useRef<any>(null)

  const loadData = useCallback(async () => {
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
  }, [matchId])

  const fetchGiphy = useCallback(async (query: string = '', type: 'gifs' | 'stickers' = 'gifs') => {
    setLoadingGiphy(true)
    try {
      const isSearch = query.trim().length > 0
      const searchTerm = isSearch ? query : 'soccer banter'
      const endpoint = `https://api.giphy.com/v1/${type}/search`
      const params: any = { api_key: GIPHY_API_KEY, q: searchTerm, limit: 21, rating: 'g', lang: 'en' }
      const res = await axios.get(endpoint, { params })
      setGiphyResults(res.data.data || [])
    } catch (e) {
      console.error(e)
      setGiphyResults([])
    } finally {
      setLoadingGiphy(false)
    }
  }, [])

  useEffect(() => {
    loadData()
    const channel = api.subscribeToMatchHub(matchId, (payload: any) => {
      if (payload.eventType === 'INSERT') {
        const record = payload.new
        if (record.type === 'REACT') {
          setActiveReacts(prev => [...prev, { id: Date.now(), emoji: record.emoji }])
        } else {
          loadData()
        }
      } else if (payload.eventType === 'DELETE') {
        loadData()
      }
    })
    return () => { channel?.unsubscribe() }
  }, [matchId, loadData])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  useEffect(() => {
    if (showPicker === 'giphy') {
      fetchGiphy(giphySearch, activeGiphyTab)
    }
  }, [showPicker, activeGiphyTab, fetchGiphy, giphySearch])

  const handleGiphySearchChange = (val: string) => {
    setGiphySearch(val)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => fetchGiphy(val, activeGiphyTab), 500)
  }

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!newComment.trim() || !user) return
    const content = newComment.trim()
    setNewComment('')
    setShowPicker(null)
    try {
      await api.postComment(matchId, user.id, content, 'CHAT')
    } catch (e) { console.error(e) }
  }

  const handleSendMedia = async (url: string) => {
    if (!user) return
    setShowPicker(null)
    try {
      await api.postComment(matchId, user.id, url, 'CHAT')
    } catch (e) { console.error(e) }
  }

  const handleSendReact = async (emoji: string) => {
    if (!user) return
    try {
      await api.postComment(matchId, user.id, `Reacted ${emoji}`, 'REACT', emoji)
    } catch (e) { console.error(e) }
  }

  const handleDeleteMessage = async (commentId: string) => {
    if (!window.confirm("Xoá tin nhắn này?")) return
    try {
      await api.deleteComment(commentId)
    } catch (e: any) {
      alert("Lỗi xoá: " + e.message)
    }
  }

  if (loading) return <LoadingScreen message="Connecting to Stadium..." />
  if (!match) return <div className="p-20 text-center font-black uppercase text-slate-400">Match not found.</div>

  const isFinished = match.status === 'FINISHED'
  const isStarted = DateTime.now() > DateTime.fromISO(match.start_time)
  const isLive = isStarted && !isFinished

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100dvh-100px)] md:h-[calc(100vh-120px)] animate-in fade-in duration-500 overflow-hidden relative md:rounded-2xl my-0 md:my-4 border-x border-slate-100 shadow-2xl bg-white">

      {/* 1. COMPACT SCORE HEADER */}
      <header className="bg-[#0a2647] p-3 md:p-6 shadow-xl relative overflow-hidden shrink-0 z-50">
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-wc-accent via-wc-gold to-wc-canada opacity-50"></div>
         <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-0.5 bg-white/10 rounded-full border border-white/5">
               <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]' : 'bg-slate-400'}`}></span>
               <span className="text-[8px] md:text-[9px] font-black text-white uppercase tracking-widest">{isFinished ? 'Kết thúc' : 'Live'}</span>
            </div>
            <div className="w-full flex items-center justify-between px-2 md:px-6">
               <div className="flex-1 flex flex-col items-center gap-1 text-center min-w-0">
                  <img src={getFlagUrl(match.team_a) || ''} className="h-8 w-12 md:h-12 md:w-18 object-cover rounded shadow-lg border border-white/10" alt="" />
                  <h3 className="text-[9px] md:text-[11px] font-black text-white uppercase truncate w-full">{t(`teams.${match.team_a}`, { defaultValue: match.team_a })}</h3>
               </div>
               <div className="flex items-center gap-2 md:gap-8 px-2">
                  <span className="text-3xl md:text-6xl font-black text-white tracking-tighter drop-shadow-lg">{match.score_a ?? 0}</span>
                  <span className="text-sm md:text-xl font-black text-white/20 italic">VS</span>
                  <span className="text-3xl md:text-6xl font-black text-white tracking-tighter drop-shadow-lg">{match.score_b ?? 0}</span>
               </div>
               <div className="flex-1 flex flex-col items-center gap-1 text-center min-w-0">
                  <img src={getFlagUrl(match.team_b) || ''} className="h-8 w-12 md:h-12 md:w-18 object-cover rounded shadow-lg border border-white/10" alt="" />
                  <h3 className="text-[9px] md:text-[11px] font-black text-white uppercase truncate w-full">{t(`teams.${match.team_b}`, { defaultValue: match.team_b })}</h3>
               </div>
            </div>
         </div>
      </header>

      {/* 2. CHAT FEED & PICKER AREA */}
      <main className="flex-1 flex flex-col overflow-hidden relative bg-slate-50/30">
        <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-4 md:space-y-6 no-scrollbar scrolling-touch">
           {comments.map((c, idx) => {
             const isMe = c.user_id === user?.id
             const profile = c.profiles || {}
             if (c.type === 'REACT') return null
             const isMedia = c.content.startsWith('http') && (c.content.includes('giphy.com') || c.content.includes('.gif') || c.content.includes('giphy-preview'))

             return (
               <div key={c.id || idx} className={`flex ${isMe ? 'flex-row-reverse' : 'flex-row'} items-start gap-2 animate-in slide-in-from-bottom-1 duration-300 group`}>
                  <div className="relative shrink-0 group/avatar z-10">
                    <UserAvatar name={profile.display_name} avatarUrl={profile.avatar_url} className="h-7 w-7 md:h-8 md:w-8 shrink-0 ring-2 ring-slate-100 transition-transform hover:scale-110 active:scale-95 cursor-pointer" />
                    <div className={`absolute top-1/2 -translate-y-1/2 ${isMe ? 'right-full mr-2' : 'left-full ml-2'} px-3 py-1 bg-slate-900/95 backdrop-blur-md text-white text-[10px] font-black rounded-full opacity-0 group-hover/avatar:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none shadow-xl border border-wc-gold/30 flex items-center gap-2`}>
                       <div className={`w-1.5 h-1.5 rounded-full ${isMe ? 'bg-wc-accent' : 'bg-emerald-400'}`}></div>
                       {profile.display_name || profile.username}
                    </div>
                  </div>
                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-[75%] relative`}>
                     <div className={`break-words whitespace-pre-wrap ${isMedia ? '' : isMe ? 'bg-[#0a2647] text-white rounded-2xl rounded-tr-none p-3 md:p-4 shadow-sm' : 'bg-white text-slate-700 rounded-2xl rounded-tl-none border border-slate-100 p-3 md:p-4 shadow-sm'}`}>
                        {isMedia ? (
                          <img src={c.content} className="max-w-full md:max-w-[280px] h-auto rounded-xl shadow-lg border-2 border-white" alt="gif" loading="lazy" />
                        ) : (
                          <p className="text-xs md:text-sm font-bold leading-relaxed">{c.content}</p>
                        )}
                     </div>
                     <div className="flex items-center gap-1.5 mt-1 px-1 min-h-[12px]">
                        <span className="text-[7px] font-bold text-slate-300 uppercase tracking-tighter">{DateTime.fromISO(c.created_at).toRelative()}</span>
                        {isAdmin && (
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteMessage(c.id); }} className="opacity-0 group-hover:opacity-100 text-[7px] text-rose-500 font-black uppercase hover:text-rose-700 transition-all bg-rose-50 rounded px-1.5 py-0.5 ml-1 shadow-sm">Xoá</button>
                        )}
                     </div>
                  </div>
               </div>
             )
           })}
           <div ref={chatEndRef} />
        </div>

        {showPicker && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-xl z-[60] flex flex-col animate-in slide-in-from-bottom-full duration-300 shadow-2xl">
            <div className="flex p-2 bg-slate-50/80 border-b border-slate-100 items-center justify-between shrink-0">
               <div className="flex gap-1 flex-1 px-2">
                 <button onClick={() => setShowPicker('emoji')} className={`px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${showPicker === 'emoji' ? 'bg-[#0a2647] text-white shadow-md' : 'text-slate-400 hover:bg-white'}`}>Emojis</button>
                 <button onClick={() => { setShowPicker('giphy'); fetchGiphy(giphySearch, activeGiphyTab); }} className={`px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${showPicker === 'giphy' ? 'bg-[#0a2647] text-white shadow-md' : 'text-slate-400 hover:bg-white'}`}>GIFs & Stickers</button>
               </div>
               <button onClick={() => setShowPicker(null)} className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-rose-500 font-black text-xl">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 no-scrollbar bg-white">
               {showPicker === 'emoji' ? (
                  <div className="p-4 md:p-6 space-y-8 pb-10">
                    {Object.entries(EMOJI_CATEGORIES).map(([cat, list]) => (
                      <div key={cat}>
                        <h6 className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] mb-4 text-center">{cat === 'banter' ? 'TRASH TALK' : cat === 'reaction' ? 'STADIUM VIBES' : 'COUNTRIES'}</h6>
                        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 md:gap-4">
                           {list.map(e => (
                             <button key={e} onClick={() => { setNewComment(prev => prev + e); }} className="h-10 md:h-12 flex items-center justify-center bg-slate-50 rounded-2xl text-xl md:text-2xl hover:scale-125 transition-all active:scale-90">{e}</button>
                           ))}
                        </div>
                      </div>
                    ))}
                  </div>
               ) : (
                  <div className="flex flex-col">
                    <div className="sticky top-0 bg-white z-10 p-3 md:p-4 pb-2 border-b border-slate-50 shadow-sm">
                       <div className="flex gap-2 mb-2">
                          <div className="relative flex-1">
                            <input type="text" placeholder="Giphy search..." value={giphySearch} onChange={e => handleGiphySearchChange(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-[#0a2647] transition-all pr-8 shadow-inner" />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 opacity-30 text-xs">🔍</span>
                          </div>
                          <button onClick={() => { const next = activeGiphyTab === 'gifs' ? 'stickers' : 'gifs'; setActiveGiphyTab(next); fetchGiphy(giphySearch, next); }} className="px-4 py-2 bg-[#0a2647] text-white rounded-xl text-[9px] font-black uppercase shadow-md active:scale-95">{activeGiphyTab === 'gifs' ? 'Stickers' : 'GIFs'}</button>
                       </div>
                       <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                          {SUGGESTED_TAGS.map(tag => (
                            <button key={tag} onClick={() => { setGiphySearch(tag); fetchGiphy(tag, activeGiphyTab); }} className="px-2.5 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[7px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap hover:bg-[#0a2647] hover:text-white transition-all">{tag}</button>
                          ))}
                       </div>
                    </div>
                    <div className="p-3 md:p-4 pt-4">
                      {loadingGiphy ? (
                         <div className="flex flex-col items-center py-10 gap-3">
                            <div className="w-8 h-8 border-4 border-[#0a2647] border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest animate-pulse">Scanning...</span>
                         </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 pb-6">
                           {giphyResults.map(g => (
                             <button key={g.id} onClick={() => handleSendMedia(g.images.fixed_height.url)} className="relative h-24 md:h-32 overflow-hidden rounded-xl bg-slate-50 group shadow-sm hover:shadow-lg transition-all border border-slate-100">
                                <img src={g.images.fixed_height_small.url} className="w-full h-full object-cover" alt="giphy" loading="lazy" />
                                <div className="absolute inset-0 bg-[#0a2647]/40 opacity-0 group-hover:opacity-100 flex items-end justify-center p-2 transition-opacity"><span className="text-white font-black text-[8px] uppercase border border-white px-2 py-0.5 rounded-full">Gửi</span></div>
                             </button>
                           ))}
                        </div>
                      )}
                    </div>
                  </div>
               )}
            </div>
          </div>
        )}
      </main>

      {/* 3. COMPACT MODERN INPUT AREA */}
      <footer className={`shrink-0 bg-white border-t border-slate-100 transition-all duration-300 ${isInputCollapsed ? 'p-2 pb-5' : 'p-3 md:p-6 pb-8 md:pb-10'} relative shadow-[0_-15px_40px_rgba(0,0,0,0.03)] rounded-t-[2.5rem] z-[80]`}>
         {/* Toggle Collapse Button */}
         <button
           onClick={() => setIsInputCollapsed(!isInputCollapsed)}
           className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white border border-slate-100 text-slate-300 w-14 h-5 rounded-full flex items-center justify-center hover:text-[#0a2647] transition-all shadow-sm active:scale-110"
         >
           <div className={`w-6 h-1 rounded-full bg-slate-200 transition-transform ${isInputCollapsed ? 'rotate-180 mb-0.5' : 'mt-0.5'}`}></div>
         </button>

         {!isInputCollapsed && (
           <div className="flex items-center gap-2 mb-4 md:mb-5 overflow-x-auto no-scrollbar pb-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <button onClick={() => setShowPicker(showPicker === 'emoji' ? null : 'emoji')} className={`shrink-0 w-11 h-10 md:w-13 md:h-11 flex items-center justify-center rounded-2xl border-2 transition-all ${showPicker === 'emoji' ? 'bg-[#0a2647] border-[#0a2647] text-white shadow-lg' : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'}`}><span className="text-xl md:text-2xl">😃</span></button>
              <button onClick={() => setShowPicker(showPicker === 'giphy' ? null : 'giphy')} className={`shrink-0 w-11 h-10 md:w-13 md:h-11 flex items-center justify-center rounded-2xl border-2 transition-all ${showPicker === 'giphy' ? 'bg-[#0a2647] border-[#0a2647] text-white shadow-lg' : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'}`}><span className="text-xl md:text-2xl">🎬</span></button>
              <div className="w-[1px] h-6 bg-slate-100 mx-1 shrink-0"></div>
              {EMOJI_CATEGORIES.banter.slice(0, 10).map(e => (
                <button key={e} onClick={() => handleSendReact(e)} className="shrink-0 w-9 h-9 md:w-11 md:h-11 flex items-center justify-center bg-slate-50 rounded-xl text-xl md:text-2xl hover:scale-125 transition-all active:scale-95">{e}</button>
              ))}
           </div>
         )}

         <form onSubmit={handleSendMessage} className="flex gap-2 relative items-center">
           <div className="flex-1 relative group">
             <input
              type="text"
              placeholder={user ? randomHint : "Đăng nhập để 'gáy'..."}
              disabled={!user}
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              className={`w-full bg-slate-50 border-2 border-transparent font-bold text-[#0a2647] shadow-inner focus:border-[#0a2647] focus:bg-white outline-none transition-all pr-12 text-sm ${isInputCollapsed ? 'py-3 px-5 rounded-full' : 'py-3 md:py-4 px-6 rounded-[2rem]'}`}
             />
           </div>
           <button
            type="submit"
            disabled={!newComment.trim() || !user}
            className={`bg-[#0a2647] text-white flex items-center justify-center hover:bg-wc-accent transition-all shadow-lg active:scale-90 disabled:opacity-30 shrink-0 ${isInputCollapsed ? 'w-11 h-11 rounded-full' : 'w-12 h-12 md:w-14 md:h-14 rounded-full'}`}
           >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`transition-all duration-500 transform ${isInputCollapsed ? 'h-5 w-5 rotate-[360deg] scale-110' : 'h-6 w-6 rotate-0 scale-100'}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
           </button>
         </form>
      </footer>

      <div className="bg-[#0a2647] px-8 py-2 shrink-0 flex items-center justify-between z-[90] border-t border-white/5">
         <Link to="/" className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] hover:text-white transition-colors">← Thoát</Link>
         <div className="text-wc-gold/40 font-black italic tracking-widest text-[7px] uppercase animate-pulse">Live Arena Mode Active</div>
      </div>

      {activeReacts.map(r => ( <FloatingEmoji key={r.id} emoji={r.emoji} onComplete={() => setActiveReacts(prev => prev.filter(x => x.id !== r.id))} /> ))}
    </div>
  )
}
