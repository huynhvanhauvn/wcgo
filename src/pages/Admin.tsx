
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as api from '../lib/api'
import { useAuth } from '../context/AuthProvider'

export default function AdminPage() {
  const { t } = useTranslation()
  const { isAdmin } = useAuth()
  const [matches, setMatches] = useState<any[]>([])
  const [settling, setSettling] = useState<Record<number, boolean>>({})
  const [results, setResults] = useState<Record<number, any>>({})
  const [error, setError] = useState('')

  const [deletionRequests, setDeletionRequests] = useState<any[]>([])

  const loadData = async () => {
    try {
      const all = await api.fetchMatches()
      // Only show matches that need settling (have scores but not marked FINISHED)
      // or are already finished for resetting.
      setMatches(all || [])

      const reqs = await api.fetchDeletionRequests()
      setDeletionRequests(reqs || [])
    } catch (e: any) {
      setError(e.message)
    }
  }

  useEffect(() => {
    if (isAdmin) loadData()
  }, [isAdmin])

  const handleSettle = async (matchId: number) => {
    setSettling(prev => ({ ...prev, [matchId]: true }))
    try {
      const res = await api.settleMatch(matchId)
      setResults(prev => ({ ...prev, [matchId]: res }))
      loadData()
    } catch (e: any) {
      alert(t('adminSettleFailed') + ': ' + e.message)
    } finally {
      setSettling(prev => ({ ...prev, [matchId]: false }))
    }
  }

  const handleReset = async (matchId: number) => {
    if (!window.confirm(t('adminResetFailed') + '?')) return
    try {
      await api.resetMatch(matchId)
      loadData()
    } catch (e: any) {
      alert(e.message)
    }
  }

  const handleApproveDeletion = async (userId: string) => {
    if (!window.confirm(t('admin_deletion.confirm_delete'))) return
    try {
      await api.deleteUserAccount(userId)
      loadData()
    } catch (e: any) {
      alert(e.message)
    }
  }

  const handleRejectDeletion = async (userId: string) => {
    try {
      await api.rejectDeletionRequest(userId)
      loadData()
    } catch (e: any) {
      alert(e.message)
    }
  }

  if (!isAdmin) return <div className="p-10 text-center font-bold text-rose-500">{t('authFailed')}</div>

  const pendingMatches = matches.filter(m => m.status !== 'FINISHED' && m.score_a !== null && m.score_b !== null)

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <section className="glass-card bg-white p-6 md:p-10 shadow-xl border-none">
        <h2 className="text-3xl font-black text-[#0a2647] uppercase tracking-tighter italic mb-8 flex items-center gap-3">
          <span className="p-2 bg-wc-accent/10 rounded-lg text-2xl">⚙️</span>
          {t('admin_panel.settle_matches')}
        </h2>

        {error && <div className="p-4 bg-rose-50 text-rose-600 rounded-xl mb-6 font-bold text-sm border border-rose-100">{error}</div>}

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
                  <div className="mt-2 inline-block px-3 py-1 bg-[#0a2647] text-white rounded-lg font-black text-sm">
                    {m.score_a} - {m.score_b}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {results[m.id] ? (
                    <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 flex items-center gap-2">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                       {results[m.id].settledCount} {t('admin_panel.btn_results')}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSettle(m.id)}
                      disabled={settling[m.id]}
                      className="btn-primary min-w-[120px] py-3 text-xs uppercase tracking-widest shadow-lg"
                    >
                      {settling[m.id] ? t('saving') : t('admin_panel.btn_settle')}
                    </button>
                  )}
                  <button
                    onClick={() => handleReset(m.id)}
                    className="px-4 py-3 bg-white text-slate-400 font-black text-xs uppercase tracking-widest rounded-xl border border-slate-200 hover:bg-slate-50 transition-all"
                  >
                    {t('admin_panel.btn_reset')}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="glass-card bg-white p-6 md:p-10 shadow-xl border-none">
        <h2 className="text-2xl font-black text-[#0a2647] uppercase tracking-tighter italic mb-8 flex items-center gap-3">
          <span className="p-2 bg-rose-50 rounded-lg text-2xl">⚠️</span>
          {t('admin_deletion.title')}
        </h2>

        <div className="space-y-4">
          {deletionRequests.length === 0 ? (
            <div className="py-10 text-center text-slate-300 italic text-sm">{t('admin_deletion.no_requests')}</div>
          ) : (
            deletionRequests.map(req => (
              <div key={req.user_id} className="flex flex-col md:flex-row md:items-center justify-between p-6 border border-rose-100 bg-rose-50/30 rounded-2xl gap-6">
                <div>
                  <div className="font-black text-slate-800">{req.profiles?.display_name || req.profiles?.username}</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">ID: {req.user_id}</div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleApproveDeletion(req.user_id)}
                    className="px-6 py-3 bg-rose-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-rose-200 hover:scale-105 transition-all"
                  >
                    {t('admin_deletion.approve')}
                  </button>
                  <button
                    onClick={() => handleRejectDeletion(req.user_id)}
                    className="px-6 py-3 bg-white text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-xl border border-slate-200 hover:bg-slate-50 transition-all"
                  >
                    {t('admin_deletion.reject')}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
