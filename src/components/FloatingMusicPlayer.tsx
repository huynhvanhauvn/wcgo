
import React, { useState, useRef, useEffect } from 'react'
import WorldCupBall from './WorldCupBall'

interface Note {
  id: number;
  x: string;
  rotate: string;
  symbol: string;
}

export default function FloatingMusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [notes, setNotes] = useState<Note[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const noteCounter = useRef(0)

  useEffect(() => {
    if (!isPlaying) {
      setNotes([])
      return
    }

    const interval = setInterval(() => {
      const newNote: Note = {
        id: noteCounter.current++,
        x: `${(Math.random() - 0.5) * 60}px`,
        rotate: `${(Math.random() - 0.5) * 90}deg`,
        symbol: ['🎵', '🎶', '🎼'][Math.floor(Math.random() * 3)]
      }
      setNotes(prev => [...prev.slice(-10), newNote])
    }, 800)

    return () => clearInterval(interval)
  }, [isPlaying])

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
      <audio ref={audioRef} src="/audio/One More Goal.mp3" loop onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} />

      <div className="relative flex items-center justify-center group">
        {/* 1. Floating Musical Notes */}
        {notes.map(note => (
          <div
            key={note.id}
            className="absolute animate-float-note pointer-events-none text-xl z-0"
            style={{ '--note-x': note.x, '--note-rotate': note.rotate } as any}
          >
            {note.symbol}
          </div>
        ))}

        {/* 2. Rotating Magical Border Aura */}
        {isPlaying && (
          <div className="absolute inset-[-6px] rounded-full bg-gradient-to-tr from-wc-gold via-wc-accent to-wc-gold opacity-40 animate-spin-slow blur-sm pointer-events-none" />
        )}

        {/* 3. Outer Ping Layer */}
        {isPlaying && (
          <div className="absolute inset-0 rounded-full animate-ping bg-wc-accent/20 scale-150 pointer-events-none" />
        )}

        {/* 4. The Main FAB Button */}
        <button
          onClick={togglePlay}
          className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-[0_10px_40px_rgba(0,0,0,0.3)] transition-all duration-700 relative overflow-hidden z-10 border-2 ${
            isPlaying
              ? 'bg-[#0a2647] border-white/20 animate-magic-aura'
              : 'bg-white border-slate-100 hover:scale-110'
          }`}
        >
          {/* Official Tri-Onda Ball - High Visibility */}
          <div className={`absolute inset-0 flex items-center justify-center transition-all duration-700 pointer-events-none ${isPlaying ? 'opacity-80 scale-110 rotate-[360deg]' : 'opacity-100 scale-100'}`}>
            <WorldCupBall size={isPlaying ? 60 : 50} animate={isPlaying ? 'spin' : 'none'} />
          </div>

          {/* Play/Pause Icon Overlay - Simplified for visual clarity */}
          <div className={`relative z-30 transition-all duration-500 ${isPlaying ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
             <div className="bg-black/40 backdrop-blur-sm p-2 rounded-full border border-white/20">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
               </svg>
             </div>
          </div>

          {!isPlaying && (
             <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                <div className="bg-wc-gold/90 p-2 rounded-full shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#0a2647]" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                </div>
             </div>
          )}

          {/* Sparkles on top */}
          {isPlaying && [1, 2, 3].map(i => (
            <div
              key={i}
              className="absolute text-wc-gold animate-sparkle pointer-events-none z-40"
              style={{
                top: `${20 + Math.random() * 60}%`,
                left: `${20 + Math.random() * 60}%`,
                animationDelay: `${i * 0.4}s`,
                fontSize: '12px'
              }}
            >
              ✨
            </div>
          ))}
        </button>

        {/* Tooltip */}
        <div className="absolute right-full mr-6 top-1/2 -translate-y-1/2 bg-[#0a2647]/90 backdrop-blur-md text-white text-[10px] font-black px-4 py-2 rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all pointer-events-none shadow-2xl border border-wc-gold/30 tracking-widest translate-x-4 group-hover:translate-x-0">
          {isPlaying ? 'PAUSE MUSIC' : 'PLAY ARENA SONG'}
        </div>
      </div>
    </div>
  )
}
