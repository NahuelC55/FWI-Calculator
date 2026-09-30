import React, { useState, useEffect } from 'react';
import { Terminal, RefreshCw, CheckCircle, AlertOctagon, Play, CloudSun } from 'lucide-react';
import { api } from '../api/client';

export default function ScraperPage({ onScrapeCompleted }) {
  const [zones, setZones] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const [selectedZone, setSelectedZone] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadData = async () => {
    setLoadingLogs(true);
    try {
      const [zonesRes, logsRes] = await Promise.all([
        api.getZones(),
        api.getScraperLogs(),
      ]);
      setZones(zonesRes.data);
      setLogs(logsRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunScraper = async (e) => {
    e.preventDefault();
    setIsExecuting(true);
    setStatusMessage(null);
    try {
      const params = {};
      if (selectedZone) params.zone_id = selectedZone;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const res = await api.runScraper(params);
      setStatusMessage({
        type: 'success',
        text: `Scraping completado. ${res.data.length || 1} zona(s) procesada(s).`,
      });
      loadData();
      if (onScrapeCompleted) onScrapeCompleted();
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: 'Error al ejecutar el scraper. Verifica la conexión.',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-extrabold text-2xl text-white tracking-tight flex items-center gap-2">
          <Terminal className="w-6 h-6 text-orange-500" />
          Control de Scraper Meteorológico Open-Meteo
        </h2>
        <p className="text-sm text-slate-400">
          Ejecuta la recolección automática de datos de temperatura, humedad, viento y lluvia por zona geográfica.
        </p>
      </div>

      {/* Scraper Launcher Box */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
            <CloudSun className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-white">Panel de Scraping a Demanda</h3>
            <p className="text-xs text-slate-400">Selecciona el rango de fechas y la zona a consultar (o déjalo en blanco para últimas 24h/7 días).</p>
          </div>
        </div>

        {statusMessage && (
          <div className={`p-3.5 rounded-xl border text-xs font-semibold ${
            statusMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}>
            {statusMessage.text}
          </div>
        )}

        <form onSubmit={handleRunScraper} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Zona Geográfica</label>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
            >
              <option value="">Todas las Zonas Activas</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>{z.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Fecha Inicio (Opcional)</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Fecha Fin (Opcional)</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          <button
            type="submit"
            disabled={isExecuting}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-lg ${
              isExecuting
                ? 'bg-slate-800 cursor-not-allowed text-slate-400'
                : 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-orange-500/20'
            }`}
          >
            <Play className={`w-4 h-4 ${isExecuting ? 'animate-spin' : ''}`} />
            <span>{isExecuting ? 'Procesando Scraping...' : 'Iniciar Scraper'}</span>
          </button>
        </form>
      </div>

      {/* Execution Logs Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-extrabold text-base text-white">Historial de Ejecuciones de Scraper</h3>
          <button onClick={loadData} className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-semibold">
            <RefreshCw className="w-3.5 h-3.5" /> Actualizar Logs
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4">Zona</th>
                <th className="py-3.5 px-4">Fuente</th>
                <th className="py-3.5 px-4">Registros</th>
                <th className="py-3.5 px-4">Detalle / Mensaje</th>
                <th className="py-3.5 px-4">Fecha y Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {logs.map((log) => {
                const isSuccess = log.status === 'SUCCESS';
                return (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                        isSuccess ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                      }`}>
                        {isSuccess ? <CheckCircle className="w-3 h-3" /> : <AlertOctagon className="w-3 h-3" />}
                        {log.status_display}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-white">{log.zone_name || 'Todas'}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{log.source}</td>
                    <td className="py-3 px-4 text-amber-400 font-bold">{log.records_created}</td>
                    <td className="py-3 px-4 text-slate-300 max-w-md truncate">{log.message}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(log.executed_at).toLocaleString()}
                    </td>
                  </tr>
                );
              })}

              {logs.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    No se han registrado ejecuciones de scraper.
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
