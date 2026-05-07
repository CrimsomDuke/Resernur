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
  PENDING: { label: 'Pendiente', color: '#d97706', bg: '#fef3c7' },
  ACCEPTED: { label: 'Aprobada', color: '#059669', bg: '#d1fae5' },
  REJECTED: { label: 'Rechazada', color: '#dc2626', bg: '#fee2e2' },
  CHANGES_REQUESTED: { label: 'Cambios solicitados', color: '#7c3aed', bg: '#ede9fe' },
};

export default function AdminRequestsView() {
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [totalPending, setTotalPending] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedReq, setSelectedReq] = useState(null);
  const [userCache, setUserCache] = useState({});
  const [placeCache, setPlaceCache] = useState({});
  const [detailLoading, setDetailLoading] = useState(false);

  // Reject modal
  const [rejectModal, setRejectModal] = useState(null); // { id, type: 'reject'|'changes' }
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState(null); // { ok, text }

  // Recent decisions feed
  const [feed, setFeed] = useState([]);

  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 10;

  // ---------------------------------------------------------------------------
  // Fetch requests
  // ---------------------------------------------------------------------------
  const fetchRequests = useCallback(async (p = 0) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API}/api/booking-requests?status=${statusFilter}&page=${p}&pageSize=${PAGE_SIZE}`,
        { headers: authHeaders() }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRequests(data.content ?? []);
      setTotalPending(data.totalElements ?? 0);
      setTotalPages(data.totalPages ?? 1);
      setPage(p);
    } catch (e) {
      setError('No se pudieron cargar las solicitudes. Verifica la conexión.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchRequests(0); }, [fetchRequests]);

  // ---------------------------------------------------------------------------
  // Fetch user / place for detail panel (cached)
  // ---------------------------------------------------------------------------
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

  const handleSelectRequest = async (req) => {
    setSelectedReq(req);
    setDetailLoading(true);
    await Promise.all([fetchUser(req.userId), fetchPlace(req.placeId)]);
    setDetailLoading(false);
  };

  // Prefetch names for the table
  useEffect(() => {
    requests.forEach(req => {
      fetchUser(req.userId);
      fetchPlace(req.placeId);
    });
  }, [requests, fetchUser, fetchPlace]);

  // ---------------------------------------------------------------------------
  // Actions: accept / reject / request-changes
  // ---------------------------------------------------------------------------
  const handleAccept = async (id) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/api/booking-requests/${id}/accept`, {
        method: 'POST',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.errorMessage || 'Error al aprobar');
      setActionMsg({ ok: true, text: 'Solicitud aprobada correctamente.' });
      addFeedEntry(id, 'ACCEPTED');
      
      const req = requests.find((r) => r.id === id);
      const placeName = req ? (placeCache[req.placeId]?.name ?? `Espacio #${req.placeId}`) : `#${id}`;

      setSelectedReq(null);
      fetchRequests(page);
    } catch (e) {
      setActionMsg({ ok: false, text: e.message });
    } finally {
      setActionLoading(false);
      setTimeout(() => setActionMsg(null), 3500);
    }
  };

  const handleOpenReject = (id, type = 'reject') => {
    setRejectReason('');
    setRejectModal({ id, type });
  };

  const handleConfirmReject = async () => {
    if (!rejectModal) return;
    const { id, type } = rejectModal;
    const endpoint = type === 'changes'
      ? `${API}/api/booking-requests/${id}/request-changes`
      : `${API}/api/booking-requests/${id}/reject`;

    setActionLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ reason: rejectReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.errorMessage || 'Error al procesar');
      const label = type === 'changes' ? 'Cambios solicitados.' : 'Solicitud rechazada.';
      setActionMsg({ ok: true, text: label });
      addFeedEntry(id, type === 'changes' ? 'CHANGES_REQUESTED' : 'REJECTED', rejectReason);
      
      const req = requests.find((r) => r.id === id);
      const placeName = req ? (placeCache[req.placeId]?.name ?? `Espacio #${req.placeId}`) : `#${id}`;

      setSelectedReq(null);
      setRejectModal(null);
      fetchRequests(page);
    } catch (e) {
      setActionMsg({ ok: false, text: e.message });
    } finally {
      setActionLoading(false);
      setTimeout(() => setActionMsg(null), 3500);
    }
  };

  const addFeedEntry = (reqId, status, reason = '') => {
    const req = requests.find((r) => r.id === reqId);
    const place = req ? (placeCache[req.placeId]?.name ?? `Espacio #${req.placeId}`) : `#${reqId}`;
    setFeed((prev) => [
      {
        id: Date.now(),
        status,
        place,
        reason,
        time: new Date(),
      },
      ...prev.slice(0, 9),
    ]);
  };

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------
  const selectedUser = selectedReq ? userCache[selectedReq.userId] : null;
  const selectedPlace = selectedReq ? placeCache[selectedReq.placeId] : null;

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Toast ── */}
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

      {/* ── Page header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-on-surface-variant, #43474f)', marginBottom: '0.25rem' }}>
            Gestión / Cola de Aprobación
          </p>
          <h2 style={{ fontFamily: 'var(--font-headline, Manrope, sans-serif)', fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary, #001e40)', margin: 0 }}>
            Gestión de Solicitudes
          </h2>
          {!loading && (
            <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem', fontSize: '0.875rem', color: 'var(--color-on-surface-variant, #43474f)', fontWeight: 500 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusFilter === 'PENDING' ? '#d97706' : (statusFilter === 'REJECTED' ? '#dc2626' : '#7c3aed'), display: 'inline-block' }} />
              {totalPending} {statusFilter === 'PENDING' ? 'Solicitudes pendientes' : (statusFilter === 'REJECTED' ? 'Solicitudes rechazadas' : 'Cambios solicitados')}
            </p>
          )}
        </div>
      </div>

      {/* ── Status Tabs ── */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--color-surface-container-high, #e6e8ea)' }}>
        {[
          { id: 'PENDING', label: 'Pendientes' },
          { id: 'REJECTED', label: 'Rechazadas' },
          { id: 'CHANGES_REQUESTED', label: 'Cambios Solicitados' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setStatusFilter(tab.id); setSelectedReq(null); }}
            style={{
              padding: '0.75rem 1rem', background: 'none', border: 'none',
              borderBottom: statusFilter === tab.id ? '3px solid var(--color-primary, #001e40)' : '3px solid transparent',
              color: statusFilter === tab.id ? 'var(--color-primary, #001e40)' : 'var(--color-on-surface-variant, #43474f)',
              fontWeight: statusFilter === tab.id ? 800 : 600,
              cursor: 'pointer', fontSize: '0.875rem', transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Two-column layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>

        {/* ── Left column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 0 }}>

          {/* Requests table */}
          <div style={{ background: '#fff', borderRadius: '0.75rem', border: '1px solid var(--color-surface-container-high, #e6e8ea)', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,30,64,0.06)' }}>
            {/* Table header bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', background: 'rgba(0,30,64,0.04)', borderBottom: '1px solid var(--color-surface-container-high, #e6e8ea)' }}>
              <span style={{ fontFamily: 'var(--font-headline, Manrope, sans-serif)', fontWeight: 700, color: 'var(--color-primary, #001e40)' }}>
                Cola de Aprobación
              </span>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-on-surface-variant, #43474f)' }}>
                {loading ? 'Cargando...' : `${requests.length} de ${totalPending}`}
              </span>
            </div>

            {/* Error */}
            {error && (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#dc2626', background: '#fee2e2' }}>{error}</div>
            )}

            {/* Loading skeleton */}
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

            {/* Table */}
            {!loading && !error && (
              <div style={{ overflowX: 'auto' }}>
                {requests.length === 0 ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-on-surface-variant, #43474f)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 48, marginBottom: '0.5rem', display: 'block' }}>inbox</span>
                    No hay solicitudes pendientes. ¡Todo al día!
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ background: 'rgba(0,30,64,0.03)', borderBottom: '1px solid var(--color-surface-container-high, #e6e8ea)' }}>
                        {['Fecha / Hora', 'Solicitante', 'Espacio', 'Motivo', 'Acciones'].map((h) => (
                          <th key={h} style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-on-surface-variant, #43474f)', whiteSpace: 'nowrap' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((req) => {
                        const isSelected = selectedReq?.id === req.id;
                        return (
                          <tr
                            key={req.id}
                            onClick={() => handleSelectRequest(req)}
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
                            {/* Date/Time */}
                            <td style={{ padding: '1rem 1.25rem', whiteSpace: 'nowrap' }}>
                              <p style={{ fontWeight: 600, color: 'var(--color-primary, #001e40)', fontSize: '0.8rem' }}>
                                {formatDateOnly(req.requestedStartTime)}
                              </p>
                              <p style={{ fontSize: '0.7rem', color: 'var(--color-on-surface-variant, #43474f)', marginTop: 2 }}>
                                {formatTimeRange(req.requestedStartTime, req.requestedEndTime)}
                              </p>
                            </td>

                            {/* Requester */}
                            <td style={{ padding: '1rem 1.25rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.7rem', color: '#1e40af', flexShrink: 0 }}>
                                  {initials(userCache[req.userId]?.fullName || `U${req.userId}`)}
                                </div>
                                <div>
                                  <p style={{ fontWeight: 600, color: 'var(--color-on-surface, #191c1e)', lineHeight: 1.2 }}>
                                    {userCache[req.userId]?.fullName || `Usuario #${req.userId}`}
                                  </p>
                                  <p style={{ fontSize: '0.65rem', color: 'var(--color-on-surface-variant, #43474f)', marginTop: 2 }}>
                                    {userCache[req.userId]?.email || ''}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Space */}
                            <td style={{ padding: '1rem 1.25rem', fontWeight: 500, color: 'var(--color-on-surface, #191c1e)' }}>
                              {placeCache[req.placeId]?.name || `Espacio #${req.placeId}`}
                            </td>

                            {/* Reason */}
                            <td style={{ padding: '1rem 1.25rem', color: 'var(--color-on-surface-variant, #43474f)', fontStyle: 'italic', maxWidth: 160 }}>
                              <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {req.reason || req.activityType || '—'}
                              </span>
                            </td>

                            {/* Actions */}
                            <td style={{ padding: '1rem 1.25rem' }}>
                              {statusFilter === 'PENDING' ? (
                                <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-start' }} onClick={(e) => e.stopPropagation()}>
                                  <button
                                    title="Aprobar"
                                    onClick={() => handleAccept(req.id)}
                                    style={{ width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer', background: '#d1fae5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = '#059669'; e.currentTarget.style.color = '#fff'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = '#d1fae5'; e.currentTarget.style.color = '#059669'; }}
                                  >
                                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span>
                                  </button>
                                  <button
                                    title="Rechazar"
                                    onClick={() => handleOpenReject(req.id, 'reject')}
                                    style={{ width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.color = '#fff'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#dc2626'; }}
                                  >
                                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                                  </button>
                                  <button
                                    title="Pedir cambios"
                                    onClick={() => handleOpenReject(req.id, 'changes')}
                                    style={{ width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer', background: '#ede9fe', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = '#7c3aed'; e.currentTarget.style.color = '#fff'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = '#ede9fe'; e.currentTarget.style.color = '#7c3aed'; }}
                                  >
                                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit_note</span>
                                  </button>
                                </div>
                              ) : (
                                <span style={{ display: 'inline-block', padding: '0.25rem 0.5rem', borderRadius: 4, background: STATUS_LABELS[req.status]?.bg || '#f3f4f6', color: STATUS_LABELS[req.status]?.color || '#4b5563', fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase' }}>
                                  {STATUS_LABELS[req.status]?.label || req.status}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', padding: '1rem', borderTop: '1px solid var(--color-surface-container-high, #e6e8ea)' }}>
                <button
                  disabled={page === 0}
                  onClick={() => fetchRequests(page - 1)}
                  style={{ padding: '0.4rem 0.75rem', borderRadius: 8, border: '1px solid #e6e8ea', cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.4 : 1, background: '#fff', fontWeight: 600, fontSize: '0.8rem' }}
                >
                  ← Anterior
                </button>
                <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.8rem', color: 'var(--color-on-surface-variant, #43474f)', padding: '0 0.5rem' }}>
                  Página {page + 1} de {totalPages}
                </span>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => fetchRequests(page + 1)}
                  style={{ padding: '0.4rem 0.75rem', borderRadius: 8, border: '1px solid #e6e8ea', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', opacity: page >= totalPages - 1 ? 0.4 : 1, background: '#fff', fontWeight: 600, fontSize: '0.8rem' }}
                >
                  Siguiente →
                </button>
              </div>
            )}
          </div>

          {/* Detail panel */}
          {selectedReq && (
            <div style={{ background: '#fff', borderRadius: '0.75rem', border: '1px solid var(--color-surface-container-high, #e6e8ea)', borderLeft: '4px solid #d97706', boxShadow: '0 4px 16px rgba(0,30,64,0.08)', overflow: 'hidden' }}>
              {/* Panel header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', background: 'rgba(0,30,64,0.03)', borderBottom: '1px solid var(--color-surface-container-high, #e6e8ea)' }}>
                <span style={{ fontFamily: 'var(--font-headline, Manrope, sans-serif)', fontWeight: 700, color: 'var(--color-primary, #001e40)' }}>
                  Detalle de Solicitud #{selectedReq.id}
                </span>
                <button
                  onClick={() => setSelectedReq(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-on-surface-variant, #43474f)', display: 'flex', alignItems: 'center' }}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {detailLoading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-on-surface-variant, #43474f)' }}>
                  Cargando detalles...
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                  {/* Left: requester + space */}
                  <div style={{ padding: '1.5rem', borderRight: '1px solid var(--color-surface-container, #eceef0)' }}>
                    {/* Requester */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div style={{ width: 56, height: 56, borderRadius: '0.75rem', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem', color: '#1e40af', flexShrink: 0 }}>
                        {initials(selectedUser?.fullName || `U${selectedReq.userId}`)}
                      </div>
                      <div>
                        <h3 style={{ fontFamily: 'var(--font-headline, Manrope, sans-serif)', fontWeight: 700, color: 'var(--color-primary, #001e40)', margin: '0 0 0.2rem' }}>
                          {selectedUser?.fullName || `Usuario #${selectedReq.userId}`}
                        </h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-secondary, #4a607d)', fontWeight: 500, margin: 0 }}>
                          {selectedUser?.role || ''}
                        </p>
                        {selectedUser?.email && (
                          <p style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--color-on-surface-variant, #43474f)', marginTop: '0.4rem' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>mail</span>
                            {selectedUser.email}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Time range */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-on-surface-variant, #43474f)', marginBottom: '0.5rem' }}>
                        Período Solicitado
                      </p>
                      <div style={{ background: 'var(--color-surface, #f8f9fb)', borderRadius: '0.5rem', padding: '0.75rem 1rem', fontSize: '0.85rem' }}>
                        <p style={{ fontWeight: 600, color: 'var(--color-primary, #001e40)', margin: 0 }}>
                          {formatDateTime(selectedReq.requestedStartTime)}
                        </p>
                        <p style={{ color: 'var(--color-on-surface-variant, #43474f)', margin: '0.2rem 0 0', fontSize: '0.8rem' }}>
                          hasta {formatDateTime(selectedReq.requestedEndTime)}
                        </p>
                      </div>
                    </div>

                    {/* Reason */}
                    {selectedReq.reason && (
                      <div style={{ marginBottom: '1.5rem' }}>
                        <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-on-surface-variant, #43474f)', marginBottom: '0.5rem' }}>
                          Motivo
                        </p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-on-surface, #191c1e)', fontStyle: 'italic', margin: 0 }}>
                          "{selectedReq.reason}"
                        </p>
                      </div>
                    )}

                    {/* Space details */}
                    <div>
                      <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-on-surface-variant, #43474f)', marginBottom: '0.5rem' }}>
                        Detalles del Espacio
                      </p>
                      <div style={{ background: 'var(--color-surface, #f8f9fb)', borderRadius: '0.5rem', padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <span style={{ fontFamily: 'var(--font-headline, Manrope, sans-serif)', fontWeight: 700, color: 'var(--color-primary, #001e40)', fontSize: '0.9rem' }}>
                            {selectedPlace?.name || `Espacio #${selectedReq.placeId}`}
                          </span>
                          {selectedPlace?.capacity > 0 && (
                            <span style={{ padding: '0.15rem 0.5rem', background: '#dbeafe', color: '#1e40af', fontSize: '0.65rem', fontWeight: 700, borderRadius: 4 }}>
                              Cap: {selectedPlace.capacity}
                            </span>
                          )}
                        </div>
                        {selectedPlace?.description && (
                          <p style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant, #43474f)', margin: 0 }}>
                            {selectedPlace.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: activity type + action buttons */}
                  <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Activity type badge */}
                    <div>
                      <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-on-surface-variant, #43474f)', marginBottom: '0.5rem' }}>
                        Tipo de Actividad
                      </p>
                      <span style={{ display: 'inline-block', padding: '0.3rem 0.75rem', borderRadius: 6, background: '#ede9fe', color: '#5b21b6', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {selectedReq.activityType || '—'}
                      </span>
                    </div>

                    {/* Attachment */}
                    {selectedReq.attachmentFileId && (
                      <div>
                        <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-on-surface-variant, #43474f)', marginBottom: '0.5rem' }}>
                          Archivo Adjunto
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', border: '1px solid #e6e8ea', borderRadius: '0.5rem' }}>
                          <span className="material-symbols-outlined" style={{ color: '#dc2626', fontSize: 20 }}>picture_as_pdf</span>
                          <div>
                            <p style={{ fontWeight: 600, fontSize: '0.8rem', margin: 0 }}>Documento adjunto</p>
                            <p style={{ fontSize: '0.7rem', color: 'var(--color-on-surface-variant, #43474f)', margin: 0 }}>ID #{selectedReq.attachmentFileId}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Solicitud desde */}
                    <div>
                      <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-on-surface-variant, #43474f)', marginBottom: '0.25rem' }}>
                        Enviada el
                      </p>
                      <p style={{ fontSize: '0.825rem', color: 'var(--color-on-surface, #191c1e)', margin: 0 }}>
                        {formatDateTime(selectedReq.requestedAt)}
                      </p>
                    </div>

                    {/* Spacer */}
                    <div style={{ flex: 1 }} />

                    {/* Action buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <button
                        disabled={actionLoading}
                        onClick={() => handleAccept(selectedReq.id)}
                        style={{ padding: '0.75rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #059669, #047857)', color: '#fff', fontWeight: 700, fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: actionLoading ? 0.7 : 1 }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>
                        Aprobar Solicitud
                      </button>
                      <button
                        disabled={actionLoading}
                        onClick={() => handleOpenReject(selectedReq.id, 'changes')}
                        style={{ padding: '0.75rem', borderRadius: '0.75rem', border: '2px solid var(--color-primary, #001e40)', cursor: 'pointer', background: 'transparent', color: 'var(--color-primary, #001e40)', fontWeight: 700, fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit_note</span>
                        Pedir Cambios
                      </button>
                      <button
                        disabled={actionLoading}
                        onClick={() => handleOpenReject(selectedReq.id, 'reject')}
                        style={{ padding: '0.75rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', background: '#dc2626', color: '#fff', fontWeight: 700, fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: actionLoading ? 0.7 : 1 }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>cancel</span>
                        Rechazar Solicitud
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right sidebar: recent feed ── */}
        <div style={{ position: 'sticky', top: '2rem' }}>
          <div style={{ background: 'var(--color-surface-container-low, #f2f4f6)', borderRadius: '0.75rem', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontFamily: 'var(--font-headline, Manrope, sans-serif)', fontWeight: 700, color: 'var(--color-primary, #001e40)', margin: 0 }}>
                Historial de Decisiones
              </h3>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-on-surface-variant, #43474f)' }}>history</span>
            </div>

            {feed.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--color-on-surface-variant, #43474f)', textAlign: 'center', padding: '1rem 0', fontStyle: 'italic' }}>
                Las decisiones tomadas en esta sesión aparecerán aquí.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {feed.map((entry, i) => {
                  const isAccepted = entry.status === 'ACCEPTED';
                  const isRejected = entry.status === 'REJECTED';
                  const dotColor = isAccepted ? '#059669' : isRejected ? '#dc2626' : '#7c3aed';
                  const isLast = i === feed.length - 1;
                  return (
                    <div key={entry.id} style={{ position: 'relative', paddingLeft: '1.5rem', paddingBottom: isLast ? 0 : '1.25rem', borderLeft: isLast ? 'none' : `2px solid ${dotColor}30` }}>
                      <div style={{ position: 'absolute', left: -8, top: 2, width: 14, height: 14, borderRadius: '50%', background: dotColor, border: '2px solid #fff' }} />
                      <p style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--color-primary, #001e40)', margin: '0 0 0.15rem' }}>
                        {isAccepted ? 'Aprobada' : isRejected ? 'Rechazada' : 'Cambios pedidos'} — {entry.place}
                      </p>
                      {entry.reason && (
                        <p style={{ fontSize: '0.7rem', color: 'var(--color-on-surface-variant, #43474f)', margin: '0 0 0.15rem', fontStyle: 'italic' }}>
                          "{entry.reason}"
                        </p>
                      )}
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af' }}>
                        {entry.time.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── Reject / Changes modal ── */}
      {rejectModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}
          onClick={(e) => { if (e.target === e.currentTarget) setRejectModal(null); }}
        >
          <div style={{ background: '#fff', borderRadius: '1rem', padding: '2rem', width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontFamily: 'var(--font-headline, Manrope, sans-serif)', fontWeight: 800, color: 'var(--color-primary, #001e40)', marginTop: 0, marginBottom: '0.5rem' }}>
              {rejectModal.type === 'changes' ? 'Solicitar Cambios' : 'Rechazar Solicitud'}
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-on-surface-variant, #43474f)', marginBottom: '1.25rem' }}>
              {rejectModal.type === 'changes'
                ? 'Explica al solicitante qué debe modificar en su solicitud.'
                : 'Indica el motivo del rechazo. El solicitante será notificado.'}
            </p>
            <textarea
              autoFocus
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Escribe el motivo aquí..."
              style={{ width: '100%', borderRadius: '0.5rem', border: '1px solid #e6e8ea', padding: '0.75rem', fontSize: '0.875rem', resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setRejectModal(null)}
                style={{ padding: '0.6rem 1.25rem', borderRadius: '0.5rem', border: '1px solid #e6e8ea', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}
              >
                Cancelar
              </button>
              <button
                disabled={!rejectReason.trim() || actionLoading}
                onClick={handleConfirmReject}
                style={{
                  padding: '0.6rem 1.25rem', borderRadius: '0.5rem', border: 'none', cursor: !rejectReason.trim() || actionLoading ? 'not-allowed' : 'pointer',
                  background: rejectModal.type === 'changes' ? '#7c3aed' : '#dc2626', color: '#fff', fontWeight: 700, fontSize: '0.875rem',
                  opacity: !rejectReason.trim() || actionLoading ? 0.5 : 1,
                }}
              >
                {actionLoading ? 'Procesando...' : rejectModal.type === 'changes' ? 'Enviar Cambios' : 'Confirmar Rechazo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
