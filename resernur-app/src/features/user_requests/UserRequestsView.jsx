import React, { useState, useEffect, useCallback } from 'react';

const API = 'http://localhost:5000';

function authHeaders() {
  const token = localStorage.getItem('resernur_token');
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

export function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('es-BO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatDateOnly(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTimeRange(start, end) {
  if (!start || !end) return '—';
  const s = new Date(start);
  const e = new Date(end);
  const fmt = (d) => d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
  return `${fmt(s)} – ${fmt(e)}`;
}

const STATUS_LABELS = {
  PENDING: { label: 'Pendiente', color: '#d97706', bg: '#fef3c7', icon: 'schedule' },
  ACCEPTED: { label: 'Aprobada', color: '#059669', bg: '#d1fae5', icon: 'check_circle' },
  REJECTED: { label: 'Rechazada', color: '#dc2626', bg: '#fee2e2', icon: 'cancel' },
  CHANGES_REQUESTED: { label: 'Requiere Cambios', color: '#7c3aed', bg: '#ede9fe', icon: 'edit_note' },
};

export default function UserRequestsView({ onNavigate }) {
  const [requests, setRequests] = useState([]);
  const [places, setPlaces] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 10;

  const fetchData = useCallback(async (p = 0) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Get current user
      const userRes = await fetch(`${API}/api/users/me`, { headers: authHeaders() });
      if (!userRes.ok) throw new Error("No se pudo obtener la sesión actual.");
      const userData = await userRes.json();
      const userId = userData.data?.id || userData.id;

      if (!userId) throw new Error("No se encontró el ID de usuario.");

      // 2. Get places for mapping names
      const placesRes = await fetch(`${API}/api/places?page=0&pageSize=200`, { headers: authHeaders() });
      let placesMap = {};
      if (placesRes.ok) {
        const pData = await placesRes.json();
        const pList = pData.content || pData.data?.content || [];
        placesMap = pList.reduce((acc, pl) => {
          acc[pl.id] = pl.name;
          return acc;
        }, {});
        setPlaces(placesMap);
      }

      // 3. Get user requests
      const reqRes = await fetch(`${API}/api/booking-requests/user/${userId}?page=${p}&pageSize=${PAGE_SIZE}`, {
        headers: authHeaders(),
      });
      if (!reqRes.ok) throw new Error("No se pudieron cargar tus solicitudes.");
      
      const reqData = await reqRes.json();
      setRequests(reqData.content || []);
      setTotalPages(reqData.totalPages || 1);
      setPage(p);

    } catch (err) {
      console.error(err);
      setError(err.message || "Error al cargar los datos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(0);
  }, [fetchData]);

  return (
    <main className="pt-24 pb-16 px-6 md:px-12 max-w-[1200px] mx-auto text-on-surface">
      {/* Header */}
      <header className="mb-10">
        <span className="font-label text-xs font-bold tracking-[0.1em] text-on-secondary-container uppercase mb-2 block">
          Área Personal
        </span>
        <h1 className="font-headline text-4xl font-extrabold tracking-tight text-primary">
          Mis Reservas
        </h1>
        <p className="text-on-surface-variant mt-2 text-sm max-w-2xl">
          Aquí puedes ver el historial completo de todas tus solicitudes de espacio institucional y verificar su estado en tiempo real.
        </p>
      </header>

      {/* Content */}
      <section>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl animate-spin mb-4">refresh</span>
            <p className="font-bold">Cargando tu historial...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-8 rounded-2xl text-center">
            <span className="material-symbols-outlined text-4xl mb-2">error</span>
            <p className="font-bold">{error}</p>
            <button 
              onClick={() => fetchData(0)}
              className="mt-4 px-6 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg font-bold transition-colors"
            >
              Reintentar
            </button>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-surface-container-low border border-surface-container-high rounded-3xl p-16 text-center shadow-lg shadow-primary/5">
            <span className="material-symbols-outlined text-6xl text-primary/20 mb-4 block">event_busy</span>
            <h3 className="text-xl font-extrabold text-primary mb-2">No tienes solicitudes aún</h3>
            <p className="text-on-surface-variant mb-6">Explora el catálogo de espacios y crea tu primera reserva.</p>
            <button 
              onClick={() => onNavigate("explorer")}
              className="px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-lg hover:scale-[1.02] transition-transform"
            >
              Ir a Espacios
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {requests.map((req) => {
              const statusInfo = STATUS_LABELS[req.status] || { label: req.status, color: '#4b5563', bg: '#f3f4f6', icon: 'info' };
              const placeName = places[req.placeId] || `Espacio #${req.placeId}`;
              
              return (
                <article 
                  key={req.id} 
                  className="bg-white rounded-2xl border border-surface-container-high overflow-hidden shadow-sm hover:shadow-md transition-shadow relative"
                  style={{ borderLeft: `6px solid ${statusInfo.color}` }}
                >
                  <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6">
                    
                    {/* Date Block */}
                    <div className="flex-shrink-0 md:w-48">
                      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Fecha Solicitada</p>
                      <p className="font-extrabold text-primary text-lg">{formatDateOnly(req.requestedStartTime)}</p>
                      <p className="text-sm font-semibold text-primary/70">{formatTimeRange(req.requestedStartTime, req.requestedEndTime)}</p>
                      <p className="text-xs text-on-surface-variant mt-2">
                        Enviada el: {formatDateOnly(req.requestedAt)}
                      </p>
                    </div>

                    {/* Divider */}
                    <div className="hidden md:block w-px h-16 bg-surface-container-highest"></div>

                    {/* Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="font-headline text-xl font-extrabold text-primary">
                          {placeName}
                        </h3>
                        <span 
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap"
                          style={{ backgroundColor: statusInfo.bg, color: statusInfo.color }}
                        >
                          <span className="material-symbols-outlined text-[14px]">{statusInfo.icon}</span>
                          {statusInfo.label}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm mt-3">
                        <span className="inline-flex items-center gap-1.5 bg-surface-container-low px-3 py-1.5 rounded-lg text-primary font-semibold">
                          <span className="material-symbols-outlined text-[16px] text-primary/60">category</span>
                          {req.activityType || 'Actividad General'}
                        </span>
                        <span className="text-on-surface-variant italic truncate max-w-sm">
                          "{req.reason || 'Sin motivo especificado'}"
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Reject / Changes Reason Block */}
                  {(req.status === 'REJECTED' || req.status === 'CHANGES_REQUESTED') && (
                    <div className="bg-slate-50 border-t border-surface-container-high p-4 md:px-8 text-sm">
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-red-600 mt-0.5">feedback</span>
                        <div>
                          <p className="font-bold text-slate-800 mb-0.5">Mensaje del Administrador:</p>
                          <p className="text-slate-600">{req.changesRequestedReason || "No se especificó un motivo."}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8">
                <button
                  disabled={page === 0}
                  onClick={() => fetchData(page - 1)}
                  className={`px-4 py-2 rounded-lg font-bold border border-surface-container-high transition-colors ${page === 0 ? 'bg-surface-container-lowest text-on-surface-variant/50 cursor-not-allowed' : 'bg-white text-primary hover:bg-surface-container-lowest'}`}
                >
                  Anterior
                </button>
                <span className="text-sm font-bold text-on-surface-variant">
                  Página {page + 1} de {totalPages}
                </span>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => fetchData(page + 1)}
                  className={`px-4 py-2 rounded-lg font-bold border border-surface-container-high transition-colors ${page >= totalPages - 1 ? 'bg-surface-container-lowest text-on-surface-variant/50 cursor-not-allowed' : 'bg-white text-primary hover:bg-surface-container-lowest'}`}
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
