import React, { useState } from 'react';

const API = 'http://localhost:5000';

function authHeaders() {
  const token = localStorage.getItem('resernur_token');
  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
}

export default function AdminAnalyticsView() {
  // Default to first day of current month to today
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const downloadReport = async (endpoint, defaultFilename) => {
    if (!startDate || !endDate) {
      setError('Por favor selecciona ambas fechas.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const url = new URL(`${API}/api/reports/${endpoint}`);
      url.searchParams.append('from', startDate);
      url.searchParams.append('to', endDate);

      const res = await fetch(url, {
        method: 'GET',
        headers: authHeaders(),
      });

      if (!res.ok) {
        throw new Error(`Error ${res.status}: No se pudo generar el reporte.`);
      }

      // Extract filename from Content-Disposition header if present
      let filename = defaultFilename;
      const disposition = res.headers.get('Content-Disposition');
      if (disposition && disposition.includes('filename=')) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
      setSuccessMsg(`Reporte descargado exitosamente: ${filename}`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* ── Toast Messages ── */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1.25rem', borderRadius: '0.75rem', background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', fontWeight: 600, fontSize: '0.875rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>error</span>
          {error}
        </div>
      )}
      {successMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1.25rem', borderRadius: '0.75rem', background: '#d1fae5', color: '#065f46', border: '1px solid #6ee7b7', fontWeight: 600, fontSize: '0.875rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>check_circle</span>
          {successMsg}
        </div>
      )}

      {/* ── Page header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-on-surface-variant, #43474f)', marginBottom: '0.25rem' }}>
            Gestión / Analítica
          </p>
          <h2 style={{ fontFamily: 'var(--font-headline, Manrope, sans-serif)', fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary, #001e40)', margin: 0 }}>
            Reportes y Estadísticas
          </h2>
          <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem', fontSize: '0.875rem', color: 'var(--color-on-surface-variant, #43474f)', fontWeight: 500 }}>
            <span className="material-symbols-outlined" style={{ color: '#0ea5e9', fontSize: 18 }}>insights</span>
            Descarga los reportes oficiales en formato Excel
          </p>
        </div>
      </div>

      {/* ── Controls & Date Pickers ── */}
      <div style={{ background: '#fff', borderRadius: '1rem', padding: '1.5rem', border: '1px solid var(--color-surface-container-high, #e6e8ea)', boxShadow: '0 4px 20px rgba(0,30,64,0.06)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary, #001e40)', marginBottom: '1rem' }}>
          1. Selecciona el rango de fechas
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-on-surface-variant, #43474f)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              Fecha de Inicio
            </label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', fontSize: '0.9rem', color: '#111827', outline: 'none' }}
            />
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-on-surface-variant, #43474f)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              Fecha de Fin
            </label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', fontSize: '0.9rem', color: '#111827', outline: 'none' }}
            />
          </div>
        </div>
      </div>

      {/* ── Report Download Cards ── */}
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary, #001e40)', marginTop: '0.5rem' }}>
        2. Generar Reportes
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        {/* General Bookings Card */}
        <div style={{ background: '#fff', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #e0f2fe', borderTop: '4px solid #0284c7', boxShadow: '0 4px 12px rgba(2,132,199,0.05)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '0.5rem', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined">table_view</span>
            </div>
            <h4 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#111827', margin: 0 }}>Reporte General</h4>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#4b5563', marginBottom: '1.5rem', flex: 1 }}>
            Listado completo de todas las reservas y solicitudes realizadas dentro del rango de fechas seleccionado.
          </p>
          <button 
            disabled={loading}
            onClick={() => downloadReport('bookings', 'bookings_report.xlsx')}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#0284c7', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.9rem', cursor: loading ? 'wait' : 'pointer', transition: 'background 0.2s' }}
            onMouseEnter={(e) => { if(!loading) e.currentTarget.style.background = '#0369a1' }}
            onMouseLeave={(e) => { if(!loading) e.currentTarget.style.background = '#0284c7' }}
          >
            {loading ? <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>sync</span> : <span className="material-symbols-outlined">download</span>}
            Descargar Excel
          </button>
        </div>

        {/* Most Used Places Card */}
        <div style={{ background: '#fff', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #fef3c7', borderTop: '4px solid #d97706', boxShadow: '0 4px 12px rgba(217,119,6,0.05)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '0.5rem', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined">leaderboard</span>
            </div>
            <h4 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#111827', margin: 0 }}>Espacios Frecuentes</h4>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#4b5563', marginBottom: '1.5rem', flex: 1 }}>
            Ranking estadístico que contabiliza la cantidad de veces que se utilizó cada espacio de la universidad.
          </p>
          <button 
            disabled={loading}
            onClick={() => downloadReport('most-used-places', 'most_used_places_report.xlsx')}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#d97706', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.9rem', cursor: loading ? 'wait' : 'pointer', transition: 'background 0.2s' }}
            onMouseEnter={(e) => { if(!loading) e.currentTarget.style.background = '#b45309' }}
            onMouseLeave={(e) => { if(!loading) e.currentTarget.style.background = '#d97706' }}
          >
            {loading ? <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>sync</span> : <span className="material-symbols-outlined">download</span>}
            Descargar Excel
          </button>
        </div>

        {/* Rejected/Cancelled Card */}
        <div style={{ background: '#fff', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #fee2e2', borderTop: '4px solid #dc2626', boxShadow: '0 4px 12px rgba(220,38,38,0.05)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '0.5rem', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined">cancel</span>
            </div>
            <h4 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#111827', margin: 0 }}>Rechazos / Cancelados</h4>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#4b5563', marginBottom: '1.5rem', flex: 1 }}>
            Historial de auditoría para todas las solicitudes y reservas que fueron denegadas o canceladas.
          </p>
          <button 
            disabled={loading}
            onClick={() => downloadReport('cancelled-or-rejected', 'cancelled_or_rejected_report.xlsx')}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#dc2626', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.9rem', cursor: loading ? 'wait' : 'pointer', transition: 'background 0.2s' }}
            onMouseEnter={(e) => { if(!loading) e.currentTarget.style.background = '#b91c1c' }}
            onMouseLeave={(e) => { if(!loading) e.currentTarget.style.background = '#dc2626' }}
          >
            {loading ? <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>sync</span> : <span className="material-symbols-outlined">download</span>}
            Descargar Excel
          </button>
        </div>

      </div>
    </section>
  );
}
