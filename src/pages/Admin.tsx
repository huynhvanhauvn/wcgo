import React, { useEffect, useState } from 'react'
import { DateTime } from 'luxon'
import { useTranslation } from 'react-i18next'
import * as api from '../lib/api'

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
      <div className="rounded-lg bg-white/80 p-4 shadow-md">
        <h2 className="text-xl font-semibold mb-4">{t('adminSettleTitle')}</h2>
        {error && <div className="mb-4 rounded bg-red-100 p-3 text-sm text-red-700">{error}</div>}
        <div className="space-y-3">
          {matches.map((m) => (
            <div key={m.id} className="flex items-center justify-between p-3 border rounded">
              <div>
                <div className="font-medium">
                  {m.team_a} {t('versus')} {m.team_b} - {DateTime.fromISO(m.start_time).setLocale(i18n.language).toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY)}
                </div>
                <div className="text-sm text-gray-500">{m.venue}</div>
                {m.status === 'FINISHED' && (
                  <div className="mt-1 text-sm font-medium text-emerald-700">
                    {t('finalScore')}: {m.score_a} - {m.score_b}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <input type="number" min={0} placeholder="A" value={editing[m.id]?.a ?? m.score_a ?? ''} onChange={(e) => setScore(m.id, 'a', e.target.value)} className="w-20 p-2 border rounded" />
                <input type="number" min={0} placeholder="B" value={editing[m.id]?.b ?? m.score_b ?? ''} onChange={(e) => setScore(m.id, 'b', e.target.value)} className="w-20 p-2 border rounded" />
                <button className="btn-primary" onClick={() => handleSettle(m)}>{t('settle')}</button>
                {m.status === 'FINISHED' && (
                  <button className="rounded border border-red-300 px-3 py-2 text-sm font-semibold text-red-700" onClick={() => handleReset(m)}>
                    {t('reset')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {results && (
        <div className="rounded-lg bg-white/80 p-4 shadow-md">
          <h3 className="font-semibold mb-2">{t('settlementResults')}</h3>
          <ul className="space-y-1">
            {results.map((r) => (
              <li key={r.user_id} className="flex justify-between">
                <span>{r.user_id}</span>
                <strong>{r.points} {t('pointsShort')}</strong>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
