
import React, { useState, useEffect, useRef } from 'react'
import { DateTime } from 'luxon'
import { useTranslation } from 'react-i18next'
import { getFlagUrl } from '../lib/flags'
import WorldCupBall from './WorldCupBall'
import { useTimer } from '../context/TimerProvider'

interface ConfettiData {
  id: number;
  color: string;
  left: string;
  delay: string;
  xSpread: string;
}

function ConfettiPiece({ color, left, delay, xSpread }: Omit<ConfettiData, 'id'>) {
  return (
    <div
      className="absolute bottom-[-10px] w-2 h-2 rounded-sm animate-confetti-burst z-[5] pointer-events-none"
      style={{
        backgroundColor: color,
        left: left,
        animationDelay: delay,
        '--x-spread': xSpread,
        transition: 'none'
      } as React.CSSProperties}
    />
  )
}

export default function CountdownTimer({ targetDate, teamA, teamB }: { targetDate: string; teamA: string; teamB: string }) {
  const { t } = useTranslation()
  const now = useTimer()
  const [confettiList, setConfettiList] = useState<ConfettiData[]>([])
  const lastFiredMinute = useRef<number | null>(null)

  const confettiColors = ['#f59e0b', '#00d4ff', '#ef3340', '#006341', '#ffffff']

  const target = DateTime.fromISO(targetDate)
  const diff = target.diff(now, ['days', 'hours', 'minutes', 'seconds']).toObject()
  const isPast = diff.seconds && diff.seconds < 0

  const m = Math.floor(diff.minutes || 0)
  const s = Math.floor(diff.seconds || 0)

  useEffect(() => {
    if (isPast) return

    // Trigger confetti burst with STABLE data
    if (s === 0 && lastFiredMinute.current !== m) {
      lastFiredMinute.current = m

      // Generate particles centered at 50%
      const newParticles: ConfettiData[] = Array.from({ length: 40 }).map((_, i) => ({
        id: Date.now() + i,
        color: confettiColors[i % confettiColors.length],
        left: `50%`, // Always start from center
        delay: `${Math.random() * 0.4}s`,
        xSpread: `${(Math.random() - 0.5) * 350}px` // Wider spread for the burst
      }))

      setConfettiList(newParticles)
      setTimeout(() => setConfettiList([]), 5000)
    }
  }, [s, m, isPast])

  if (isPast) return null

  const timeLeft = { d: Math.floor(diff.days || 0), h: Math.floor(diff.hours || 0), m, s }

  const localizedTeamA = t(`teams.${teamA}`, { defaultValue: teamA })
  const localizedTeamB = t(`teams.${teamB}`, { defaultValue: teamB })

  const TimeUnit = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center bg-white/10 backdrop-blur-md rounded-2xl p-3 md:p-4 min-w-[70px] md:min-w-[90px] border border-white/10 shadow-lg">
      <span className="text-2xl md:text-4xl font-black text-white tracking-tighter">{String(value).padStart(2, '0')}</span>
      <span className="text-[8px] md:text-[10px] font-black text-wc-accent uppercase tracking-widest mt-1">{label}</span>
    </div>
  )

  return (
    <div className="relative bg-[#0a2647] rounded-[2.5rem] p-6 md:p-10 shadow-2xl border border-white/5 group overflow-hidden">

      {/* Stable Gravity Confetti Burst */}
      {confettiList.map((p) => (
        <ConfettiPiece
          key={p.id}
          color={p.color}
          left={p.left}
          delay={p.delay}
          xSpread={p.xSpread}
        />
      ))}

      {/* Internal Content */}
      <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden rounded-[2.5rem]">
         <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-wc-accent/20 via-transparent to-transparent"></div>
         {/* Official Tri-Onda Ball Illustration */}
         <WorldCupBall size={180} animate="spin" className="absolute -right-10 -bottom-10 opacity-30" />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <div className="flex items-center gap-3 mb-6 px-4 py-1.5 bg-white/5 rounded-full border border-white/10">
          <span className="animate-pulse w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.8)]"></span>
          <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">{t('nextMatchCountdown')}</span>
        </div>

        <div className="flex items-center gap-4 md:gap-8 mb-10 w-full justify-center px-2">
          <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
             <img src={getFlagUrl(teamA) || ''} className="h-8 md:h-12 w-12 md:w-18 object-cover rounded-md shadow-xl ring-2 ring-white/10" alt="" />
             <span className="text-white font-black text-xs md:text-xl truncate w-full text-center uppercase tracking-tighter">{localizedTeamA}</span>
          </div>

          <div className="text-3xl md:text-5xl font-black text-white/20 italic tracking-tighter shrink-0">VS</div>

          <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
             <img src={getFlagUrl(teamB) || ''} className="h-8 md:h-12 w-12 md:w-18 object-cover rounded-md shadow-xl ring-2 ring-white/10" alt="" />
             <span className="text-white font-black text-xs md:text-xl truncate w-full text-center uppercase tracking-tighter">{localizedTeamB}</span>
          </div>
        </div>

        <div className="flex gap-2 md:gap-4 overflow-x-auto no-scrollbar pb-1">
          <TimeUnit value={timeLeft.d} label={t('days')} />
          <TimeUnit value={timeLeft.h} label={t('hours')} />
          <TimeUnit value={timeLeft.m} label={t('minutes')} />
          <TimeUnit value={timeLeft.s} label={t('seconds')} />
        </div>
      </div>
    </div>
  )
}
