
import React, { useState } from 'react'

interface WorldCupBallProps {
  className?: string
  size?: number
  animate?: 'spin' | 'bounce' | 'vs-pulse' | 'none'
}

export default function WorldCupBall({ className = '', size = 40, animate = 'none' }: WorldCupBallProps) {
  const [error, setError] = useState(false)
  const animationClass =
    animate === 'spin' ? 'animate-spin-slow' :
    animate === 'bounce' ? 'animate-bounce-slow' :
    animate === 'vs-pulse' ? 'animate-vs-pulse' :
    ''

  if (error) {
    return (
      <span
        className={`flex items-center justify-center pointer-events-none select-none ${animationClass} ${className}`}
        style={{ fontSize: size * 0.8 }}
      >
        ⚽
      </span>
    )
  }

  return (
    <img
      src="/images/ball.png"
      alt="World Cup 2026 Ball"
      className={`object-contain pointer-events-none select-none drop-shadow-lg ${animationClass} ${className}`}
      style={{ width: size, height: size }}
      onError={() => setError(true)}
    />
  )
}
