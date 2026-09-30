import React, { useState, useEffect } from 'react';
import { History, Download, Filter, Flame, Thermometer, Droplets, CloudRain } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { api } from '../api/client';

export default function HistoryPage() {
  const [zones, setZones] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    api.getZones().then((res) => setZones(res.data)).catch(console.error);
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedZone) params.zone_id = selectedZone;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const res = await api.getFWIHistory(params);
      setHistoryData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [selectedZone, startDate, endDate]);

  // Format data for Recharts (reverse chronologically for chart display)
  const chartData = [...historyData]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((item) => ({
      date: item.date,
      fwi: item.fwi,
      isi: item.isi,
      bui: item.bui,
      temp: item.weather_data_detail?.temperature || 0,
      rh: item.weather_data_detail?.relative_humidity || 0,
      rain: item.weather_data_detail?.rain_24h || 0,
      zone: item.zone_name,
    }));

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="font-extrabold text-2xl text-white tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-amber-400" />
            Histórico & Análisis Meteorológico FWI
          </h2>
          <p className="text-sm text-slate-400">
            Filtra registros históricos guardados en la base de datos MySQL y exporta reportes en CSV.
          </p>
        </div>

        <a
          href={api.getExportCSVUrl(selectedZone)}
          download="fwi_historico.csv"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 shadow-lg transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Exportar a CSV</span>
        </a>
      </div>

      {/* Filter Bar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase">
          <Filter className="w-4 h-4 text-orange-500" />
          Filtros:
        </div>

        {/* Zone Dropdown */}
        <select
          value={selectedZone}
          onChange={(e) => setSelectedZone(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
        >
          <option value="">Todas las Zonas</option>
          {zones.map((z) => (
            <option key={z.id} value={z.id}>{z.name}</option>
          ))}
        </select>

        {/* Start Date */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Desde:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* End Date */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Hasta:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500"
          />
        </div>

        {(selectedZone || startDate || endDate) && (
          <button
            onClick={() => { setSelectedZone(''); setStartDate(''); setEndDate(''); }}
            className="text-xs font-semibold text-rose-400 hover:underline ml-auto"
          >
            Limpiar Filtros
          </button>
        )}
      </div>

      {/* Interactive Recharts Graph */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-base text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            Evolución del FWI vs Variables Meteorológicas
          </h3>
          <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500 inline-block"></span> FWI</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span> Temp (°C)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-sky-500 inline-block"></span> Humedad (%)</span>
          </div>
        </div>

        {chartData.length > 0 ? (
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorFWI" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="fwi" name="Índice FWI" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorFWI)" />
                <Area type="monotone" dataKey="temp" name="Temperatura °C" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorTemp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 text-sm">No hay datos suficientes para generar el gráfico.</div>
        )}
      </div>

      {/* Historical Data Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-extrabold text-base text-white">Registros en Base de Datos</h3>
          <span className="text-xs text-slate-400 font-semibold">{historyData.length} registros encontrados</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                <th className="py-3.5 px-4">Fecha</th>
                <th className="py-3.5 px-4">Zona</th>
                <th className="py-3.5 px-4">Temp (°C)</th>
                <th className="py-3.5 px-4">Humedad (%)</th>
                <th className="py-3.5 px-4">Viento (km/h)</th>
                <th className="py-3.5 px-4">Lluvia 24h</th>
                <th className="py-3.5 px-4">FFMC</th>
                <th className="py-3.5 px-4">DMC</th>
                <th className="py-3.5 px-4">DC</th>
                <th className="py-3.5 px-4">ISI</th>
                <th className="py-3.5 px-4">BUI</th>
                <th className="py-3.5 px-4 text-orange-400 font-extrabold">FWI</th>
                <th className="py-3.5 px-4">Peligro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {historyData.map((row) => {
                const w = row.weather_data_detail;
                return (
                  <tr key={row.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-slate-200 font-mono">{row.date}</td>
                    <td className="py-3 px-4 font-bold text-white">{row.zone_name}</td>
                    <td className="py-3 px-4 text-slate-300">{w ? `${w.temperature}°C` : '-'}</td>
                    <td className="py-3 px-4 text-slate-300">{w ? `${w.relative_humidity}%` : '-'}</td>
                    <td className="py-3 px-4 text-slate-300">{w ? `${w.wind_speed} km/h` : '-'}</td>
                    <td className="py-3 px-4 text-slate-300">{w ? `${w.rain_24h} mm` : '-'}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono">{row.ffmc}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono">{row.dmc}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono">{row.dc}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono">{row.isi}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono">{row.bui}</td>
                    <td className="py-3 px-4 text-orange-400 font-black text-sm">{row.fwi}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-amber-400 border border-amber-500/20 uppercase">
                        {row.danger_level_display}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {historyData.length === 0 && (
                <tr>
                  <td colSpan="13" className="py-8 text-center text-slate-400">
                    No se encontraron registros para los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
