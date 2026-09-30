import React from 'react';
import { Flame, ShieldAlert, Thermometer, Wind, Droplets, CloudRain } from 'lucide-react';

const DANGER_CONFIG = {
  LOW: { label: 'Bajo', color: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/30', glow: 'glow-emerald' },
  MODERATE: { label: 'Moderado', color: 'bg-sky-500', text: 'text-sky-400', border: 'border-sky-500/30', glow: '' },
  HIGH: { label: 'Alto', color: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/30', glow: '' },
  VERY_HIGH: { label: 'Muy Alto', color: 'bg-orange-500', text: 'text-orange-400', border: 'border-orange-500/30', glow: 'glow-orange' },
  EXTREME: { label: 'Extremo', color: 'bg-red-500', text: 'text-red-400', border: 'border-red-500/30', glow: 'glow-red' },
};

export default function FWIGaugeCard({ calculation, zoneName }) {
  if (!calculation) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center text-slate-400">
        <p className="text-sm">Sin cálculos FWI disponibles para esta zona.</p>
      </div>
    );
  }

  const dangerKey = calculation.danger_level || 'LOW';
  const cfg = DANGER_CONFIG[dangerKey] || DANGER_CONFIG.LOW;
  const weather = calculation.weather_data_detail;

  // Max scale FWI around 50 for gauge percentage
  const fwiPercent = Math.min(100, (calculation.fwi / 50) * 100);

  return (
    <div className={`glass-card rounded-2xl p-6 relative overflow-hidden transition-all duration-300 ${cfg.border} ${cfg.glow}`}>
      {/* Background Gradient Effect */}
      <div className={`absolute -right-12 -top-12 w-40 h-40 rounded-full ${cfg.color} opacity-10 blur-3xl pointer-events-none`}></div>

      {/* Card Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Zona Climática</span>
          <h3 className="font-extrabold text-xl text-white tracking-tight">{zoneName || calculation.zone_name}</h3>
          <p className="text-xs text-slate-400 mt-0.5">Fecha: {calculation.date}</p>
        </div>
        <div className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border bg-slate-900/80 ${cfg.text} ${cfg.border}`}>
          <ShieldAlert className="w-4 h-4" />
          <span>{calculation.danger_level_display || cfg.label}</span>
        </div>
      </div>

      {/* Main Score Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center my-4">
        <div className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${cfg.color} bg-opacity-20 border ${cfg.border}`}>
            <Flame className={`w-8 h-8 ${cfg.text}`} />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-400 uppercase">Índice FWI</div>
            <div className="text-3xl font-black text-white tracking-tight">{calculation.fwi}</div>
            <div className="text-[10px] text-slate-400 font-medium">Severidad (DSR): {calculation.dsr}</div>
          </div>
        </div>

        {/* Visual Bar Gauge */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-400">Escala de Peligro</span>
            <span className={cfg.text}>{fwiPercent.toFixed(0)}% del máximo</span>
          </div>
          <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800 flex">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${cfg.color}`}
              style={{ width: `${Math.max(5, fwiPercent)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase tracking-wider px-1">
            <span>Bajo</span>
            <span>Mod</span>
            <span>Alto</span>
            <span>Extremo</span>
          </div>
        </div>
      </div>

      {/* Component Codes Grid (FFMC, DMC, DC, ISI, BUI) */}
      <div className="mt-6 pt-4 border-t border-slate-800/80">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Sub-Índices CFFDRS</h4>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60 text-center">
            <div className="text-[10px] font-bold text-amber-400">FFMC</div>
            <div className="text-base font-extrabold text-white mt-0.5">{calculation.ffmc}</div>
            <div className="text-[9px] text-slate-400 truncate">Combustible Fino</div>
          </div>
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60 text-center">
            <div className="text-[10px] font-bold text-sky-400">DMC</div>
            <div className="text-base font-extrabold text-white mt-0.5">{calculation.dmc}</div>
            <div className="text-[9px] text-slate-400 truncate">Capa Orgánica</div>
          </div>
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60 text-center">
            <div className="text-[10px] font-bold text-emerald-400">DC</div>
            <div className="text-base font-extrabold text-white mt-0.5">{calculation.dc}</div>
            <div className="text-[9px] text-slate-400 truncate">Sequía Profunda</div>
          </div>
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60 text-center">
            <div className="text-[10px] font-bold text-orange-400">ISI</div>
            <div className="text-base font-extrabold text-white mt-0.5">{calculation.isi}</div>
            <div className="text-[9px] text-slate-400 truncate">Propagación</div>
          </div>
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60 text-center col-span-2 sm:col-span-1">
            <div className="text-[10px] font-bold text-rose-400">BUI</div>
            <div className="text-base font-extrabold text-white mt-0.5">{calculation.bui}</div>
            <div className="text-[9px] text-slate-400 truncate">Combustible Disp.</div>
          </div>
        </div>
      </div>

      {/* Weather Snapshot */}
      {weather && (
        <div className="mt-4 pt-3 border-t border-slate-800/50 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-1">
            <Thermometer className="w-3.5 h-3.5 text-rose-400" />
            <span>{weather.temperature}°C</span>
          </div>
          <div className="flex items-center gap-1">
            <Droplets className="w-3.5 h-3.5 text-sky-400" />
            <span>{weather.relative_humidity}% HR</span>
          </div>
          <div className="flex items-center gap-1">
            <Wind className="w-3.5 h-3.5 text-teal-400" />
            <span>{weather.wind_speed} km/h</span>
          </div>
          <div className="flex items-center gap-1">
            <CloudRain className="w-3.5 h-3.5 text-indigo-400" />
            <span>{weather.rain_24h} mm</span>
          </div>
        </div>
      )}
    </div>
  );
}
