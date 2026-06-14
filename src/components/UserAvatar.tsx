import React from 'react'

export default function UserAvatar({ name, avatarUrl, className = '' }: { name: string; avatarUrl?: string | null; className?: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || 'U'

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`h-9 w-9 rounded-full object-cover ring-2 ring-white/40 ${className}`}
        loading="lazy"
        crossOrigin="anonymous"
        onError={(e) => {
          // If CORS fails, try loading without crossOrigin (image won't be captureable but will show)
          const target = e.target as HTMLImageElement;
          if (target.crossOrigin) {
            target.removeAttribute('crossOrigin');
            target.src = avatarUrl;
          }
        }}
      />
    )
  }

  return (
    <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-sm font-bold ring-2 ring-white/30 ${className}`}>
      {initial}
    </span>
  )
}
