import React, { useState, useEffect } from 'react'
import { DateTime } from 'luxon'
import { useTranslation } from 'react-i18next'
import { getFlagUrl } from '../lib/flags'

interface CountdownTimerProps {
  targetDate: string
  teamA: string
  teamB: string
}

export default function CountdownTimer({ targetDate, teamA, teamB }: CountdownTimerProps) {
  const { t } = useTranslation()
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = DateTime.now()
      const target = DateTime.fromISO(targetDate)
      const diff = target.diff(now, ['days', 'hours', 'minutes', 'seconds']).toObject()

      if (target <= now) {
        return null
      }

      return {
        days: Math.floor(diff.days || 0),
        hours: Math.floor(diff.hours || 0),
        minutes: Math.floor(diff.minutes || 0),
        seconds: Math.floor(diff.seconds || 0)
      }
    }

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    setTimeLeft(calculateTimeLeft())

    return () => clearInterval(timer)
  }, [targetDate])

  if (!timeLeft) return null

  const TimeBlock = ({ label, value }: { label: string; value: number }) => (
    <div className="flex flex-col items-center bg-[#0a2647] rounded-xl p-3 min-w-[70px] shadow-lg border border-white/10">
      <span className="text-2xl md:text-3xl font-black text-white leading-none mb-1">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[10px] font-black text-wc-accent uppercase tracking-widest">{label}</span>
    </div>
  )

  const flagA = getFlagUrl(teamA)
  const flagB = getFlagUrl(teamB)

  return (
    <div className="glass-card p-6 md:p-8 border-wc-accent/30 shadow-[0_20px_50px_rgba(0,132,255,0.1)] relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-wc-accent via-wc-gold to-wc-canada animate-pulse"></div>

      <div className="flex flex-col items-center gap-6 relative z-10">
        <div className="text-center space-y-3">
          <h3 className="text-xs font-black text-[#0a2647] uppercase tracking-[0.3em]">{t('nextMatchCountdown')}</h3>

          <div className="flex items-center justify-center gap-4 md:gap-8">
            <div className="flex flex-col items-center gap-2">
              <img src={flagA || ''} alt="" className="w-10 h-7 md:w-12 md:h-8 object-cover rounded shadow-md ring-2 ring-white" />
              <span className="text-xs font-black text-[#0a2647] uppercase tracking-tighter">{teamA}</span>
            </div>

            <span className="text-xl font-black text-slate-300 italic">VS</span>

            <div className="flex flex-col items-center gap-2">
              <img src={flagB || ''} alt="" className="w-10 h-7 md:w-12 md:h-8 object-cover rounded shadow-md ring-2 ring-white" />
              <span className="text-xs font-black text-[#0a2647] uppercase tracking-tighter">{teamB}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 md:gap-4 overflow-x-auto no-scrollbar pb-1">
          <TimeBlock label={t('days')} value={timeLeft.days} />
          <TimeBlock label={t('hours')} value={timeLeft.hours} />
          <TimeBlock label={t('minutes')} value={timeLeft.minutes} />
          <TimeBlock label={t('seconds')} value={timeLeft.seconds} />
        </div>
      </div>

      <div className="absolute -right-4 -bottom-4 opacity-5 transform rotate-12 group-hover:scale-110 transition-transform duration-700">
        <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
        </svg>
      </div>
    </div>
  )
}
