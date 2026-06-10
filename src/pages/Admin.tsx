
import React, { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import * as api from '../lib/api'
import { useAuth } from '../context/AuthProvider'
import { calculateStandings, sortGroupStandings, KNOCKOUT_PROGRESSION_MAP, getMatchWinner, getMatchLoser } from '../lib/standings'

type AdminTab = 'matches' | 'players' | 'resets' | 'deletions' | 'live_sync'

export default function AdminPage() {
  const { t } = useTranslation()
  const { isAdmin } = useAuth()
  const [matches, setMatches] = useState<any[]>([])
  const [profiles, setAllProfiles] = useState<any[]>([])
  const [resetRequests, setResetRequests] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<AdminTab>('matches')

  const [settling, setSettling] = useState<Record<number, boolean>>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [scoreInputs, setScoreInputs] = useState<Record<number, { a: number | ''; b: number | '' }>>({})
  const [editingNames, setEditingNames] = useState<Record<string, string>>({})
  const [newPasswords, setNewPasswords] = useState<Record<string, string>>({})

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      // Fetch all data in a single block to catch any schema/RLS errors
      const m = await api.fetchMatches()
      const pRows = await api.fetchAllProfiles()
      const rRows = await api.fetchPasswordResetRequests().catch(() => []) // Optional, don't crash

      setMatches(m || [])
      setAllProfiles(pRows || [])
      setResetRequests(rRows || [])

      // Init inputs
      const inputs: Record<number, { a: number | ''; b: number | '' }> = {}
      m?.forEach((match: any) => {
        inputs[match.id] = {
          a: match.score_a !== null ? match.score_a : '',
          b: match.score_b !== null ? match.score_b : ''
        }
      })
      setScoreInputs(inputs)

      const names: Record<string, string> = {}
      pRows.forEach((p: any) => {
        names[p.user_id] = p.real_name || ''
      })
      setEditingNames(names)

      if ((!m || m.length === 0) && (!pRows || pRows.length === 0)) {
        setError("Dữ liệu rỗng. Hãy kiểm tra các bảng 'matches' và 'profiles' trong Supabase.")
      }
    } catch (e: any) {
      console.error('CRITICAL ADMIN LOAD ERROR:', e)
      setError(`LỖI DATABASE: ${e.message}. Có thể bạn chưa chạy các file migration SQL để tạo cột/bảng mới.`);
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) loadData()
  }, [isAdmin])

  const handleSettle = async (matchId: number) => {
    const input = scoreInputs[matchId]
    if (input.a === '' || input.b === '') return
    setSettling(prev => ({ ...prev, [matchId]: true }))
    try {
      await api.settleMatch(matchId, input.a as number, input.b as number)
      const currentMatch = matches.find(m => m.id === matchId)
      if (currentMatch) {
        const finishedMatch = { ...currentMatch, status: 'FINISHED', score_a: input.a, score_b: input.b }
        const winner = getMatchWinner(finishedMatch)
        const winnerDest = KNOCKOUT_PROGRESSION_MAP[`W${matchId}`]
        if (winnerDest && winner) await api.updateMatchTeam(winnerDest.matchId, winnerDest.side, winner.id, winner.name)
      }
      loadData()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSettling(prev => ({ ...prev, [matchId]: false }))
    }
  }

  const handleVerify = async (userId: string, status: boolean) => {
    try {
      await api.verifyUserProfile(userId, status, editingNames[userId])
      loadData()
    } catch (e: any) { alert(e.message) }
  }

  const handleUpdateRealName = async (userId: string) => {
    try {
      const p = profiles.find(p => p.user_id === userId)
      await api.verifyUserProfile(userId, p?.is_verified || false, editingNames[userId])
      alert('Cập nhật thành công!')
      loadData()
    } catch (e: any) { alert(e.message) }
  }

  const handleResetPassword = async (requestId: string, userId: string) => {
    const newPass = newPasswords[requestId]
    if (!newPass || newPass.length < 6) return alert("Mật khẩu ít nhất 6 ký tự")
    try {
      await api.adminResetPassword(requestId, userId, newPass)
      alert("Đã đổi mật khẩu!")
      loadData()
    } catch (e: any) { alert(e.message) }
  }

  const handleDelete = async (userId: string) => {
    if (!window.confirm(t('admin_deletion.confirm_delete'))) return
    try {
      await api.deleteUserByAdmin(userId)
      loadData()
    } catch (e: any) { alert(e.message) }
  }

  if (!isAdmin) return <div className="p-10 text-center font-bold text-rose-500">{t('authFailed')}</div>

  const pendingMatches = matches.filter(m => m.status !== 'FINISHED')
  const deletionRequests = profiles.filter(p => p.deletion_status === 'PENDING')

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20 px-2">
      {/* TABS */}
      <div className="flex border-b border-slate-100 bg-white rounded-t-[2rem] overflow-hidden shadow-sm">
        <button onClick={() => setActiveTab('matches')} className={`flex-1 py-5 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'matches' ? 'bg-[#0a2647] text-white' : 'text-slate-400 hover:bg-slate-50'}`}>{t('matches')}</button>
        <button onClick={() => setActiveTab('players')} className={`flex-1 py-5 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'players' ? 'bg-[#0a2647] text-white' : 'text-slate-400 hover:bg-slate-50'}`}>{t('admin_panel.user_management')}</button>
        <button onClick={() => setActiveTab('resets')} className={`flex-1 py-5 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'resets' ? 'bg-[#0a2647] text-white' : 'text-slate-400 hover:bg-slate-50'}`}>OTP ({resetRequests.length})</button>
        <button onClick={() => setActiveTab('deletions')} className={`flex-1 py-5 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'deletions' ? 'bg-[#0a2647] text-white' : 'text-slate-400 hover:bg-slate-50'}`}>Xoá ({deletionRequests.length})</button>
        <button onClick={() => setActiveTab('live_sync')} className={`flex-1 py-5 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'live_sync' ? 'bg-[#0a2647] text-white' : 'text-slate-400 hover:bg-slate-50'}`}>Live Sync</button>
      </div>

      {error && (
        <div className="p-6 bg-rose-50 border-2 border-rose-100 rounded-3xl text-rose-600 font-bold text-sm shadow-sm animate-in zoom-in-95">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🚨</span>
            <span className="uppercase tracking-widest">Cảnh báo hệ thống</span>
          </div>
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-24 text-center">
           <div className="inline-block w-12 h-12 border-4 border-[#0a2647] border-t-transparent rounded-full animate-spin mb-4"></div>
           <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs">Đang đồng bộ dữ liệu...</p>
        </div>
      ) : (
        <div className="animate-in slide-in-from-bottom-2 duration-500">
          {activeTab === 'matches' && (
            <div className="grid gap-4">
              {pendingMatches.length === 0 ? (
                 <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-3xl text-slate-300 font-bold uppercase tracking-widest text-xs">Tất cả trận đấu đã được chốt.</div>
              ) : pendingMatches.map(m => (
                <div key={m.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-center md:text-left">
                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Trận #{m.id} · {m.stage}</span>
                    <div className="font-black text-[#0a2647] text-lg uppercase italic mt-1">{m.team_a} vs {m.team_b}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center bg-slate-50 p-1 rounded-2xl border border-slate-100">
                      <input type="number" value={scoreInputs[m.id]?.a ?? ''} onChange={e => setScoreInputs({...scoreInputs, [m.id]: {...scoreInputs[m.id], a: e.target.value === '' ? '' : Number(e.target.value)}})} className="w-14 h-12 text-center font-black bg-transparent outline-none text-[#0a2647] text-xl" placeholder="0" />
                      <span className="text-slate-300 font-bold px-2">−</span>
                      <input type="number" value={scoreInputs[m.id]?.b ?? ''} onChange={e => setScoreInputs({...scoreInputs, [m.id]: {...scoreInputs[m.id], b: e.target.value === '' ? '' : Number(e.target.value)}})} className="w-14 h-12 text-center font-black bg-transparent outline-none text-[#0a2647] text-xl" placeholder="0" />
                    </div>
                    <button onClick={() => handleSettle(m.id)} disabled={settling[m.id] || scoreInputs[m.id]?.a === ''} className="btn-primary px-8 h-14 rounded-2xl uppercase font-black text-[11px] tracking-widest shadow-xl disabled:opacity-30">Chốt</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'players' && (
            <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="p-6">Thành viên</th>
                    <th className="p-6 text-center">Trạng thái</th>
                    <th className="p-6 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {profiles.map(p => (
                    <tr key={p.user_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-6">
                        <div className="font-black text-[#0a2647] text-base">{p.display_name || p.username}</div>
                        <div className="mt-3 flex items-center gap-2">
                           <input type="text" value={editingNames[p.user_id] || ''} onChange={e => setEditingNames({...editingNames, [p.user_id]: e.target.value})} className="w-full max-w-[200px] bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all" placeholder="Nhập tên thật..." />
                           <button onClick={() => handleUpdateRealName(p.user_id)} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all" title="Lưu tên"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg></button>
                        </div>
                      </td>
                      <td className="p-6 text-center">
                        <button onClick={() => handleVerify(p.user_id, !p.is_verified)} className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm transition-all ${p.is_verified ? 'bg-emerald-500 text-white shadow-emerald-100' : 'bg-slate-100 text-slate-400'}`}>
                          {p.is_verified ? 'Đã xác minh' : 'Chờ duyệt'}
                        </button>
                      </td>
                      <td className="p-6 text-right">
                        <button onClick={() => handleDelete(p.user_id)} className="p-3 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-600 hover:text-white transition-all shadow-sm">🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'resets' && (
            <div className="grid gap-6">
              {resetRequests.map(req => (
                <div key={req.id} className="bg-white p-8 rounded-[2.5rem] border-2 border-amber-100 flex flex-col md:flex-row justify-between items-center gap-8 shadow-lg shadow-amber-50">
                   <div className="flex-1 text-center md:text-left">
                     <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2 block">Yêu cầu Reset mật khẩu</span>
                     <div className="font-black text-[#0a2647] text-2xl">{req.profiles?.display_name || 'Thành viên'}</div>
                     <div className="mt-4 p-5 bg-amber-50 rounded-2xl border border-amber-200 inline-block">
                        <p className="text-[9px] font-black text-amber-600 uppercase mb-1">Mã OTP bảo mật:</p>
                        <span className="text-4xl font-black text-amber-600 tracking-[0.3em]">{req.otp}</span>
                     </div>
                   </div>
                   <div className="w-full md:w-72 space-y-4">
                      <input type="text" placeholder="Nhập mật khẩu mới..." onChange={e => setNewPasswords({...newPasswords, [req.id]: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-amber-400 focus:bg-white transition-all" />
                      <button onClick={() => handleResetPassword(req.id, req.user_id)} className="w-full py-4 bg-[#0a2647] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all">Đổi & Khóa OTP</button>
                   </div>
                </div>
              ))}
              {resetRequests.length === 0 && <div className="py-24 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-100 text-slate-300 font-bold uppercase tracking-widest text-xs">Hiện không có yêu cầu reset mật khẩu nào.</div>}
            </div>
          )}

          {activeTab === 'live_sync' && (
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <h3 className="text-xl font-black text-[#0a2647] uppercase italic mb-4">Trình quản lý Live Sync</h3>
                <p className="text-sm text-slate-500 font-medium mb-6">
                  Hệ thống tự động đồng bộ tỉ số từ API-Football và OpenLigaDB.
                  Để kích hoạt đồng bộ tự động, bạn cần mở trang <strong>Xem chung</strong> của trận đấu đang diễn ra.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Trạng thái API</div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                      <span className="font-black text-[#0a2647] uppercase text-sm">Kết nối ổn định</span>
                    </div>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tự động Chốt điểm</div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="font-black text-[#0a2647] uppercase text-sm">Bật (Auto-Settle)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-50 bg-slate-50/30">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Các trận đang giám sát</h4>
                </div>
                <div className="divide-y divide-slate-50">
                  {matches.filter(m => m.status === 'LIVE' || m.status === 'SCHEDULED').slice(0, 5).map(m => (
                    <div key={m.id} className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-lg">⚽</div>
                        <div>
                          <div className="font-black text-[#0a2647] uppercase text-sm italic">{m.team_a} vs {m.team_b}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase">{m.status} • {m.score_a ?? 0}-{m.score_b ?? 0}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => window.open(`/match/${m.id}`, '_blank')}
                        className="px-4 py-2 bg-[#0a2647] text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-md"
                      >
                        Mở Sync Hub
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
