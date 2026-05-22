import React from 'react'

export default function WorldCupMark({ className = '', size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'sm' ? 'h-9 w-7' : size === 'lg' ? 'h-24 w-16' : 'h-12 w-9'

  return (
    <img
      src="/images/wc.png"
      alt="FIFA World Cup"
      className={`${sizeClass} shrink-0 object-contain drop-shadow ${className}`}
      loading="lazy"
    />
  )
}
