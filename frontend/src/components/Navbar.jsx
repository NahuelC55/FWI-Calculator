import React from 'react';
import { Flame, MapPin, History, Terminal, RefreshCw, Activity } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onQuickScrape, isScraping }) {
  const navItems = [
    { id: 'dashboard', label: 'Visión General', icon: Activity },
    { id: 'zones', label: 'Zonas Geográficas', icon: MapPin },
    { id: 'history', label: 'Histórico & Análisis', icon: History },
    { id: 'scraper', label: 'Logs de Scraper', icon: Terminal },
  ];

  return (
    <header className="sticky top-0 z-50 glass-card border-b border-slate-800/80 px-4 lg:px-8 py-3 mb-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Flame className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                FWI MONITOR
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                API Activa
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Estándar Internacional CFFDRS • Open-Meteo Engine</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Quick Actions */}
        <button
          onClick={onQuickScrape}
          disabled={isScraping}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg ${
            isScraping
              ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
              : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 hover:border-amber-500/60 shadow-amber-500/10'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${isScraping ? 'animate-spin text-amber-400' : 'text-amber-400'}`} />
          <span>{isScraping ? 'Scrapeando...' : 'Actualizar Clima'}</span>
        </button>
      </div>
    </header>
  );
}
