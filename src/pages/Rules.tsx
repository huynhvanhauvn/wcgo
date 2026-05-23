import React from 'react';
import { useTranslation } from 'react-i18next';

export default function RulesPage() {
  const { t } = useTranslation();

  return (
    <div className="glass-card p-6 md:p-10 bg-white/95 shadow-xl border-white">
      {/* Main Title: Deep Navy */}
      <h1 className="text-3xl md:text-5xl font-black text-center mb-12 tracking-tight uppercase italic">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#0a2647] via-blue-900 to-wc-accent">
          {t('rules_screen.title')}
        </span>
      </h1>

      {/* Internal Only Notice */}
      <div className="mb-10 grid gap-6 md:grid-cols-3">
        <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-2xl shadow-sm">
          <h3 className="text-sm font-black text-blue-900 uppercase tracking-widest mb-2 flex items-center gap-2">
            <span className="text-xl">🎯</span> {t('rules_screen.purpose_title')}
          </h3>
          <p className="text-xs text-blue-800 leading-relaxed font-medium">{t('rules_screen.purpose_content')}</p>
        </div>
        <div className="p-5 bg-emerald-50/50 border border-emerald-100 rounded-2xl shadow-sm">
          <h3 className="text-sm font-black text-emerald-900 uppercase tracking-widest mb-2 flex items-center gap-2">
            <span className="text-xl">⚙️</span> {t('rules_screen.mechanism_title')}
          </h3>
          <p className="text-xs text-emerald-800 leading-relaxed font-medium">{t('rules_screen.mechanism_content')}</p>
        </div>
        <div className="p-5 bg-amber-50/50 border border-amber-100 rounded-2xl shadow-sm">
          <h3 className="text-sm font-black text-amber-900 uppercase tracking-widest mb-2 flex items-center gap-2">
            <span className="text-xl">📜</span> {t('rules_screen.usage_title')}
          </h3>
          <p className="text-xs text-amber-800 leading-relaxed font-medium">{t('rules_screen.usage_content')}</p>
        </div>
      </div>

      {/* Section 1: Timing and Lock */}
      <section className="mb-10 bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:border-blue-500/30 transition-all duration-300">
        <h2 className="text-xl font-bold text-blue-800 mb-4 flex items-center gap-3">
          <span className="h-3 w-3 bg-blue-600 rounded-full shadow-[0_0_10px_rgba(30,58,138,0.2)]"></span>
          {t('rules_screen.section_1_title')}
        </h2>
        <div className="space-y-4">
          <p className="text-[#0a2647] text-lg leading-relaxed font-semibold">📌 {t('rules_screen.rule_deadline')}</p>
          <div className="inline-block px-4 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full">
            <p className="text-amber-700 font-bold text-sm uppercase tracking-wider">🔒 {t('rules_screen.rule_lock_time')}</p>
          </div>
        </div>
      </section>

      {/* Section 2: Scoring */}
      <section className="mb-10 bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:border-emerald-500/30 transition-all duration-300">
        <h2 className="text-xl font-bold text-emerald-700 mb-6 flex items-center gap-3">
           <span className="h-3 w-3 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.2)]"></span>
           {t('rules_screen.section_2_title')}
        </h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <li className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
            <span className="text-2xl block mb-2">🟢</span>
            <span className="font-bold text-[#0a2647] text-lg block leading-tight">{t('rules_screen.score_exact')}</span>
          </li>
          <li className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
            <span className="text-2xl block mb-2">🔵</span>
            <span className="text-slate-700 font-bold">{t('rules_screen.score_difference')}</span>
          </li>
          <li className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
            <span className="text-2xl block mb-2">🟡</span>
            <span className="text-slate-700 font-bold">{t('rules_screen.score_outcome')}</span>
          </li>
          <li className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
            <span className="text-2xl block mb-2">🔴</span>
            <span className="text-slate-400 font-bold">{t('rules_screen.score_wrong')}</span>
          </li>
        </ul>

        <h3 className="text-md font-black text-wc-gold mt-10 mb-5 uppercase tracking-[0.2em] text-center">{t('rules_screen.multipliers_title')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 text-center transition-transform hover:scale-105 shadow-sm">
            <p className="text-slate-400 text-xs font-bold uppercase mb-2 tracking-widest">Group Stage</p>
            <p className="font-bold text-[#0a2647]">{t('rules_screen.mult_group')}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-white p-5 rounded-2xl border border-amber-100 text-center transition-transform hover:scale-105 shadow-sm">
            <p className="text-amber-500/70 text-xs font-bold uppercase mb-2 tracking-widest">Knockout</p>
            <p className="font-bold text-amber-700">{t('rules_screen.mult_knockout')}</p>
          </div>
          <div className="bg-gradient-to-br from-rose-50 to-white p-5 rounded-2xl border border-rose-100 text-center transition-transform hover:scale-105 shadow-sm">
            <p className="text-rose-500/70 text-xs font-bold uppercase mb-2 tracking-widest">Finals</p>
            <p className="font-bold text-rose-700">{t('rules_screen.mult_final')}</p>
          </div>
        </div>
      </section>

      {/* Section 3: Penalty Calculation */}
      <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:border-wc-gold/30 transition-all duration-300">
        <h2 className="text-xl font-bold text-wc-gold mb-8 flex items-center gap-3">
          <span className="h-3 w-3 bg-wc-gold rounded-full shadow-[0_0_10px_rgba(255,183,0,0.2)]"></span>
          {t('rules_screen.section_3_title')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
          <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl shadow-sm">
            <p className="text-emerald-700 font-black flex items-center gap-4 text-lg">
              <span className="text-3xl">🎉</span> {t('rules_screen.penalty_free')}
            </p>
          </div>
          <div className="p-5 bg-rose-50 border border-rose-100 rounded-2xl shadow-sm">
            <p className="text-rose-700 font-black flex items-center gap-4 text-lg">
              <span className="text-3xl">💀</span> {t('rules_screen.penalty_last')}
            </p>
          </div>
          <div className="sm:col-span-2 p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <p className="text-[#0a2647] font-bold flex items-start gap-4 leading-relaxed">
              <span className="text-3xl">⚖️</span> {t('rules_screen.penalty_others')}
            </p>
          </div>
        </div>

        {/* Display Mathematical Formula */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#0a2647] to-wc-gold rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
          <div className="relative bg-[#0a2647] p-10 rounded-2xl text-center border border-white/10 shadow-xl overflow-hidden">
            <span className="text-[10px] text-slate-400 block mb-6 uppercase tracking-[0.4em] font-black">{t('rules_screen.penalty_formula_label')}</span>
            <div className="overflow-x-auto py-4">
              <p className="text-[#00d4ff] font-mono text-2xl md:text-4xl whitespace-nowrap tracking-tighter">
                Penalty = 500k × <span className="text-white">(</span>P<span className="text-[0.6em] align-sub">Top3</span> - P<span className="text-[0.6em] align-sub">User</span><span className="text-white">)</span> / <span className="text-white">(</span>P<span className="text-[0.6em] align-sub">Top3</span> - P<span className="text-[0.6em] align-sub">Last</span><span className="text-white">)</span>
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-500 italic mt-8 flex items-center justify-center gap-3 bg-white py-3 rounded-full border border-slate-100 shadow-sm font-medium">
          <span className="text-lg">🛡️</span> {t('rules_screen.champion_privilege')}
        </p>

        {/* Surplus/Deficit Handling */}
        <div className="mt-12 pt-10 border-t border-slate-100">
          <h3 className="text-sm font-black text-[#0a2647] mb-6 uppercase tracking-[0.3em] text-center">{t('rules_screen.fund_handling_title')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex items-start gap-4 p-5 bg-rose-50 rounded-2xl border border-rose-100 shadow-sm">
              <span className="text-2xl text-rose-600">⚠️</span>
              <span className="text-sm text-slate-700 font-bold leading-relaxed">{t('rules_screen.deficit_rule')}</span>
            </div>
            <div className="flex items-start gap-4 p-5 bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm">
              <span className="text-2xl text-emerald-600">💰</span>
              <span className="text-sm text-slate-600 font-bold leading-relaxed">{t('rules_screen.surplus_rule')}</span>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="mt-10 p-6 bg-amber-50/50 border border-amber-100 rounded-2xl shadow-inner">
          <h4 className="text-xs font-black text-amber-700 uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="text-lg">⚖️</span> {t('rules_screen.disclaimer_title')}
          </h4>
          <p className="text-xs text-amber-800/80 leading-relaxed italic font-medium">
            {t('rules_screen.disclaimer_content')}
          </p>
        </div>
      </section>
    </div>
  );
}
