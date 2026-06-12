
import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { DateTime } from 'luxon'
import axios from 'axios'
import * as api from '../lib/api'
import { useAuth } from '../context/AuthProvider'
import { getFlagUrl } from '../lib/flags'
import { fetchExternalLiveFixture, getStatusLabel, validateUpdate } from '../lib/liveSync'
import UserAvatar from '../components/UserAvatar'
import LoadingScreen from '../components/LoadingScreen'

const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY || 'dc6zaTOxFJmzC'

const EMOJI_CATEGORIES = {
  banter: [
    '🤡', '🤮', '🤫', '💸', '👀', '🤐', '🥱', '🤷‍♂️', '🤣', '🥶', '🧐', '🤨', '💩', '🔥', '👺', '💀', '👻', '🖕', '👎', '🤞', '🤕', '🤒', '🙄', '😤', '🤬',
    '🧂', '🌶️', '🧱', '🚌', '🧼', '🦽', '⚰️', '🐸', '🐔', '🥔', '🥥', '🩴', '💨', '🤏', '🐢', '🦖', '🍌', '🦴', '🔨', '🧨', '💣'
  ],
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
  const [showScrollButton, setShowScrollButton] = useState(false)

  const [showPicker, setShowPicker] = useState<boolean>(false)
  const [pickerTab, setPickerTab] = useState<'emoji' | 'giphy'>('emoji')
  const [giphySearch, setGiphySearch] = useState('')
  const [giphyResults, setGiphyResults] = useState<any[]>([])
  const [loadingGiphy, setLoadingGiphy] = useState(false)
  const [activeGiphyType, setActiveGiphyType] = useState<'gifs' | 'stickers'>('gifs')
  const [isInputCollapsed, setIsInputCollapsed] = useState(false)
  const [syncLogs, setSyncLogs] = useState<{ time: string; msg: string; type: 'info' | 'warn' | 'err' }[]>([])
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)
  const [showVarDetails, setShowVarDetails] = useState(false)
  const [isManualMode, setIsManualMode] = useState(false)
  const [manualScoreA, setManualScoreA] = useState<number>(0)
  const [manualScoreB, setManualScoreB] = useState<number>(0)
  const [manualStatus, setManualStatus] = useState<string>('LIVE')
  const [isUpdatingManual, setIsUpdatingManual] = useState(false)

  const randomHint = useMemo(() => CHAT_HINTS[Math.floor(Math.random() * CHAT_HINTS.length)], [CHAT_HINTS])
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const searchTimeoutRef = useRef<any>(null)
  const isAutoScrolling = useRef(false)
  const isSyncing = useRef(false)

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (chatEndRef.current) {
      isAutoScrolling.current = true
      chatEndRef.current.scrollIntoView({ behavior })
      setShowScrollButton(false)
      setTimeout(() => { isAutoScrolling.current = false }, 500)
    }
  }, [])

  const loadData = useCallback(async () => {
    try {
      const [mRows, cRows] = await Promise.all([api.fetchMatches(), api.fetchComments(matchId)])
      const currentMatch = mRows.find((m: any) => m.id === matchId)
      setMatch(currentMatch)
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

  // Handle Scroll Events to detect if user is at bottom
  const handleScroll = () => {
    if (!chatContainerRef.current || isAutoScrolling.current) return
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current
    // If user is more than 150px away from bottom, show scroll button if new messages arrive
    const atBottom = scrollHeight - scrollTop - clientHeight < 150
    if (atBottom) {
      setShowScrollButton(false)
    }
  }

  useEffect(() => {
    loadData()
    const channel = api.subscribeToMatchHub(matchId, (payload: any) => {
      if (payload.eventType === 'INSERT') {
        if (payload.new.type === 'REACT') {
           setActiveReacts(prev => [...prev, { id: Date.now() + Math.random(), emoji: payload.new.emoji }])
        } else {
          // Check if we should auto-scroll or show button
          const container = chatContainerRef.current
          const isAtBottom = container ? (container.scrollHeight - container.scrollTop - container.clientHeight < 150) : true

          api.fetchComments(matchId).then(rows => {
            setComments(rows || [])
            if (isAtBottom) {
              setTimeout(() => scrollToBottom('smooth'), 100)
            } else {
              setShowScrollButton(true)
            }
          })
        }
      } else if (payload.eventType === 'DELETE') loadData()
    })

    const matchChannel = api.subscribeMatches((payload: any) => {
      if (payload.new && payload.new.id === matchId) {
        setMatch((prev: any) => ({ ...prev, ...payload.new }))
      }
    })

    return () => {
      channel?.unsubscribe()
      matchChannel?.unsubscribe()
    }
  }, [matchId, loadData, scrollToBottom])

  // Sync manual state with match data when entering manual mode
  useEffect(() => {
    if (isManualMode && match) {
      setManualScoreA(match.score_a ?? 0)
      setManualScoreB(match.score_b ?? 0)
      setManualStatus(match.status)
    }
  }, [isManualMode, match?.id])

  const handleManualUpdate = async () => {
    if (!match) return
    setIsUpdatingManual(true)
    const nowStr = DateTime.now().toFormat('HH:mm:ss')
    try {
      await api.settleMatch(match.id, manualScoreA, manualScoreB, manualStatus)
      setSyncLogs(prev => [{ time: nowStr, msg: `Manual Update: ${manualScoreA}-${manualScoreB} (${manualStatus})`, type: 'info' }, ...prev].slice(0, 5))
      alert('Cập nhật thành công!')
    } catch (e: any) {
      setSyncLogs(prev => [{ time: nowStr, msg: `Manual Error: ${e.message}`, type: 'err' }, ...prev].slice(0, 5))
      alert('Lỗi: ' + e.message)
    } finally {
      setIsUpdatingManual(false)
    }
  }

  // Automatic Live Sync (Admins only)
  useEffect(() => {
    if (!match || !isAdmin || match.status === 'FINISHED' || isManualMode) return

    const startTime = DateTime.fromISO(match.start_time)
    const now = DateTime.now()

    // Only sync if match is actually in progress (or within 3 hours of start)
    const isActuallyLive = now > startTime.minus({ minutes: 5 }) && now < startTime.plus({ hours: 4 })

    if (!isActuallyLive) return

    const sync = async () => {
      if (isSyncing.current) return
      isSyncing.current = true
      try {
        const liveData = await fetchExternalLiveFixture(match.team_a, match.team_b)
        const nowStr = DateTime.now().toFormat('HH:mm:ss')
        setLastSyncTime(nowStr)

        if (liveData) {
          // Validate
          const validation = validateUpdate(match, liveData)
          if (!validation.valid) {
            setSyncLogs(prev => [{ time: nowStr, msg: `Ignored: ${validation.reason}`, type: 'warn' }, ...prev].slice(0, 5))
            return
          }

          // Check if data actually changed
          const hasChanged =
            match.score_a !== liveData.goalsA ||
            match.score_b !== liveData.goalsB ||
            match.status !== liveData.status ||
            match.period !== liveData.period

          if (hasChanged) {
            setSyncLogs(prev => [{ time: nowStr, msg: `Update: ${liveData.goalsA}-${liveData.goalsB} (${liveData.source})`, type: 'info' }, ...prev].slice(0, 5))

            // Push to DB and update points in real-time
            await api.settleMatch(
              match.id,
              liveData.goalsA,
              liveData.goalsB,
              liveData.status
            )

            // Still update elapsed and period
            await api.updateMatchLive(
              match.id,
              liveData.goalsA,
              liveData.goalsB,
              liveData.status,
              liveData.elapsed,
              liveData.period
            )
          } else {
            setSyncLogs(prev => [{ time: nowStr, msg: `No change (${liveData.source})`, type: 'info' }, ...prev].slice(0, 5))
          }
        } else {
          setSyncLogs(prev => [{ time: nowStr, msg: 'API: No live data for this match', type: 'info' }, ...prev].slice(0, 5))
        }
      } catch (e: any) {
        setSyncLogs(prev => [{ time: DateTime.now().toFormat('HH:mm:ss'), msg: `Error: ${e.message}`, type: 'err' }, ...prev].slice(0, 5))
      } finally {
        isSyncing.current = false
      }
    }

    const interval = setInterval(sync, 60000)
    return () => clearInterval(interval)
  }, [match?.id, isAdmin, isManualMode]) // Reduced dependencies to prevent infinite loops

  // Initial scroll to bottom on load
  useEffect(() => {
    if (!loading && comments.length > 0) {
      setTimeout(() => scrollToBottom('auto'), 100)
    }
  }, [loading, scrollToBottom, comments.length === 0]) // length check for first load

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
      {/* Decorative Floating Balls for WC26 Vibes */}
      <div className="fixed top-20 left-10 opacity-10 pointer-events-none z-0 hidden lg:block animate-in fade-in duration-1000">
        <img src="/images/ball.png" className="w-24 h-24 animate-spin-slow" alt="" />
      </div>
      <div className="fixed bottom-40 left-1/4 opacity-5 pointer-events-none z-0 hidden lg:block animate-in fade-in duration-1000">
        <img src="/images/ball.png" className="w-32 h-32 animate-bounce-slow" alt="" />
      </div>

      {activeReacts.map(r => (
        <FloatingEmoji key={r.id} emoji={r.emoji} onComplete={() => setActiveReacts(prev => prev.filter(x => x.id !== r.id))} />
      ))}

      <div className="max-w-4xl mx-auto flex flex-col h-[calc(100dvh-100px)] md:h-[calc(100vh-120px)] animate-in fade-in duration-500 overflow-hidden relative rounded-2xl my-0 md:my-4 border border-slate-100 shadow-2xl bg-white">
        <header className="bg-[#0a2647] p-3 md:p-5 shrink-0 z-50 rounded-t-2xl">
           <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-0.5 bg-white/10 rounded-full">
                 <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-rose-500 animate-pulse' : 'bg-slate-400'}`}></span>
                 <span className="text-[9px] font-black text-white uppercase tracking-widest">
                    {getStatusLabel(match.status, match.elapsed, match.period, t)}
                 </span>
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

           {/* ADMIN VAR MONITOR (Visible only to Admin) */}
           {isAdmin && (
             <div className="mt-4 w-full max-w-lg mx-auto">
                <button
                  onClick={() => setShowVarDetails(!showVarDetails)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all duration-300 ${showVarDetails ? 'bg-slate-900/90 border-wc-gold/50 shadow-lg' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                >
                   <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className={`w-2.5 h-2.5 rounded-full ${lastSyncTime ? 'bg-emerald-500' : 'bg-slate-500'} animate-pulse`}></div>
                        {lastSyncTime && <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-40"></div>}
                      </div>
                      <span className="text-[10px] font-black text-white uppercase tracking-widest italic">
                        VAR LIVE MONITOR
                      </span>
                   </div>
                   <div className="flex items-center gap-2">
                      <span className="text-[8px] font-bold text-white/40 uppercase">Sync Status: Active</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-white/30 transition-transform duration-500 ${showVarDetails ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                   </div>
                </button>

                {showVarDetails && (
                  <div className="mt-2 bg-slate-950/90 backdrop-blur-xl rounded-2xl p-4 border border-wc-gold/20 animate-in slide-in-from-top-2 duration-300 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
                       <img src="/images/ball.png" className="w-16 h-16 grayscale" alt="" />
                    </div>

                    <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                       <span className="text-[9px] font-black text-wc-gold uppercase tracking-widest">Feed Dữ liệu Trực tiếp</span>
                       <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 cursor-pointer group">
                             <span className={`text-[8px] font-bold uppercase transition-colors ${isManualMode ? 'text-amber-400' : 'text-white/30'}`}>Chế độ Thủ công</span>
                             <div className="relative" onClick={() => setIsManualMode(!isManualMode)}>
                                <div className={`w-8 h-4 rounded-full transition-colors ${isManualMode ? 'bg-amber-500' : 'bg-white/10'}`}></div>
                                <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-300 ${isManualMode ? 'translate-x-4' : 'translate-x-0'}`}></div>
                             </div>
                          </label>
                          <span className="text-[8px] font-mono text-white/30 italic">Channel ID: {match.id}</span>
                       </div>
                    </div>

                    {isManualMode ? (
                      <div className="bg-white/5 rounded-xl p-3 border border-white/5 animate-in fade-in zoom-in-95">
                         <div className="flex items-center justify-between gap-4 mb-4">
                            <div className="flex-1 space-y-2">
                               <div className="text-[7px] font-black text-white/40 uppercase tracking-widest text-center">Score Control</div>
                               <div className="flex items-center justify-center gap-4 bg-black/40 p-2 rounded-xl border border-white/5">
                                  <div className="flex flex-col items-center gap-1">
                                     <button onClick={() => setManualScoreA(prev => Math.max(0, prev - 1))} className="w-6 h-6 flex items-center justify-center bg-white/10 rounded-lg text-xs hover:bg-white/20">−</button>
                                     <span className="text-xl font-black text-white">{manualScoreA}</span>
                                     <button onClick={() => setManualScoreA(prev => prev + 1)} className="w-6 h-6 flex items-center justify-center bg-white/10 rounded-lg text-xs hover:bg-white/20">+</button>
                                  </div>
                                  <div className="text-white/20 font-black italic">VS</div>
                                  <div className="flex flex-col items-center gap-1">
                                     <button onClick={() => setManualScoreB(prev => Math.max(0, prev - 1))} className="w-6 h-6 flex items-center justify-center bg-white/10 rounded-lg text-xs hover:bg-white/20">−</button>
                                     <span className="text-xl font-black text-white">{manualScoreB}</span>
                                     <button onClick={() => setManualScoreB(prev => prev + 1)} className="w-6 h-6 flex items-center justify-center bg-white/10 rounded-lg text-xs hover:bg-white/20">+</button>
                                  </div>
                               </div>
                            </div>
                            <div className="flex-1 space-y-2">
                               <div className="text-[7px] font-black text-white/40 uppercase tracking-widest text-center">Match Status</div>
                               <div className="grid grid-cols-1 gap-1">
                                  {['SCHEDULED', 'LIVE', 'FINISHED'].map(st => (
                                    <button
                                      key={st}
                                      onClick={() => setManualStatus(st)}
                                      className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${manualStatus === st ? 'bg-wc-gold text-slate-900 shadow-[0_0_10px_rgba(245,158,11,0.3)]' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                                    >
                                      {st}
                                    </button>
                                  ))}
                               </div>
                            </div>
                         </div>
                         <button
                           onClick={handleManualUpdate}
                           disabled={isUpdatingManual}
                           className="w-full py-3 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                         >
                           {isUpdatingManual ? 'Syncing to Stadium...' : 'Push to Tournament DB'}
                         </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {syncLogs.length === 0 ? (
                          <div className="text-[9px] text-white/30 font-medium italic text-center py-4">Đang đồng bộ với hệ thống vệ tinh...</div>
                        ) : syncLogs.map((log, i) => (
                          <div key={i} className="flex items-start gap-3 text-[9px] font-mono leading-tight">
                             <span className="text-white/20 shrink-0">[{log.time}]</span>
                             <span className={log.type === 'info' ? 'text-emerald-400' : log.type === 'warn' ? 'text-amber-400' : 'text-rose-400'}>
                               {log.type === 'info' ? '>> ' : log.type === 'warn' ? '!! ' : 'ERR: '}
                               {log.msg}
                             </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 flex justify-between items-center pt-3 border-t border-white/5">
                       <div className="flex gap-2">
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[7px] font-black uppercase rounded border border-emerald-500/20">Primary: OK</span>
                          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[7px] font-black uppercase rounded border border-blue-500/20">Auto-Settle: ON</span>
                       </div>
                       <span className="text-[8px] text-white/20 font-bold">API-FOOTBALL v3.0</span>
                    </div>
                  </div>
                )}
             </div>
           )}
        </header>

        <main className="flex-1 flex flex-col overflow-hidden relative bg-slate-50/20">
          <div
            ref={chatContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 no-scrollbar scrolling-touch"
          >
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
             <div ref={chatEndRef} className="h-1" />
          </div>

          {/* New Messages / Scroll to Bottom Button */}
          {showScrollButton && (
            <button
              onClick={() => scrollToBottom('smooth')}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[55] bg-wc-accent text-[#0a2647] px-4 py-2 rounded-full shadow-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 animate-bounce border-2 border-white/20"
            >
              <span>⬇</span> Tin nhắn mới
            </button>
          )}

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
                {EMOJI_CATEGORIES.banter.slice(0, 15).map(e => (
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
