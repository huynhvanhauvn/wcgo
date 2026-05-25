
import React from 'react'
import { useTranslation } from 'react-i18next'

interface LoadingScreenProps {
  message?: string
}

export default function LoadingScreen({ message }: LoadingScreenProps) {
  const { t } = useTranslation()

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-50/80 backdrop-blur-xl animate-in fade-in duration-500">
      <div className="relative">
        {/* Modern Shimmering Ring */}
        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-slate-200 border-t-[#0a2647] animate-spin shadow-2xl"></div>
        {/* Floating Ball Icon */}
        <div className="absolute inset-0 flex items-center justify-center animate-bounce-slow">
          <span className="text-3xl md:text-4xl drop-shadow-lg">⚽</span>
        </div>
      </div>

      <div className="mt-8 text-center space-y-3">
        <h2 className="text-xl md:text-2xl font-black text-[#0a2647] uppercase tracking-[0.3em] animate-pulse italic">WCGO</h2>
        <div className="flex flex-col items-center gap-1">
          <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            {message || t('loading')}
          </p>
          <div className="flex gap-1">
             <div className="w-1 h-1 bg-wc-accent rounded-full animate-bounce [animation-delay:-0.3s]"></div>
             <div className="w-1 h-1 bg-wc-accent rounded-full animate-bounce [animation-delay:-0.15s]"></div>
             <div className="w-1 h-1 bg-wc-accent rounded-full animate-bounce"></div>
          </div>
        </div>
      </div>

      {/* Decorative blurred spots - Tournament Colors */}
      <div className="absolute top-1/4 left-1/4 w-48 h-48 md:w-64 md:h-64 bg-wc-usa/10 rounded-full blur-[80px] md:blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 md:w-64 md:h-64 bg-wc-mexico/10 rounded-full blur-[80px] md:blur-[100px] animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-wc-canada/5 rounded-full blur-[60px] animate-pulse delay-500"></div>
    </div>
  )
}
