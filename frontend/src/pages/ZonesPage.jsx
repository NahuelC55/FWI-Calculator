import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, RefreshCw, Globe, Check, AlertCircle } from 'lucide-react';
import { api } from '../api/client';

const PRESET_ZONES = [
  { name: 'Patagonia (Bariloche, Arg)', latitude: -41.1335, longitude: -71.3103, country: 'Argentina', region: 'Río Negro' },
  { name: 'Valparaíso (Costa, Chile)', latitude: -33.0472, longitude: -71.6127, country: 'Chile', region: 'Valparaíso' },
  { name: 'Córdoba (Sierras, Arg)', latitude: -31.4201, longitude: -64.1888, country: 'Argentina', region: 'Córdoba' },
  { name: 'Madrid (Sierra, España)', latitude: 40.4168, longitude: -3.7038, country: 'España', region: 'Madrid' },
  { name: 'California (Los Ángeles, EEUU)', latitude: 34.0522, longitude: -118.2437, country: 'EEUU', region: 'California' },
  { name: 'Guadalajara (Jalisco, México)', latitude: 20.6597, longitude: -103.3496, country: 'México', region: 'Jalisco' },
];

export default function ZonesPage({ onScrapeCompleted }) {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [scrapingId, setScrapingId] = useState(null);
  const [message, setMessage] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    latitude: '',
    longitude: '',
    country: '',
    region: '',
    description: '',
  });

  const loadZones = async () => {
    setLoading(true);
    try {
      const res = await api.getZones();
      setZones(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadZones();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.createZone({
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
      });
      setMessage({ type: 'success', text: `Zona '${formData.name}' creada exitosamente.` });
      setShowModal(false);
      setFormData({ name: '', latitude: '', longitude: '', country: '', region: '', description: '' });
      loadZones();
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al crear la zona. Verifica los campos.' });
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`¿Seguro que deseas eliminar la zona '${name}'? Se eliminarán sus registros.`)) return;
    try {
      await api.deleteZone(id);
      setMessage({ type: 'success', text: `Zona '${name}' eliminada.` });
      loadZones();
    } catch (e) {
      console.error(e);
    }
  };

  const handleTriggerScrape = async (id, name) => {
    setScrapingId(id);
    try {
      const res = await api.triggerZoneScrape(id, {});
      setMessage({ type: 'success', text: res.data.message || `Scraping completado para ${name}.` });
      loadZones();
      if (onScrapeCompleted) onScrapeCompleted();
    } catch (e) {
      setMessage({ type: 'error', text: `Error al raspar clima para ${name}.` });
    } finally {
      setScrapingId(null);
    }
  };

  const applyPreset = (preset) => {
    setFormData({
      name: preset.name,
      latitude: preset.latitude,
      longitude: preset.longitude,
      country: preset.country,
      region: preset.region,
      description: `Zona meteorológica en ${preset.region}, ${preset.country}.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-extrabold text-2xl text-white tracking-tight flex items-center gap-2">
            <Globe className="w-6 h-6 text-orange-500" />
            Configuración de Zonas Geográficas
          </h2>
          <p className="text-sm text-slate-400">
            Administra las regiones monitoreadas por el scraper Open-Meteo.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-lg shadow-orange-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Zona Geográfica</span>
        </button>
      </div>

      {/* Message banner */}
      {message && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-xs underline font-semibold">Cerrar</button>
        </div>
      )}

      {/* Zones Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Cargando zonas...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {zones.map((zone) => (
            <div key={zone.id} className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 font-bold text-sm">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-white">{zone.name}</h3>
                      <p className="text-xs text-slate-400">{zone.region}, {zone.country}</p>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-900 text-amber-400 border border-amber-500/20 uppercase">
                    FWI: {zone.latest_fwi ?? 'N/A'}
                  </span>
                </div>

                <div className="mt-3 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 text-xs text-slate-300 font-mono space-y-1">
                  <div>Latitud: <span className="text-slate-100">{zone.latitude}</span></div>
                  <div>Longitud: <span className="text-slate-100">{zone.longitude}</span></div>
                </div>

                {zone.description && (
                  <p className="text-xs text-slate-400 mt-3 line-clamp-2">{zone.description}</p>
                )}
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <button
                  onClick={() => handleTriggerScrape(zone.id, zone.name)}
                  disabled={scrapingId === zone.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${scrapingId === zone.id ? 'animate-spin' : ''}`} />
                  <span>{scrapingId === zone.id ? 'Scrapeando...' : 'Ejecutar Scraper'}</span>
                </button>

                <button
                  onClick={() => handleDelete(zone.id, zone.name)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                  title="Eliminar Zona"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Zone Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl max-w-lg w-full p-6 border border-slate-700 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-lg text-white">Agregar Nueva Zona Geográfica</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
            </div>

            {/* Presets quick selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Seleccionar Preset Rápido
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_ZONES.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/20"
                  >
                    + {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre de la Zona</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ej. Bariloche (Patagonia)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Latitud GPS</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    placeholder="-41.1335"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Longitud GPS</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    placeholder="-71.3103"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">País</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="Argentina"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Región / Provincia</label>
                  <input
                    type="text"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    placeholder="Río Negro"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Descripción de la Zona</label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detalles ecológicos o de vegetación..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                ></textarea>
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20"
                >
                  Guardar Zona
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
