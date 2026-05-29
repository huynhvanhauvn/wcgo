
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

const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY || 'dc6zaTOxFJmzC'

const EMOJI_CATEGORIES = {
  banter: ['🤡', '🤮', '🤫', '💸', '👀', '🤐', '🥱', '🤷‍♂️', '🤣', '🥶', '🧐', '🤨', '💩', '🔥', '👺', '💀', '👻', '🖕', '👎', '🤞', '🤕', '🤒', '🤐', '🙄', '😤', '🤬'],
  reaction: ['🔥', '⚽', '😱', '🧤', '👏', '💔', '🏆', '🍺', '✅', '❌', '💯', '🙌', '⭐', '🧿', '🔊', '📣', '📢', '🥅', '🏃', '🦶', '⚡', '🌈', '🧨', '💣', '🪄', '🎩'],
  flags: [
    '🇻🇳', '🇦🇷', '🇧🇷', '🇫🇷', '🇵🇹', '🇩🇪', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '🇯🇵', '🇰🇷', '🇺🇸', '🇲🇽', '🇨🇦',
    '🇪🇸', '🇮🇹', '🇳🇱', '🇧🇪', '🇭🇷', '🇺🇾', '🇨🇴', '🇲🇦', '🇸🇳', '🇪🇬', '🇩🇿', '🇳🇬',
    '🇨🇭', '🇩🇰', '🇺🇦', '🇵🇱', '🇸🇦', '🇶🇦', '🇮🇶', '🇺🇿', '🇦🇪', '🇯🇴', '🇦🇺', '🇳🇿',
    '🇨🇱', '🇵🇾', '🇪🇨', '🇵🇪', '🇨🇷', '🇵🇦', '🇯🇲', '🇭🇹', '🇬🇭', '🇨🇲', '🇹🇳', '🇿🇦',
    '🇸🇪', '🇳🇴', '🇹🇷', '🇷🇴', '🇮🇪', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', '🏴󠁧󠁢󠁷󠁬󠁳󠁿', '🇮🇸', '🇦🇹', '🇨🇿', '🇭🇺', '🇷🇸',
    '🇨🇮', '🇲🇱', '🇬🇳', '🇧🇫', '🇦🇴', '🇿🇲', '🇮🇷', '🇰🇵', '🇹🇭', '🇮🇩', '🇲🇾', '🇵🇭',
    '🇸🇬', '🇱🇦', '🇰🇭', '🇲🇲', '🇧🇳', '🇹🇱', '🇮🇳', '🇵🇰', '🇧🇩', '🇱🇰', '🇳🇵', '🇰🇿',
    '🇬🇪', '🇬🇷', '🇸🇮', '🇸🇰', '🇦🇱', '🇱🇺', '🇫🇮', '🇧🇴', '🇻🇪', '🇬🇺'
  ]
}

const SUGGESTED_TAGS = ['Soccer', 'Goal', 'Messi', 'Ronaldo', 'Funny', 'Cry', 'Siuuu', 'Celebrate']

const CHAT_HINTS = [
  "Định gáy gì mà căng thế?", "Gáy một câu xem ai trầm trồ?", "VAR đang check, gõ nhanh kẻo lỡ!",
  "Phun câu nào, chất câu nấy!", "Sút một phát vào khung chat đi...", "Messi hay Ronaldo đây?"
]

function FloatingEmoji({ emoji, onComplete }: { emoji: string; onComplete: () => void }) {
  const left = useMemo(() => Math.random() * 80 + 10, [])
  useEffect(() => {
    const timer = setTimeout(onComplete, 3000)
    return () => clearTimeout(timer)
  }, [onComplete])
  return (
    <div className="fixed bottom-24 pointer-events-none animate-float-up text-4xl md:text-6xl z-[9999] drop-shadow-2xl" style={{ left: `${left}%` }}>{emoji}</div>
  )
}

export default function MatchHubPage() {
  const { id } = useParams()
  const matchId = parseInt(id || '0')
  const { t } = useTranslation()
  const { user, isAdmin } = useAuth()

  const CHAT_HINTS = useMemo(() => [
    t('match_hub.hints.hint_1'), t('match_hub.hints.hint_2'), t('match_hub.hints.hint_3'),
    t('match_hub.hints.hint_4'), t('match_hub.hints.hint_5'), t('match_hub.hints.hint_6')
  ], [t])

  const [match, setMatch] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [activeReacts, setActiveReacts] = useState<{ id: number; emoji: string }[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const [showPicker, setShowPicker] = useState<boolean>(false)
  const [pickerTab, setPickerTab] = useState<'emoji' | 'giphy'>('emoji')
  const [giphySearch, setGiphySearch] = useState('')
  const [giphyResults, setGiphyResults] = useState<any[]>([])
  const [loadingGiphy, setLoadingGiphy] = useState(false)
  const [activeGiphyType, setActiveGiphyType] = useState<'gifs' | 'stickers'>('gifs')
  const [isInputCollapsed, setIsInputCollapsed] = useState(false)

  const randomHint = useMemo(() => CHAT_HINTS[Math.floor(Math.random() * CHAT_HINTS.length)], [CHAT_HINTS])
  const chatEndRef = useRef<HTMLDivElement>(null)
  const searchTimeoutRef = useRef<any>(null)

  const loadData = useCallback(async () => {
    try {
      const [mRows, cRows] = await Promise.all([api.fetchMatches(), api.fetchComments(matchId)])
      setMatch(mRows.find((m: any) => m.id === matchId))
      setComments(cRows || [])
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }, [matchId])

  const fetchGiphy = useCallback(async (query: string = '', type: 'gifs' | 'stickers' = 'gifs') => {
    setLoadingGiphy(true)
    try {
      const searchTerm = query.trim().length > 0 ? query : 'soccer'
      const endpoint = `https://api.giphy.com/v1/${type}/search`
      const res = await axios.get(endpoint, { params: { api_key: GIPHY_API_KEY, q: searchTerm, limit: 20, rating: 'g' } })
      setGiphyResults(res.data.data || [])
    } catch (e) { console.error(e) } finally { setLoadingGiphy(false) }
  }, [])

  useEffect(() => {
    loadData()
    const channel = api.subscribeToMatchHub(matchId, (payload: any) => {
      if (payload.eventType === 'INSERT') {
        if (payload.new.type === 'REACT') {
           setActiveReacts(prev => [...prev, { id: Date.now() + Math.random(), emoji: payload.new.emoji }])
        } else loadData()
      } else if (payload.eventType === 'DELETE') loadData()
    })
    return () => { channel?.unsubscribe() }
  }, [matchId, loadData])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [comments])

  const handleGiphySearchChange = (val: string) => {
    setGiphySearch(val)
    if (val.trim().length > 0) setPickerTab('giphy')
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => fetchGiphy(val, activeGiphyType), 500)
  }

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!newComment.trim() || !user) return
    const content = newComment.trim()
    setNewComment('')
    setShowPicker(false)
    try { await api.postComment(matchId, user.id, content, 'CHAT') } catch (e) { console.error(e) }
  }

  const handleSendMedia = async (url: string) => {
    if (!user) return
    setShowPicker(false)
    try { await api.postComment(matchId, user.id, url, 'CHAT') } catch (e) { console.error(e) }
  }

  const handleSendReact = async (emoji: string) => {
    if (!user) return
    // Immediate local feedback
    setActiveReacts(prev => [...prev, { id: Date.now() + Math.random(), emoji }])
    try { await api.postComment(matchId, user.id, `Reacted ${emoji}`, 'REACT', emoji) } catch (e) { console.error(e) }
  }

  const handleDeleteMessage = async (commentId: string) => {
    if (!window.confirm(t('match_hub.confirm_delete'))) return
    try { await api.deleteComment(commentId); loadData(); } catch (e: any) { console.error(e) }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!window.confirm(t('match_hub.bulk_delete_confirm', { count: selectedIds.length }))) return
    try { await api.deleteComments(selectedIds); setSelectedIds([]); loadData(); } catch (e: any) { console.error(e) }
  }

  if (loading) return <LoadingScreen message={t('match_hub.connecting')} />
  if (!match) return <div className="p-20 text-center font-black uppercase text-slate-400">{t('match_hub.not_found')}</div>

  const isLive = DateTime.now() > DateTime.fromISO(match.start_time) && match.status !== 'FINISHED'

  return (
    <>
      {/* Floating Reacts - Rendered outside to bypass overflow constraints */}
      {activeReacts.map(r => (
        <FloatingEmoji key={r.id} emoji={r.emoji} onComplete={() => setActiveReacts(prev => prev.filter(x => x.id !== r.id))} />
      ))}

      <div className="max-w-4xl mx-auto flex flex-col h-[calc(100dvh-100px)] md:h-[calc(100vh-120px)] animate-in fade-in duration-500 overflow-hidden relative rounded-2xl my-0 md:my-4 border border-slate-100 shadow-2xl bg-white">
        <header className="bg-[#0a2647] p-3 md:p-5 shrink-0 z-50 rounded-t-2xl">
           <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-0.5 bg-white/10 rounded-full">
                 <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-rose-500 animate-pulse' : 'bg-slate-400'}`}></span>
                 <span className="text-[9px] font-black text-white uppercase tracking-widest">{match.status === 'FINISHED' ? t('match_hub.finished') : t('match_hub.live')}</span>
              </div>
              <div className="w-full flex items-center justify-between px-4">
                 <div className="flex-1 flex flex-col items-center gap-1 min-w-0">
                    <img src={getFlagUrl(match.team_a) || ''} className="h-7 w-10 md:h-10 md:w-15 object-cover rounded-sm" alt="" />
                    <h3 className="text-[10px] font-black text-white uppercase truncate w-full text-center">{t(`teams.${match.team_a}`, { defaultValue: match.team_a })}</h3>
                 </div>
                 <div className="flex items-center gap-4 md:gap-8 mx-4">
                    <span className="text-4xl md:text-5xl font-black text-white">{match.score_a ?? 0}</span>
                    <span className="text-xs font-black text-white/20 italic">VS</span>
                    <span className="text-4xl md:text-5xl font-black text-white">{match.score_b ?? 0}</span>
                 </div>
                 <div className="flex-1 flex flex-col items-center gap-1 min-w-0">
                    <img src={getFlagUrl(match.team_b) || ''} className="h-7 w-10 md:h-10 md:w-15 object-cover rounded-sm" alt="" />
                    <h3 className="text-[10px] font-black text-white uppercase truncate w-full text-center">{t(`teams.${match.team_b}`, { defaultValue: match.team_b })}</h3>
                 </div>
              </div>
           </div>
        </header>

        <main className="flex-1 flex flex-col overflow-hidden relative bg-slate-50/20">
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 no-scrollbar">
             {comments.map((c, idx) => {
               const isMe = c.user_id === user?.id
               const profile = c.profiles || {}
               if (c.type === 'REACT') return null
               const isMedia = c.content.startsWith('http') && (c.content.includes('giphy.com') || c.content.includes('.gif'))
               const isSelected = selectedIds.includes(c.id)

               return (
                 <div key={c.id || idx} className={`flex ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 group relative`}>
                    {isAdmin && (
                      <button onClick={() => setSelectedIds(prev => prev.includes(c.id) ? prev.filter(i => i !== c.id) : [...prev, c.id])}
                        className={`shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-wc-gold border-wc-gold text-white' : 'border-slate-200 bg-white'}`}>
                        {isSelected && <span className="text-[8px]">✓</span>}
                      </button>
                    )}
                    <UserAvatar name={profile.display_name} avatarUrl={profile.avatar_url} className="h-6 w-6 shrink-0 rounded-full border border-slate-100" />
                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[80%]`}>
                       <div className={`px-4 py-2 text-sm font-medium transition-all duration-300 ${isSelected ? 'ring-2 ring-wc-gold shadow-lg' : ''} ${isMedia ? '' : isMe ? 'bg-[#0a2647] text-white rounded-2xl rounded-br-none shadow-sm' : 'bg-white text-slate-700 rounded-2xl rounded-bl-none border border-slate-100'}`}>
                          {isMedia ? <img src={c.content} className="rounded-xl max-w-[200px]" alt="gif" /> : c.content}
                       </div>
                       <div className="flex items-center gap-1.5 mt-1 px-1">
                          <span className="text-[8px] text-slate-300 font-bold uppercase">{profile.display_name || 'User'} • {DateTime.fromISO(c.created_at).toRelative()}</span>
                          {isAdmin && (
                            <button onClick={() => handleDeleteMessage(c.id)} className="opacity-0 group-hover:opacity-100 text-[7px] font-black text-rose-400 hover:text-rose-600 transition-all uppercase">• Xoá</button>
                          )}
                       </div>
                    </div>
                 </div>
               )
             })}
             <div ref={chatEndRef} />
          </div>

          {isAdmin && selectedIds.length > 0 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[100] bg-[#0a2647] text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-5">
              <span className="text-xs font-black uppercase tracking-widest">{selectedIds.length} {t('match_tabs.matches_found').toLowerCase().includes('trận') ? 'đã chọn' : 'selected'}</span>
              <div className="w-[1px] h-4 bg-white/20"></div>
              <button onClick={handleBulkDelete} className="text-xs font-black uppercase tracking-widest text-rose-400 hover:text-rose-300 transition-colors">{t('match_hub.bulk_delete')}</button>
              <button onClick={() => setSelectedIds([])} className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">{t('match_hub.cancel_selection')}</button>
            </div>
          )}

          {showPicker && (
            <div className="absolute inset-0 bg-white/98 backdrop-blur-xl z-[60] flex flex-col animate-in slide-in-from-bottom-5 duration-300">
              <div className="p-3 border-b border-slate-100 flex items-center gap-2">
                 <div className="relative flex-1">
                   <input type="text" placeholder={t('match_hub.picker_placeholder')} value={giphySearch} onChange={e => handleGiphySearchChange(e.target.value)}
                     className="w-full pl-10 pr-10 py-2.5 bg-slate-100/50 rounded-xl text-sm font-bold outline-none focus:bg-white border border-transparent focus:border-slate-200 transition-all" />
                   <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                   <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                      <button onClick={() => setPickerTab('emoji')} className={`p-1.5 rounded-lg transition-colors ${pickerTab === 'emoji' ? 'bg-white shadow-sm text-[#0a2647]' : 'text-slate-400'}`}>😃</button>
                      <button onClick={() => { setPickerTab('giphy'); fetchGiphy(giphySearch, activeGiphyType); }} className={`p-1.5 rounded-lg transition-colors ${pickerTab === 'giphy' ? 'bg-white shadow-sm text-[#0a2647]' : 'text-slate-400'}`}>🎬</button>
                   </div>
                 </div>
                 <button onClick={() => setShowPicker(false)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-500 text-xl font-bold transition-transform active:rotate-90">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
                 {pickerTab === 'emoji' ? (
                    <div className="space-y-6 pb-10">
                      {Object.entries(EMOJI_CATEGORIES).map(([cat, list]) => (
                        <div key={cat}>
                          <h6 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3">{t(`match_hub.emoji_categories.${cat}`)}</h6>
                          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-3">
                             {list.map(e => <button key={e} onClick={() => { setNewComment(prev => prev + e); setPickerTab('emoji'); }} className="aspect-square flex items-center justify-center bg-slate-50 rounded-xl text-2xl hover:bg-slate-100 active:scale-90 transition-all">{e}</button>)}
                          </div>
                        </div>
                      ))}
                    </div>
                 ) : (
                    <div className="space-y-4">
                      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                         {SUGGESTED_TAGS.map(tag => <button key={tag} onClick={() => { setGiphySearch(tag); fetchGiphy(tag, activeGiphyType); }} className="px-3 py-1.5 bg-slate-50 rounded-full text-[10px] font-bold text-slate-500 whitespace-nowrap hover:bg-[#0a2647] hover:text-white transition-all">#{tag}</button>)}
                      </div>
                      {loadingGiphy ? <div className="py-20 text-center animate-pulse text-slate-300 font-black uppercase text-[10px] tracking-widest">{t('match_hub.searching_giphy')}</div> : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pb-10">
                           {giphyResults.map(g => <button key={g.id} onClick={() => handleSendMedia(g.images.fixed_height.url)} className="relative aspect-video overflow-hidden rounded-lg bg-slate-50 border border-slate-100 hover:border-[#0a2647] transition-all group"><img src={g.images.fixed_height_small.url} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="gif" /></button>)}
                        </div>
                      )}
                    </div>
                 )}
              </div>
            </div>
          )}
        </main>

        <footer className={`shrink-0 bg-white border-t border-slate-50 transition-all duration-500 ease-in-out ${isInputCollapsed ? 'p-2 pb-5' : 'p-3 md:p-5 pb-8'} relative z-[80]`}>
           <button onClick={() => setIsInputCollapsed(!isInputCollapsed)} className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-white border border-slate-100 text-slate-200 w-14 h-5 rounded-full flex items-center justify-center shadow-sm hover:text-[#0a2647] transition-colors">
             <div className={`w-6 h-1 rounded-full bg-slate-100 transition-all duration-500 transform ${isInputCollapsed ? 'rotate-180 scale-110 bg-slate-300' : ''}`}></div>
           </button>

           {!isInputCollapsed && (
             <div className="flex items-center gap-2 mb-3 overflow-x-auto no-scrollbar pb-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <button onClick={() => { setShowPicker(true); setPickerTab('emoji'); }} className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-xl hover:bg-slate-100 hover:scale-105 active:scale-95 transition-all">😃</button>
                <button onClick={() => { setShowPicker(true); setPickerTab('giphy'); fetchGiphy('', 'gifs'); }} className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-xl hover:bg-slate-100 hover:scale-105 active:scale-95 transition-all">🎬</button>
                <div className="w-[1px] h-6 bg-slate-100 mx-1"></div>
                {EMOJI_CATEGORIES.banter.slice(0, 10).map(e => (
                  <button key={e} onClick={() => handleSendReact(e)} className="shrink-0 w-9 h-9 flex items-center justify-center bg-slate-50 rounded-lg text-xl hover:bg-white hover:scale-125 transition-all active:scale-90">{e}</button>
                ))}
             </div>
           )}

           <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
             <input type="text" placeholder={user ? randomHint : t('match_hub.login_to_chat')} value={newComment} onChange={e => setNewComment(e.target.value)}
              className={`flex-1 bg-slate-100/50 border border-transparent font-bold text-[#0a2647] focus:bg-white focus:border-slate-200 outline-none transition-all duration-300 text-sm ${isInputCollapsed ? 'py-2 px-5 rounded-full' : 'py-3.5 px-6 rounded-2xl'}`} />
             <button type="submit" disabled={!newComment.trim()} className={`bg-[#0a2647] text-white flex items-center justify-center shadow-lg active:scale-90 disabled:opacity-20 shrink-0 transition-all duration-500 ease-in-out ${isInputCollapsed ? 'w-10 h-10 rounded-full' : 'w-12 h-12 md:w-14 md:h-14 rounded-2xl'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`transition-all duration-700 ease-in-out transform ${isInputCollapsed ? 'h-5 w-5 rotate-[360deg] scale-110' : 'h-6 w-6 rotate-0 scale-100'}`} viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
             </button>
           </form>
        </footer>

        <div className="bg-[#0a2647] px-8 py-2 shrink-0 flex items-center justify-between z-[90] border-t border-white/5">
           <Link to="/" className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] hover:text-white transition-colors flex items-center gap-2"><span>←</span> {t('match_hub.exit_arena')}</Link>
           <div className="text-wc-gold/40 font-black italic tracking-widest text-[7px] uppercase animate-pulse">Stadium Arena v4.0 Pro</div>
        </div>
      </div>
    </>
  )
}
