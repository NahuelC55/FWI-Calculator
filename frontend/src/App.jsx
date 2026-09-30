import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DashboardPage from './pages/DashboardPage';
import ZonesPage from './pages/ZonesPage';
import HistoryPage from './pages/HistoryPage';
import ScraperPage from './pages/ScraperPage';
import { api } from './api/client';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [summary, setSummary] = useState(null);
  const [isScraping, setIsScraping] = useState(false);

  const fetchSummary = async () => {
    try {
      const res = await api.getDashboardSummary();
      setSummary(res.data);
    } catch (e) {
      console.error("Error al cargar resumen:", e);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleQuickScrape = async () => {
    setIsScraping(true);
    try {
      await api.runScraper({});
      await fetchSummary();
    } catch (e) {
      console.error("Error en quick scrape:", e);
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f17] text-slate-100 font-sans selection:bg-orange-500 selection:text-white">
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onQuickScrape={handleQuickScrape}
        isScraping={isScraping}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 pb-12">
        {activeTab === 'dashboard' && (
          <DashboardPage
            summary={summary}
            onRefresh={fetchSummary}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}
        {activeTab === 'zones' && (
          <ZonesPage onScrapeCompleted={fetchSummary} />
        )}
        {activeTab === 'history' && (
          <HistoryPage />
        )}
        {activeTab === 'scraper' && (
          <ScraperPage onScrapeCompleted={fetchSummary} />
        )}
      </main>

      {/* Footer */}
      <footer className="glass-card border-t border-slate-800/80 py-6 px-4 lg:px-8 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-slate-300">Sistema FWI • Canadian Forest Fire Weather Index System</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Django 5 + MySQL + Open-Meteo Engine + React Vite</p>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Norma Van Wagner 1987</span>
            <span>•</span>
            <span>Backend API: Port 8000</span>
            <span>•</span>
            <span>Frontend: Port 3000</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
