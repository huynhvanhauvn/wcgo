
import React, { useState } from 'react'
import WorldCupBall from '../components/WorldCupBall'

export default function GatePage({ onAccessGranted }: { onAccessGranted: () => void }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)

  // SECRET_CODE: You can change this to whatever you want
  const SECRET_CODE = 'MENLOVUIVUI'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (code.toUpperCase() === SECRET_CODE.toUpperCase()) {
      localStorage.setItem('team_access_granted', 'true')
      onAccessGranted()
    } else {
      setError(true)
      setCode('')
      setTimeout(() => setError(false), 2000)
    }
  }

  return (
    <div className="fixed inset-0 z-[999999] bg-[#0a2647] flex items-center justify-center p-4 overflow-hidden text-slate-900 antialiased">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-wc-canada rounded-full blur-[120px] opacity-20"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-wc-gold rounded-full blur-[120px] opacity-10"></div>

      <div className="relative glass-card bg-white/5 border-white/10 p-8 md:p-12 max-w-md w-full text-center space-y-8 animate-in zoom-in-95 duration-500 backdrop-blur-2xl rounded-[3rem] shadow-2xl">
        <div className="flex flex-col items-center gap-4">
          <WorldCupBall size={80} animate="vs-pulse" />
          <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter italic leading-none">Arena Access Control</h1>
        </div>

        <div className="space-y-3">
          <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl">
            <p className="text-amber-400 text-sm font-black uppercase tracking-widest leading-relaxed">
              Đây là hệ thống dành riêng cho các thành viên của team
            </p>
          </div>
          <p className="text-white/40 text-[10px] font-medium uppercase tracking-[0.2em]">Vui lòng nhập mã bí mật để tiếp tục</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="SECRET CODE"
              className={`w-full bg-white/5 border-2 ${error ? 'border-rose-500 animate-shake' : 'border-white/10'} rounded-2xl py-4 px-6 text-center text-white font-black tracking-[0.5em] focus:bg-white/10 outline-none transition-all placeholder:text-white/10 placeholder:tracking-widest`}
            />
            {error && <p className="absolute -bottom-6 left-0 right-0 text-rose-500 text-[10px] font-black uppercase">Mã không chính xác!</p>}
          </div>
          <button
            type="submit"
            className="w-full py-4 bg-wc-gold text-slate-900 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-wc-gold/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            Vào Arena
          </button>
        </form>

        <p className="text-white/10 text-[8px] font-bold uppercase tracking-[0.3em] pt-4">Official World Cup 2026 Prediction System</p>
      </div>
    </div>
  )
}
