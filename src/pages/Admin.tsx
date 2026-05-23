import React, { useEffect, useState } from 'react'
import { DateTime } from 'luxon'
import { useTranslation } from 'react-i18next'
import * as api from '../lib/api'
import { getFlagUrl } from '../lib/flags'

export default function AdminPage() {
  const { t, i18n } = useTranslation()
  const [matches, setMatches] = useState<any[]>([])
  const [editing, setEditing] = useState<Record<number, { a: number | '', b: number | '' }>>({})
  const [results, setResults] = useState<any[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let chan: any
    api.fetchMatches().then((rows: any[]) => setMatches(rows || [])).catch(console.error)
    chan = api.subscribeMatches((payload: any) => {
      const record = payload.new ?? payload.record
      if (!record) return
      setMatches((current) => {
        const next = current.filter((m) => m.id !== record.id)
        next.push(record)
        return next.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      })
    })
    return () => { chan?.unsubscribe?.() }
  }, [])

  const setScore = (id: number, side: 'a' | 'b', value: string) => {
    setEditing((s) => ({ ...s, [id]: { ...(s[id] || { a: '', b: '' }), [side]: value === '' ? '' : Number(value) } }))
  }

  const handleSettle = async (match: any) => {
    const edit = editing[match.id]
    const scoreA = edit?.a ?? match.score_a
    const scoreB = edit?.b ?? match.score_b
    if (scoreA === '' || scoreB === '' || scoreA === null || scoreB === null || scoreA === undefined || scoreB === undefined) return
    setError('')
    try {
      const settled = await api.settleMatch(match.id, scoreA as number, scoreB as number)
      setResults(settled || [])
    } catch (e: any) {
      console.error(e)
      setError(e.message || t('adminSettleFailed'))
    }
  }

  const handleReset = async (match: any) => {
    setError('')
    try {
      await api.resetMatch(match.id)
      setResults(null)
      setEditing((current) => {
        const next = { ...current }
        delete next[match.id]
        return next
      })
    } catch (e: any) {
      console.error(e)
      setError(e.message || t('adminResetFailed'))
    }
  }

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 md:p-8">
        <h2 className="text-2xl font-black text-[#0a2647] uppercase tracking-tight italic mb-6 border-b border-slate-100 pb-4">
          {t('adminSettleTitle')}
        </h2>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-bold uppercase tracking-wider">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {matches.map((m) => {
            const flagA = getFlagUrl(m.team_a)
            const flagB = getFlagUrl(m.team_b)

            return (
              <div key={m.id} className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-2xl gap-4 hover:border-slate-200 transition-all">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <img src={flagA || ''} alt="" className="w-5 h-3.5 object-cover rounded-sm ring-1 ring-slate-200" />
                      <span className="font-bold text-[#0a2647] text-lg">{m.team_a}</span>
                    </div>
                    <span className="text-slate-400 font-medium italic">vs</span>
                    <div className="flex items-center gap-2">
                      <img src={flagB || ''} alt="" className="w-5 h-3.5 object-cover rounded-sm ring-1 ring-slate-200" />
                      <span className="font-bold text-[#0a2647] text-lg">{m.team_b}</span>
                    </div>
                  </div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                    {DateTime.fromISO(m.start_time).setLocale(i18n.language).toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY)} • {m.venue}
                  </div>
                  {m.status === 'FINISHED' && (
                    <div className="mt-2 inline-block px-3 py-1 bg-emerald-50 rounded-full text-[10px] font-black text-emerald-600 uppercase tracking-widest border border-emerald-100">
                      {t('finalScore')}: {m.score_a} - {m.score_b}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    <input
                      type="number"
                      min={0}
                      placeholder="A"
                      value={editing[m.id]?.a ?? m.score_a ?? ''}
                      onChange={(e) => setScore(m.id, 'a', e.target.value)}
                      className="w-14 p-2 bg-white border border-slate-200 rounded-lg text-center font-bold text-[#0a2647] focus:border-[#0a2647] outline-none"
                    />
                    <input
                      type="number"
                      min={0}
                      placeholder="B"
                      value={editing[m.id]?.b ?? m.score_b ?? ''}
                      onChange={(e) => setScore(m.id, 'b', e.target.value)}
                      className="w-14 p-2 bg-white border border-slate-200 rounded-lg text-center font-bold text-[#0a2647] focus:border-[#0a2647] outline-none"
                    />
                  </div>
                  <button className="btn-primary px-4 text-xs" onClick={() => handleSettle(m)}>
                    {t('settle')}
                  </button>
                  {m.status === 'FINISHED' && (
                    <button className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" onClick={() => handleReset(m)} title={t('reset')}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {results && (
        <div className="glass-card p-6 md:p-8 animate-in slide-in-from-bottom duration-500">
          <h3 className="text-xl font-black text-[#0a2647] uppercase tracking-tight italic mb-6">{t('settlementResults')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {results.map((r) => {
              const uid = r.user_id ?? r.out_user_id
              const pts = r.points ?? r.out_points
              return (
                <div key={uid} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider truncate mr-2">{uid.substring(0, 8)}</span>
                  <strong className="text-[#0a2647] font-black">{pts} {t('pointsShort')}</strong>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
