import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Summary & Stats
  getDashboardSummary: () => client.get('/dashboard/summary/'),
  
  // Zones
  getZones: () => client.get('/zones/'),
  getZone: (id) => client.get(`/zones/${id}/`),
  createZone: (data) => client.post('/zones/', data),
  updateZone: (id, data) => client.put(`/zones/${id}/`, data),
  deleteZone: (id) => client.delete(`/zones/${id}/`),
  triggerZoneScrape: (id, params) => client.post(`/zones/${id}/trigger_scrape/`, params),
  recalculateZoneFWI: (id) => client.post(`/zones/${id}/recalculate/`),

  // FWI Calculations & History
  getFWIHistory: (params) => client.get('/fwi-calculations/', { params }),

  // Scraper
  runScraper: (params) => client.post('/scraper/run/', params),
  getScraperLogs: () => client.get('/scraper-logs/'),

  // Export
  getExportCSVUrl: (zoneId) => `${API_BASE_URL}/export/csv/${zoneId ? `?zone_id=${zoneId}` : ''}`,
};

export default client;
