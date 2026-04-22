import React, { useState, useEffect, useCallback } from 'react';

const API = 'http://localhost:5000';

function authHeaders() {
  const token = localStorage.getItem('resernur_token');
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

function formatDateTime(iso) {
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

function initials(name) {
  if (!name) return '?';
  return name.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase();
}

const STATUS_LABELS = {
  ACTIVE: { label: 'Activa', color: '#059669', bg: '#d1fae5' },
  COMPLETED: { label: 'Completada', color: '#4b5563', bg: '#f3f4f6' },
  CANCELLED: { label: 'Cancelada', color: '#dc2626', bg: '#fee2e2' },
};

export default function AdminBookingsView() {
  const [bookings, setBookings] = useState([]);
  const [totalOngoing, setTotalOngoing] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [userCache, setUserCache] = useState({});
  const [placeCache, setPlaceCache] = useState({});
  const [detailLoading, setDetailLoading] = useState(false);

  const [cancelModal, setCancelModal] = useState(null); // id of booking to cancel
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState(null);

  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 10;

  const fetchBookings = useCallback(async (p = 0) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API}/api/bookings?ongoing=true&page=${p}&pageSize=${PAGE_SIZE}`,
        { headers: authHeaders() }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setBookings(data.content ?? []);
      setTotalOngoing(data.totalElements ?? 0);
      setTotalPages(data.totalPages ?? 1);
      setPage(p);
    } catch (e) {
      setError('No se pudieron cargar las reservas activas. Verifica la conexión.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookings(0); }, [fetchBookings]);

  const fetchUser = useCallback(async (id) => {
    if (!id || userCache[id]) return;
    try {
      const res = await fetch(`${API}/api/users/${id}`, { headers: authHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      const user = data.data ?? data;
      setUserCache((prev) => ({ ...prev, [id]: user }));
    } catch { /* silently ignore */ }
  }, [userCache]);

  const fetchPlace = useCallback(async (id) => {
    if (!id || placeCache[id]) return;
    try {
      const res = await fetch(`${API}/api/places/${id}`, { headers: authHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      const place = data.data ?? data;
      setPlaceCache((prev) => ({ ...prev, [id]: place }));
    } catch { /* silently ignore */ }
  }, [placeCache]);

  const handleSelectBooking = async (bk) => {
    setSelectedBooking(bk);
    setDetailLoading(true);
    // User comes from booking.bookingRequest.userId
    const userId = bk.bookingRequest?.userId;
    const promises = [fetchPlace(bk.placeId)];
    if (userId) promises.push(fetchUser(userId));
    await Promise.all(promises);
    setDetailLoading(false);
  };

  const handleCancelBooking = async () => {
    if (!cancelModal) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/api/bookings/${cancelModal}/cancel`, {
        method: 'POST',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.errorMessage || 'Error al cancelar');
      setActionMsg({ ok: true, text: 'Reserva cancelada correctamente.' });
      setSelectedBooking(null);
      setCancelModal(null);
      fetchBookings(page);
    } catch (e) {
      setActionMsg({ ok: false, text: e.message });
    } finally {
      setActionLoading(false);
      setTimeout(() => setActionMsg(null), 3500);
    }
  };

  const selectedUserId = selectedBooking?.bookingRequest?.userId;
  const selectedUser = selectedUserId ? userCache[selectedUserId] : null;
  const selectedPlace = selectedBooking ? placeCache[selectedBooking.placeId] : null;

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {actionMsg && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.875rem 1.25rem', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: 600,
          background: actionMsg.ok ? '#d1fae5' : '#fee2e2',
          color: actionMsg.ok ? '#065f46' : '#991b1b',
          border: `1px solid ${actionMsg.ok ? '#6ee7b7' : '#fca5a5'}`,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
            {actionMsg.ok ? 'check_circle' : 'error'}
          </span>
          {actionMsg.text}
        </div>
      )}

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-on-surface-variant, #43474f)', marginBottom: '0.25rem' }}>
            Gestión / Reservas Activas
          </p>
          <h2 style={{ fontFamily: 'var(--font-headline, Manrope, sans-serif)', fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary, #001e40)', margin: 0 }}>
            Reservas Aprobadas
          </h2>
          {!loading && (
            <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem', fontSize: '0.875rem', color: 'var(--color-on-surface-variant, #43474f)', fontWeight: 500 }}>
              <span className="material-symbols-outlined" style={{ color: '#059669', fontSize: 18 }}>event_available</span>
              {totalOngoing} reservas activas en curso o próximas
            </p>
          )}
        </div>
      </div>

      {/* Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedBooking ? '1fr 340px' : '1fr', gap: '1.5rem', alignItems: 'start', transition: 'grid-template-columns 0.3s ease' }}>

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 0 }}>
          
          <div style={{ background: '#fff', borderRadius: '0.75rem', border: '1px solid var(--color-surface-container-high, #e6e8ea)', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,30,64,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', background: 'rgba(0,30,64,0.04)', borderBottom: '1px solid var(--color-surface-container-high, #e6e8ea)' }}>
              <span style={{ fontFamily: 'var(--font-headline, Manrope, sans-serif)', fontWeight: 700, color: 'var(--color-primary, #001e40)' }}>
                Lista de Reservas
              </span>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-on-surface-variant, #43474f)' }}>
                {loading ? 'Cargando...' : `${bookings.length} de ${totalOngoing}`}
              </span>
            </div>

            {error && (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#dc2626', background: '#fee2e2' }}>{error}</div>
            )}

            {loading && !error && (
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{ display: 'flex', gap: '1rem', animation: 'pulse 1.5s infinite' }}>
                    <div style={{ width: 80, height: 40, borderRadius: 6, background: '#e6e8ea' }} />
                    <div style={{ flex: 1, height: 40, borderRadius: 6, background: '#e6e8ea' }} />
                    <div style={{ width: 120, height: 40, borderRadius: 6, background: '#e6e8ea' }} />
                  </div>
                ))}
              </div>
            )}

            {!loading && !error && (
              <div style={{ overflowX: 'auto' }}>
                {bookings.length === 0 ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-on-surface-variant, #43474f)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 48, marginBottom: '0.5rem', display: 'block' }}>event_busy</span>
                    No hay reservas activas en este momento.
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ background: 'rgba(0,30,64,0.03)', borderBottom: '1px solid var(--color-surface-container-high, #e6e8ea)' }}>
                        {['Fecha / Hora', 'Reservado Por', 'Espacio', 'Actividad', 'Estado', ''].map((h, i) => (
                          <th key={i} style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-on-surface-variant, #43474f)', whiteSpace: 'nowrap' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((bk) => {
                        const isSelected = selectedBooking?.id === bk.id;
                        const st = STATUS_LABELS[bk.status] || STATUS_LABELS.ACTIVE;
                        const reqUser = bk.bookingRequest?.userId;
                        
                        // We fetch async, so fallback nicely
                        const uName = userCache[reqUser]?.fullName || (reqUser ? `Usuario #${reqUser}` : 'Desconocido');
                        const pName = placeCache[bk.placeId]?.name || `Espacio #${bk.placeId}`;

                        return (
                          <tr
                            key={bk.id}
                            onClick={() => handleSelectBooking(bk)}
                            style={{
                              borderBottom: '1px solid var(--color-surface-container-low, #f2f4f6)',
                              cursor: 'pointer',
                              background: isSelected ? 'rgba(0,30,64,0.05)' : '#fff',
                              borderLeft: isSelected ? '4px solid var(--color-primary, #001e40)' : '4px solid transparent',
                              transition: 'background 0.15s',
                            }}
                            onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#f8f9fb'; }}
                            onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = '#fff'; }}
                          >
                            <td style={{ padding: '1rem 1.25rem', whiteSpace: 'nowrap' }}>
                              <p style={{ fontWeight: 600, color: 'var(--color-primary, #001e40)', fontSize: '0.8rem' }}>
                                {formatDateOnly(bk.startTime)}
                              </p>
                              <p style={{ fontSize: '0.7rem', color: 'var(--color-on-surface-variant, #43474f)', marginTop: 2 }}>
                                {formatTimeRange(bk.startTime, bk.endTime)}
                              </p>
                            </td>
                            <td style={{ padding: '1rem 1.25rem', fontWeight: 500, color: 'var(--color-on-surface, #191c1e)' }}>
                              {uName}
                            </td>
                            <td style={{ padding: '1rem 1.25rem', fontWeight: 500, color: 'var(--color-primary, #001e40)' }}>
                              {pName}
                            </td>
                            <td style={{ padding: '1rem 1.25rem' }}>
                              <span style={{ display: 'inline-block', padding: '0.25rem 0.5rem', borderRadius: 4, background: '#ede9fe', color: '#5b21b6', fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase' }}>
                                {bk.activityType || '—'}
                              </span>
                            </td>
                            <td style={{ padding: '1rem 1.25rem' }}>
                              <span style={{ display: 'inline-block', padding: '0.25rem 0.5rem', borderRadius: 4, background: st.bg, color: st.color, fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase' }}>
                                {st.label}
                              </span>
                            </td>
                            <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                              <span className="material-symbols-outlined" style={{ color: 'var(--color-on-surface-variant)', fontSize: 20 }}>chevron_right</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {!loading && totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', padding: '1rem', borderTop: '1px solid var(--color-surface-container-high, #e6e8ea)' }}>
                <button
                  disabled={page === 0}
                  onClick={() => fetchBookings(page - 1)}
                  style={{ padding: '0.4rem 0.75rem', borderRadius: 8, border: '1px solid #e6e8ea', cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.4 : 1, background: '#fff', fontWeight: 600, fontSize: '0.8rem' }}
                >
                  ← Anterior
                </button>
                <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.8rem', color: 'var(--color-on-surface-variant, #43474f)', padding: '0 0.5rem' }}>
                  Página {page + 1} de {totalPages}
                </span>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => fetchBookings(page + 1)}
                  style={{ padding: '0.4rem 0.75rem', borderRadius: 8, border: '1px solid #e6e8ea', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', opacity: page >= totalPages - 1 ? 0.4 : 1, background: '#fff', fontWeight: 600, fontSize: '0.8rem' }}
                >
                  Siguiente →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Detail Panel */}
        {selectedBooking && (
          <div style={{ background: '#fff', borderRadius: '0.75rem', border: '1px solid var(--color-surface-container-high, #e6e8ea)', borderTop: '4px solid #059669', boxShadow: '0 4px 16px rgba(0,30,64,0.08)', overflow: 'hidden', position: 'sticky', top: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', background: 'rgba(0,30,64,0.03)', borderBottom: '1px solid var(--color-surface-container-high, #e6e8ea)' }}>
              <span style={{ fontFamily: 'var(--font-headline, Manrope, sans-serif)', fontWeight: 700, color: 'var(--color-primary, #001e40)' }}>
                Reserva #{selectedBooking.id}
              </span>
              <button
                onClick={() => setSelectedBooking(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-on-surface-variant, #43474f)', display: 'flex', alignItems: 'center' }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {detailLoading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-on-surface-variant, #43474f)' }}>Cargando detalles...</div>
            ) : (
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '0.75rem', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', color: '#1e40af', flexShrink: 0 }}>
                    {initials(selectedUser?.fullName || `U${selectedUserId}`)}
                  </div>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-headline, Manrope, sans-serif)', fontWeight: 700, color: 'var(--color-primary, #001e40)', margin: '0 0 0.2rem' }}>
                      {selectedUser?.fullName || `Usuario #${selectedUserId}`}
                    </h3>
                    <p style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--color-on-surface-variant, #43474f)', margin: 0 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>mail</span>
                      {selectedUser?.email || '-'}
                    </p>
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-on-surface-variant, #43474f)', marginBottom: '0.5rem' }}>
                    Espacio y Horario
                  </p>
                  <div style={{ background: 'var(--color-surface, #f8f9fb)', borderRadius: '0.5rem', padding: '0.75rem 1rem' }}>
                    <p style={{ fontWeight: 700, color: 'var(--color-primary, #001e40)', margin: '0 0 0.3rem', fontSize: '0.9rem' }}>
                      {selectedPlace?.name || `Espacio #${selectedBooking.placeId}`}
                    </p>
                    <p style={{ color: 'var(--color-on-surface, #191c1e)', fontSize: '0.85rem', margin: 0, fontWeight: 500 }}>
                      {formatDateOnly(selectedBooking.startTime)}
                    </p>
                    <p style={{ color: 'var(--color-on-surface-variant, #43474f)', fontSize: '0.8rem', margin: 0 }}>
                      {formatTimeRange(selectedBooking.startTime, selectedBooking.endTime)}
                    </p>
                  </div>
                </div>

                {selectedBooking.bookingRequest?.reason && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-on-surface-variant, #43474f)', marginBottom: '0.5rem' }}>
                      Motivo de Uso
                    </p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-on-surface, #191c1e)', fontStyle: 'italic', margin: 0 }}>
                      "{selectedBooking.bookingRequest.reason}"
                    </p>
                  </div>
                )}

                <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button
                    disabled={actionLoading}
                    onClick={() => setCancelModal(selectedBooking.id)}
                    style={{ padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #fca5a5', cursor: 'pointer', background: '#fee2e2', color: '#dc2626', fontWeight: 700, fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: actionLoading ? 0.7 : 1 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>event_busy</span>
                    Cancelar Reserva
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {cancelModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}
          onClick={(e) => { if (e.target === e.currentTarget) setCancelModal(null); }}
        >
          <div style={{ background: '#fff', borderRadius: '1rem', padding: '2rem', width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontFamily: 'var(--font-headline, Manrope, sans-serif)', fontWeight: 800, color: '#dc2626', marginTop: 0, marginBottom: '0.5rem' }}>
              ¿Cancelar Reserva?
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-on-surface-variant, #43474f)', marginBottom: '1.25rem' }}>
              Esta acción no se puede deshacer. La reserva dejará de estar activa y el espacio volverá a estar disponible en el calendario.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setCancelModal(null)}
                style={{ padding: '0.6rem 1.25rem', borderRadius: '0.5rem', border: '1px solid #e6e8ea', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}
              >
                Cerrar
              </button>
              <button
                disabled={actionLoading}
                onClick={handleCancelBooking}
                style={{ padding: '0.6rem 1.25rem', borderRadius: '0.5rem', border: 'none', cursor: actionLoading ? 'not-allowed' : 'pointer', background: '#dc2626', color: '#fff', fontWeight: 700, fontSize: '0.875rem', opacity: actionLoading ? 0.5 : 1 }}
              >
                {actionLoading ? 'Cancelando...' : 'Sí, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
