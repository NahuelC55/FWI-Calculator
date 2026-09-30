import React, { useState, useEffect } from 'react';
import { MapPin, ShieldAlert, Database, Flame, RefreshCw, ChevronRight, TrendingUp } from 'lucide-react';
import FWIGaugeCard from '../components/FWIGaugeCard';
import { api } from '../api/client';

export default function DashboardPage({ summary, onRefresh, onNavigate }) {
  const [selectedCalculation, setSelectedCalculation] = useState(null);

  useEffect(() => {
    if (summary?.latest_calculations && summary.latest_calculations.length > 0) {
      setSelectedCalculation(summary.latest_calculations[0]);
    }
  }, [summary]);

  if (!summary) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
          <p className="text-sm font-medium text-slate-400">Cargando métricas del sistema FWI...</p>
        </div>
      </div>
    );
  }

  const calculations = summary.latest_calculations || [];

  return (
    <div className="space-y-6">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Zones */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Zonas Monitoreadas</span>
            <div className="text-3xl font-black text-white mt-1">{summary.total_zones}</div>
            <div className="text-[11px] text-emerald-400 font-medium mt-0.5">{summary.active_zones} zonas activas</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <MapPin className="w-6 h-6" />
          </div>
        </div>

        {/* High Risk Alerts */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Zonas en Riesgo Alto</span>
            <div className="text-3xl font-black text-rose-500 mt-1">{summary.high_risk_zones}</div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">Nivel Alto, Muy Alto o Extremo</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        {/* Total Scraped Records */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lecturas Rascadas</span>
            <div className="text-3xl font-black text-amber-400 mt-1">{summary.total_records}</div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">Almacenadas en MySQL/DB</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Database className="w-6 h-6" />
          </div>
        </div>

        {/* Calculations Engine */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cálculos Históricos</span>
            <div className="text-3xl font-black text-emerald-400 mt-1">{summary.total_calculations}</div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">Índices FWI procesados</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Flame className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Content: Gauge & Zone List Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main FWI Gauge Card */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-lg text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              Estado FWI en Tiempo Real
            </h2>
            <button
              onClick={() => onNavigate('history')}
              className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1"
            >
              Ver Historial Completo <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <FWIGaugeCard calculation={selectedCalculation} />
        </div>

        {/* Right Col: Active Zone Selector */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-lg text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-400" />
              Zonas Activas
            </h2>
            <button
              onClick={() => onNavigate('zones')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
            >
              Gestionar Zonas
            </button>
          </div>

          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {calculations.map((item) => {
              const isSelected = selectedCalculation?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedCalculation(item)}
                  className={`glass-card p-4 rounded-xl cursor-pointer transition-all duration-200 border ${
                    isSelected
                      ? 'border-orange-500/60 bg-slate-800/80 shadow-lg shadow-orange-500/10'
                      : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-white">{item.zone_name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Última lectura: {item.date}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-white">{item.fwi}</div>
                      <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-amber-400 border border-amber-500/20 uppercase">
                        {item.danger_level_display}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {calculations.length === 0 && (
              <div className="glass-card p-6 rounded-xl text-center text-slate-400 text-sm">
                No hay lecturas registradas. Ejecuta el scraper desde la navegación superior.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
