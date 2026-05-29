
import React, { useState, useRef, useEffect } from 'react'

export default function FloatingMusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const togglePlay = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch(e => {
        console.error("Playback failed:", e)
      })
    }
    setIsPlaying(!isPlaying)
  }

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <audio
        ref={audioRef}
        src="/audio/One More Goal.mp3"
        loop
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      <button
        onClick={togglePlay}
        className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 group relative overflow-hidden ${
          isPlaying
            ? 'bg-[#0a2647] text-wc-gold ring-4 ring-wc-gold/20'
            : 'bg-white text-slate-400 hover:text-[#0a2647] border border-slate-100'
        }`}
      >
        {/* Animated Sound Bars when playing */}
        {isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center gap-0.5 opacity-20 pointer-events-none">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="w-1 bg-wc-gold rounded-full animate-bounce"
                style={{ height: '60%', animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        )}

        {/* Play/Pause Icon */}
        <div className={`relative z-10 transition-transform duration-500 ${isPlaying ? 'scale-110 rotate-[360deg]' : 'scale-100 rotate-0'}`}>
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          )}
        </div>

        {/* Tooltip */}
        <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-[#0a2647] text-white text-[10px] font-black px-3 py-1.5 rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all pointer-events-none shadow-xl border border-wc-gold/30">
          {isPlaying ? 'PAUSE MUSIC' : 'PLAY WORLD CUP SONG'}
        </div>
      </button>
    </div>
  )
}
