
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
  const [teams, setTeams] = useState<any[]>([])
  const [profiles, setAllProfiles] = useState<any[]>([])
  const [resetRequests, setResetRequests] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<AdminTab>('matches')

  const [settling, setSettling] = useState<Record<number, boolean>>({})
  const [results, setResults] = useState<Record<number, any>>({})
  const [error, setError] = useState('')

  // State for score inputs in the matches tab
  const [scoreInputs, setScoreInputs] = useState<Record<number, { a: number | ''; b: number | '' }>>({})
  // State for editing real names
  const [editingNames, setEditingNames] = useState<Record<string, string>>({})
  // State for new passwords in reset tab
  const [newPasswords, setNewPasswords] = useState<Record<string, string>>({})

  const loadData = async () => {
    try {
      const [m, tRows, pRows, rRows] = await Promise.all([
        api.fetchMatches(),
        api.fetchTeams(),
        api.fetchAllProfiles(),
        api.fetchPasswordResetRequests()
      ])
      setMatches(m || [])
      setTeams(tRows || [])
      setAllProfiles(pRows || [])
      setResetRequests(rRows || [])

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
    } catch (e: any) {
      setError(e.message)
    }
  }

  useEffect(() => {
    if (isAdmin) loadData()
  }, [isAdmin])

  const handleSettle = async (matchId: number) => {
    const input = scoreInputs[matchId]
    if (input.a === '' || input.b === '') {
      alert("Please enter both scores.")
      return
    }

    setSettling(prev => ({ ...prev, [matchId]: true }))
    try {
      const res = await api.settleMatch(matchId, input.a as number, input.b as number)
      setResults(prev => ({ ...prev, [matchId]: res }))

      const currentMatch = matches.find(m => m.id === matchId)
      if (currentMatch) {
        const finishedMatch = { ...currentMatch, status: 'FINISHED', score_a: input.a, score_b: input.b }
        const winner = getMatchWinner(finishedMatch)
        const loser = getMatchLoser(finishedMatch)

        const winnerDest = KNOCKOUT_PROGRESSION_MAP[`W${matchId}`]
        if (winnerDest && winner) {
          await api.updateMatchTeam(winnerDest.matchId, winnerDest.side, winner.id, winner.name)
        }

        const loserDest = KNOCKOUT_PROGRESSION_MAP[`L${matchId}`]
        if (loserDest && loser) {
          await api.updateMatchTeam(loserDest.matchId, loserDest.side, loser.id, loser.name)
        }
      }
      loadData()
    } catch (e: any) {
      alert(t('adminSettleFailed') + ': ' + e.message)
    } finally {
      setSettling(prev => ({ ...prev, [matchId]: false }))
    }
  }

  const handleVerify = async (userId: string, status: boolean) => {
    try {
      const currentRealName = editingNames[userId]
      await api.verifyUserProfile(userId, status, currentRealName)
      alert(status ? 'User verified!' : 'Verification removed.')
      loadData()
    } catch (e: any) {
      alert(e.message)
    }
  }

  const handleUpdateRealName = async (userId: string) => {
    try {
      const newName = editingNames[userId]
      await api.verifyUserProfile(userId, profiles.find(p => p.user_id === userId)?.is_verified || false, newName)
      alert('Real name updated!')
      loadData()
    } catch (e: any) {
      alert(e.message)
    }
  }

  const handleResetPassword = async (requestId: string, userId: string) => {
    const newPass = newPasswords[requestId]
    if (!newPass || newPass.length < 6) {
      alert("Password must be at least 6 characters.")
      return
    }
    if (!window.confirm("Are you sure you want to change this user's password?")) return

    try {
      await api.adminResetPassword(requestId, userId, newPass)
      alert("Password changed successfully!")
      loadData()
    } catch (e: any) {
      alert("Failed: " + e.message)
    }
  }

  const handleDelete = async (userId: string) => {
    if (!window.confirm(t('admin_deletion.confirm_delete'))) return
    try {
      await api.deleteUserByAdmin(userId)
      loadData()
    } catch (e: any) {
      alert(e.message)
    }
  }

  const handleRejectDeletion = async (userId: string) => {
    try {
      await api.rejectAccountDeletionRequest(userId)
      loadData()
    } catch (e: any) {
      alert(e.message)
    }
  }

  if (!isAdmin) return <div className="p-10 text-center font-bold text-rose-500">{t('authFailed')}</div>

  const pendingMatches = matches.filter(m => m.status !== 'FINISHED')
  const deletionRequests = profiles.filter(p => p.deletion_status === 'PENDING')

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="flex border-b border-slate-100 bg-white rounded-t-3xl overflow-hidden shadow-sm">
        <button onClick={() => setActiveTab('matches')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'matches' ? 'bg-[#0a2647] text-white' : 'text-slate-400 hover:bg-slate-50'}`}>{t('matches')}</button>
        <button onClick={() => setActiveTab('players')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'players' ? 'bg-[#0a2647] text-white' : 'text-slate-400 hover:bg-slate-50'}`}>{t('admin_panel.user_management')}</button>
        <button onClick={() => setActiveTab('resets')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'resets' ? 'bg-[#0a2647] text-white' : 'text-slate-400 hover:bg-slate-50'}`}>
           Reset Pass {resetRequests.length > 0 && <span className="ml-1 bg-amber-500 text-white px-2 py-0.5 rounded-full text-[8px]">{resetRequests.length}</span>}
        </button>
        <button onClick={() => setActiveTab('deletions')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'deletions' ? 'bg-[#0a2647] text-white' : 'text-slate-400 hover:bg-slate-50'}`}>
          Xoá Acc {deletionRequests.length > 0 && <span className="ml-1 bg-rose-500 text-white px-2 py-0.5 rounded-full text-[8px]">{deletionRequests.length}</span>}
        </button>
      </div>

      <div className="animate-in slide-in-from-bottom-2 duration-500">
        {activeTab === 'matches' && (
          <section className="glass-card bg-white p-6 md:p-10 shadow-xl border-none">
            <h2 className="text-2xl font-black text-[#0a2647] uppercase tracking-tighter italic mb-8 flex items-center gap-3">
              <span className="p-2 bg-wc-accent/10 rounded-lg text-2xl">⚙️</span>
              {t('admin_panel.settle_matches')}
            </h2>
            <div className="space-y-4">
              {pendingMatches.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                   <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">{t('admin_panel.no_pending_matches')}</p>
                </div>
              ) : (
                pendingMatches.map(m => (
                  <div key={m.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100 gap-6">
                    <div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Match #{m.id}</div>
                      <div className="font-black text-[#0a2647] text-lg uppercase italic">
                         {t(`teams.${m.team_a}`, { defaultValue: m.team_a })} vs {t(`teams.${m.team_b}`, { defaultValue: m.team_b })}
                      </div>
                      <div className="mt-4 flex items-center gap-3">
                         <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={scoreInputs[m.id]?.a ?? ''}
                            onChange={(e) => setScoreInputs({...scoreInputs, [m.id]: {...scoreInputs[m.id], a: e.target.value === '' ? '' : Number(e.target.value)}})}
                            className="w-16 px-3 py-2 bg-white border border-slate-200 rounded-xl font-black text-center text-[#0a2647] outline-none focus:ring-2 focus:ring-[#0a2647]/10"
                         />
                         <span className="font-bold text-slate-300">−</span>
                         <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={scoreInputs[m.id]?.b ?? ''}
                            onChange={(e) => setScoreInputs({...scoreInputs, [m.id]: {...scoreInputs[m.id], b: e.target.value === '' ? '' : Number(e.target.value)}})}
                            className="w-16 px-3 py-2 bg-white border border-slate-200 rounded-xl font-black text-center text-[#0a2647] outline-none focus:ring-2 focus:ring-[#0a2647]/10"
                         />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleSettle(m.id)}
                        disabled={settling[m.id] || scoreInputs[m.id]?.a === '' || scoreInputs[m.id]?.b === ''}
                        className="btn-primary py-3 px-8 text-xs uppercase tracking-widest shadow-lg disabled:opacity-30"
                      >
                        {settling[m.id] ? t('saving') : t('admin_panel.btn_settle')}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {activeTab === 'players' && (
          <section className="glass-card bg-white p-6 md:p-10 shadow-xl border-none">
            <h2 className="text-2xl font-black text-[#0a2647] uppercase tracking-tighter italic mb-8 flex items-center gap-3">
              <span className="p-2 bg-blue-50 rounded-lg text-2xl">👥</span>
              {t('admin_panel.user_management')}
            </h2>
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    <th className="px-4 py-2">Player</th>
                    <th className="px-4 py-2">Real Name (Editable)</th>
                    <th className="px-4 py-2 text-center">Status</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map(p => (
                    <tr key={p.user_id} className="bg-slate-50/50 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4 rounded-l-2xl border-y border-l border-slate-100">
                        <div className="font-black text-[#0a2647]">{p.display_name || p.username}</div>
                        <div className="text-[10px] text-slate-400 font-bold">{p.username}</div>
                      </td>
                      <td className="px-4 py-4 border-y border-slate-100">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingNames[p.user_id] || ''}
                            onChange={(e) => setEditingNames({...editingNames, [p.user_id]: e.target.value})}
                            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-[#0a2647] outline-none focus:ring-2 focus:ring-[#0a2647]/10 w-48"
                          />
                          <button
                            onClick={() => handleUpdateRealName(p.user_id)}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md transition-all"
                            title="Update name only"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-4 border-y border-slate-100 text-center">
                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${p.is_verified ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                          {p.is_verified ? t('verificationVerified') : t('verificationPending')}
                        </span>
                      </td>
                      <td className="px-4 py-4 rounded-r-2xl border-y border-r border-slate-100 text-right">
                        <div className="flex justify-end gap-2">
                          {!p.is_verified ? (
                            <button onClick={() => handleVerify(p.user_id, true)} className="px-3 py-1.5 bg-emerald-500 text-white text-[10px] font-black uppercase rounded-lg shadow-lg shadow-emerald-200 hover:scale-105 transition-all">Verify</button>
                          ) : (
                            <button onClick={() => handleVerify(p.user_id, false)} className="px-3 py-1.5 bg-slate-200 text-slate-500 text-[10px] font-black uppercase rounded-lg hover:bg-slate-300 transition-all">Revoke</button>
                          )}
                          <button onClick={() => handleDelete(p.user_id)} className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'resets' && (
          <section className="glass-card bg-white p-6 md:p-10 shadow-xl border-none">
            <h2 className="text-2xl font-black text-[#0a2647] uppercase tracking-tighter italic mb-8 flex items-center gap-3">
              <span className="p-2 bg-amber-50 rounded-lg text-2xl">🔐</span>
              Password Reset Requests
            </h2>
            <div className="space-y-4">
              {resetRequests.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-3xl text-slate-300 italic text-sm">No pending reset requests.</div>
              ) : (
                resetRequests.map(req => (
                  <div key={req.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 border border-amber-100 bg-amber-50/20 rounded-2xl gap-6">
                    <div className="flex-1">
                      <div className="font-black text-slate-800">{req.profiles?.display_name || req.profiles?.username}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Real Name: {req.profiles?.real_name || '---'}</div>
                      <div className="mt-4 p-4 bg-white border border-amber-200 rounded-xl inline-block">
                         <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Mã OTP của họ là:</span>
                         <span className="text-2xl font-black text-amber-600 tracking-[0.2em]">{req.otp}</span>
                      </div>
                    </div>
                    <div className="w-full md:w-64 space-y-3">
                      <input
                        type="text"
                        placeholder="Mật khẩu mới (6+ ký tự)"
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none text-sm font-bold"
                        onChange={(e) => setNewPasswords({...newPasswords, [req.id]: e.target.value})}
                      />
                      <button
                        onClick={() => handleResetPassword(req.id, req.user_id)}
                        className="w-full py-3 bg-[#0a2647] text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg hover:scale-[1.02] transition-all"
                      >
                        Đổi Mật Khẩu & Chốt
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {activeTab === 'deletions' && (
          <section className="glass-card bg-white p-6 md:p-10 shadow-xl border-none">
            <h2 className="text-2xl font-black text-[#0a2647] uppercase tracking-tighter italic mb-8 flex items-center gap-3">
              <span className="p-2 bg-rose-50 rounded-lg text-2xl">⚠️</span>
              {t('admin_deletion.title')}
            </h2>
            <div className="space-y-4">
              {deletionRequests.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-3xl text-slate-300 italic text-sm">{t('admin_deletion.no_requests')}</div>
              ) : (
                deletionRequests.map(req => (
                  <div key={req.user_id} className="flex flex-col md:flex-row md:items-center justify-between p-6 border border-rose-100 bg-rose-50/30 rounded-2xl gap-6">
                    <div>
                      <div className="font-black text-slate-800">{req.display_name || req.username}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">ID: {req.user_id}</div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => handleDelete(req.user_id)} className="px-6 py-3 bg-rose-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-rose-200 hover:scale-105 transition-all">{t('admin_deletion.approve')}</button>
                      <button onClick={() => handleRejectDeletion(req.user_id)} className="px-6 py-3 bg-white text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-xl border border-slate-200 hover:bg-slate-50 transition-all">{t('admin_deletion.reject')}</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
