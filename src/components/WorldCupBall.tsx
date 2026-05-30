
import React from 'react'

interface WorldCupBallProps {
  className?: string
  size?: number
  animate?: 'spin' | 'bounce' | 'none'
}

export default function WorldCupBall({ className = '', size = 40, animate = 'none' }: WorldCupBallProps) {
  const animationClass =
    animate === 'spin' ? 'animate-spin-slow' :
    animate === 'bounce' ? 'animate-bounce-slow' :
    ''

  return (
    <img
      src="/images/ball.png"
      alt="Official Tri-Onda WC26 Ball"
      className={`object-contain pointer-events-none select-none drop-shadow-lg ${animationClass} ${className}`}
      style={{ width: size, height: size }}
    />
  )
}
