
import React, { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import * as api from '../lib/api'
import { useAuth } from '../context/AuthProvider'
import { calculateStandings, sortGroupStandings, KNOCKOUT_PROGRESSION_MAP, getMatchWinner, getMatchLoser } from '../lib/standings'

type AdminTab = 'matches' | 'players' | 'resets' | 'deletions'

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
      // Load Matches
      const m = await api.fetchMatches().catch(e => { console.error(e); return [] })
      setMatches(m || [])
      const inputs: Record<number, { a: number | ''; b: number | '' }> = {}
      m?.forEach((match: any) => {
        inputs[match.id] = {
          a: match.score_a !== null ? match.score_a : '',
          b: match.score_b !== null ? match.score_b : ''
        }
      })
      setScoreInputs(inputs)

      // Load Profiles
      const pRows = await api.fetchAllProfiles().catch(e => { console.error(e); return [] })
      setAllProfiles(pRows || [])
      const names: Record<string, string> = {}
      pRows.forEach((p: any) => {
        names[p.user_id] = p.real_name || ''
      })
      setEditingNames(names)

      // Load Resets
      const rRows = await api.fetchPasswordResetRequests().catch(e => { console.error(e); return [] })
      setResetRequests(rRows || [])

      if (m.length === 0 && pRows.length === 0) {
        setError("Dữ liệu trống hoặc lỗi quyền truy cập (RLS).")
      }
    } catch (e: any) {
      setError(e.message)
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
        const winner = getMatchWinner({ ...currentMatch, status: 'FINISHED', score_a: input.a, score_b: input.b })
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
      alert('Đã cập nhật tên!')
      loadData()
    } catch (e: any) { alert(e.message) }
  }

  const handleResetPassword = async (requestId: string, userId: string) => {
    const newPass = newPasswords[requestId]
    if (!newPass || newPass.length < 6) return alert("Mật khẩu ít nhất 6 ký tự")
    try {
      await api.adminResetPassword(requestId, userId, newPass)
      alert("Thành công!")
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
      {/* TABS HEADER */}
      <div className="flex border-b border-slate-100 bg-white rounded-t-[2rem] overflow-hidden shadow-sm">
        <button onClick={() => setActiveTab('matches')} className={`flex-1 py-5 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'matches' ? 'bg-[#0a2647] text-white' : 'text-slate-400 hover:bg-slate-50'}`}>{t('matches')}</button>
        <button onClick={() => setActiveTab('players')} className={`flex-1 py-5 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'players' ? 'bg-[#0a2647] text-white' : 'text-slate-400 hover:bg-slate-50'}`}>{t('admin_panel.user_management')}</button>
        <button onClick={() => setActiveTab('resets')} className={`flex-1 py-5 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'resets' ? 'bg-[#0a2647] text-white' : 'text-slate-400 hover:bg-slate-50'}`}>OTP {resetRequests.length > 0 && `(${resetRequests.length})`}</button>
        <button onClick={() => setActiveTab('deletions')} className={`flex-1 py-5 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'deletions' ? 'bg-[#0a2647] text-white' : 'text-slate-400 hover:bg-slate-50'}`}>Xoá {deletionRequests.length > 0 && `(${deletionRequests.length})`}</button>
      </div>

      {error && <div className="p-4 bg-rose-50 text-rose-600 rounded-xl font-bold text-xs border border-rose-100">{error}</div>}
      {loading && <div className="py-20 text-center animate-pulse text-slate-400 font-black uppercase tracking-widest text-xs">Đang tải dữ liệu...</div>}

      {!loading && (
        <div className="animate-in slide-in-from-bottom-2 duration-500">
          {activeTab === 'matches' && (
            <div className="grid gap-4">
              {pendingMatches.map(m => (
                <div key={m.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
                  <div className="text-center md:text-left">
                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Match #{m.id}</span>
                    <div className="font-black text-[#0a2647] uppercase italic mt-1">{t(`teams.${m.team_a}`, {defaultValue: m.team_a})} vs {t(`teams.${m.team_b}`, {defaultValue: m.team_b})}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <input type="number" value={scoreInputs[m.id]?.a ?? ''} onChange={e => setScoreInputs({...scoreInputs, [m.id]: {...scoreInputs[m.id], a: e.target.value === '' ? '' : Number(e.target.value)}})} className="w-14 h-12 text-center font-black bg-slate-50 rounded-xl border border-slate-100" placeholder="0" />
                    <span className="text-slate-300 font-bold">−</span>
                    <input type="number" value={scoreInputs[m.id]?.b ?? ''} onChange={e => setScoreInputs({...scoreInputs, [m.id]: {...scoreInputs[m.id], b: e.target.value === '' ? '' : Number(e.target.value)}})} className="w-14 h-12 text-center font-black bg-slate-50 rounded-xl border border-slate-100" placeholder="0" />
                    <button onClick={() => handleSettle(m.id)} disabled={settling[m.id] || scoreInputs[m.id]?.a === ''} className="btn-primary px-6 h-12 uppercase text-[10px] tracking-widest ml-2">{settling[m.id] ? '...' : 'Settle'}</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'players' && (
            <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-[8px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="p-5">Người chơi</th>
                    <th className="p-5 text-center">Xác minh</th>
                    <th className="p-5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {profiles.map(p => (
                    <tr key={p.user_id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="p-5">
                        <div className="font-black text-[#0a2647]">{p.display_name || p.username}</div>
                        <input type="text" value={editingNames[p.user_id] || ''} onChange={e => setEditingNames({...editingNames, [p.user_id]: e.target.value})} className="mt-2 w-full max-w-xs bg-slate-100/50 border border-slate-200 rounded-lg px-3 py-1.5 text-[10px] font-bold outline-none focus:bg-white" placeholder="Sửa tên thật..." />
                        <button onClick={() => handleUpdateRealName(p.user_id)} className="text-[8px] font-black text-blue-500 uppercase mt-1 ml-1 hover:underline">Lưu tên</button>
                      </td>
                      <td className="p-5 text-center">
                        <button onClick={() => handleVerify(p.user_id, !p.is_verified)} className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${p.is_verified ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                          {p.is_verified ? 'Verified' : 'Pending'}
                        </button>
                      </td>
                      <td className="p-5 text-right">
                        <button onClick={() => handleDelete(p.user_id)} className="p-2 text-rose-300 hover:text-rose-600 transition-colors">🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'resets' && (
             <div className="grid gap-4">
               {resetRequests.map(req => (
                 <div key={req.id} className="bg-white p-6 rounded-[2rem] border border-amber-100 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
                    <div className="flex-1">
                      <div className="font-black text-[#0a2647]">{req.profiles?.display_name || 'User'}</div>
                      <div className="mt-2 text-2xl font-black text-amber-500 tracking-widest">{req.otp}</div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                      <input type="text" placeholder="Pass mới..." onChange={e => setNewPasswords({...newPasswords, [req.id]: e.target.value})} className="flex-1 md:w-40 px-4 h-12 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm" />
                      <button onClick={() => handleResetPassword(req.id, req.user_id)} className="bg-[#0a2647] text-white px-6 h-12 rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg">Đổi</button>
                    </div>
                 </div>
               ))}
             </div>
          )}
        </div>
      )}
    </div>
  )
}
