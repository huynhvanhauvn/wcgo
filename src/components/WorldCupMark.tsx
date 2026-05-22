import React, { useState } from 'react'

export default function WorldCupMark({ className = '', size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const [error, setError] = useState(false)
  const sizeClass = size === 'sm' ? 'h-9 w-7' : size === 'lg' ? 'h-24 w-16' : 'h-12 w-9'

  if (error) {
    return (
      <div className={`${sizeClass} flex flex-col items-center justify-center bg-amber-500 rounded text-white font-bold text-[8px] leading-tight text-center px-1 ${className}`}>
        <span>WC</span>
        <span>2026</span>
      </div>
    )
  }

  return (
    <img
      src="/images/wc.png"
      alt="FIFA World Cup"
      className={`${sizeClass} shrink-0 object-contain drop-shadow ${className}`}
      loading="lazy"
      onError={() => setError(true)}
    />
  )
}
