
import React from 'react'
import { useTranslation } from 'react-i18next'

export default function RulesPage() {
  const { t } = useTranslation()

  return (
    <div className="max-w-3xl mx-auto space-y-12 pb-20 animate-in fade-in duration-500 overflow-hidden px-1">
      {/* HEADER SECTION */}
      <section className="text-center space-y-4">
        <h1 className="text-4xl md:text-6xl font-black text-[#0a2647] uppercase tracking-tighter italic">
          {t('rules_screen.title')}
        </h1>
        <div className="h-1.5 w-24 bg-gradient-to-r from-wc-accent via-wc-gold to-wc-canada mx-auto rounded-full"></div>
      </section>

      {/* SECTION 1: PARTICIPATION */}
      <div className="glass-card bg-white p-6 md:p-10 shadow-xl border-none">
        <h2 className="text-2xl font-black text-[#0a2647] uppercase tracking-tight mb-6 flex items-center gap-3">
          <span className="text-xl">📅</span> {t('rules_screen.section_1_title')}
        </h2>
        <div className="space-y-4 text-slate-600 font-medium leading-relaxed">
          <p className="flex gap-3"><span className="text-wc-accent font-black">●</span> {t('rules_screen.rule_deadline')}</p>
          <p className="flex gap-3"><span className="text-wc-accent font-black">●</span> {t('rules_screen.rule_lock_time')}</p>
        </div>
      </div>

      {/* SECTION 2: SCORING */}
      <div className="glass-card bg-white p-6 md:p-10 shadow-xl border-none">
        <h2 className="text-2xl font-black text-[#0a2647] uppercase tracking-tight mb-8 flex items-center gap-3">
          <span className="text-xl">⚽</span> {t('rules_screen.section_2_title')}
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100">
            <span className="text-xs font-black text-emerald-600 uppercase tracking-widest block mb-2">+3 Points</span>
            <p className="text-sm font-bold text-slate-700">{t('rules_screen.score_exact')}</p>
          </div>
          <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100">
            <span className="text-xs font-black text-blue-600 uppercase tracking-widest block mb-2">+2 Points</span>
            <p className="text-sm font-bold text-slate-700">{t('rules_screen.score_difference')}</p>
          </div>
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">+1 Point</span>
            <p className="text-sm font-bold text-slate-700">{t('rules_screen.score_outcome')}</p>
          </div>
          <div className="p-5 bg-rose-50 rounded-2xl border border-rose-100">
            <span className="text-xs font-black text-rose-600 uppercase tracking-widest block mb-2">0 Points</span>
            <p className="text-sm font-bold text-slate-700">{t('rules_screen.score_wrong')}</p>
          </div>
        </div>

        <div className="mt-6 p-5 bg-amber-50 rounded-2xl border border-amber-200">
          <div className="flex gap-3">
            <span className="text-xl">⚠️</span>
            <p className="text-sm font-bold text-amber-900 leading-relaxed">
              {t('rules_screen.rule_extra_time')}
            </p>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-slate-100">
          <h3 className="font-black text-[#0a2647] uppercase tracking-widest text-sm mb-6">{t('rules_screen.multipliers_title')}</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <li className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
               <span className="w-10 h-10 flex items-center justify-center bg-white rounded-lg font-black text-[#0a2647] shadow-sm shrink-0">x1.0</span>
               <span className="text-sm font-bold text-slate-600">{t('rules_screen.mult_group')}</span>
            </li>
            <li className="flex items-center gap-4 p-4 bg-blue-50/50 rounded-xl">
               <span className="w-10 h-10 flex items-center justify-center bg-[#0a2647] rounded-lg font-black text-white shadow-md shrink-0">x1.2</span>
               <span className="text-sm font-bold text-slate-600">{t('rules_screen.mult_knockout')}</span>
            </li>
            <li className="flex items-center gap-4 p-4 bg-indigo-50/50 rounded-xl">
               <span className="w-10 h-10 flex items-center justify-center bg-indigo-900 rounded-lg font-black text-white shadow-md shrink-0">x1.5</span>
               <span className="text-sm font-bold text-slate-600">{t('rules_screen.mult_sf')}</span>
            </li>
            <li className="flex items-center gap-4 p-4 bg-amber-50/50 rounded-xl border border-wc-gold/20">
               <span className="w-10 h-10 flex items-center justify-center bg-wc-gold rounded-lg font-black text-white shadow-md shrink-0">x1.8</span>
               <span className="text-sm font-bold text-slate-600">{t('rules_screen.mult_final')}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* DISCLAIMER SECTION */}
      <section className="bg-[#0a2647] p-8 md:p-12 rounded-[3rem] text-white space-y-8 shadow-2xl relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-wc-accent/5 rounded-full -ml-32 -mb-32 blur-3xl"></div>

        <div className="relative z-10 space-y-4 text-center">
           <span className="text-wc-accent font-black uppercase tracking-[0.3em] text-[10px] block">{t('rules_screen.disclaimer_title')}</span>
           <p className="text-sm font-bold text-slate-300 max-w-2xl mx-auto leading-relaxed italic opacity-80 uppercase tracking-tighter">
             {t('rules_screen.disclaimer_content')}
           </p>
        </div>

        <div className="relative z-10 grid gap-6 md:grid-cols-3">
          <div className="space-y-3 p-6 bg-white/5 rounded-3xl border border-white/10">
            <h4 className="font-black text-wc-accent uppercase tracking-widest text-[10px]">{t('rules_screen.purpose_title')}</h4>
            <p className="text-xs font-medium text-slate-300 leading-relaxed">{t('rules_screen.purpose_content')}</p>
          </div>
          <div className="space-y-3 p-6 bg-white/5 rounded-3xl border border-white/10">
            <h4 className="font-black text-wc-accent uppercase tracking-widest text-[10px]">{t('rules_screen.mechanism_title')}</h4>
            <p className="text-xs font-medium text-slate-300 leading-relaxed">{t('rules_screen.mechanism_content')}</p>
          </div>
          <div className="space-y-3 p-6 bg-white/5 rounded-3xl border border-white/10">
            <h4 className="font-black text-wc-accent uppercase tracking-widest text-[10px]">{t('rules_screen.usage_title')}</h4>
            <p className="text-xs font-medium text-slate-300 leading-relaxed">{t('rules_screen.usage_content')}</p>
          </div>
        </div>
      </section>
    </div>
  )
}
