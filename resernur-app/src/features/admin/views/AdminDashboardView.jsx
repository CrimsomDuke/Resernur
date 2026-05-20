import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000';

function getAuthHeaders() {
  const token = localStorage.getItem('resernur_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchTotalElements(url) {
  const res = await fetch(url, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  // PagedResponse from Spring returns totalElements
  return data.totalElements ?? 0;
}

const METRIC_DEFINITIONS = [
  {
    key: 'users',
    label: 'Usuarios totales',
    icon: 'group',
    accent: 'bg-primary-fixed text-primary',
  },
  {
    key: 'active',
    label: 'Reservas activas',
    icon: 'calendar_month',
    accent: 'bg-surface-container-high text-primary',
  },
  {
    key: 'pending',
    label: 'Solicitudes pendientes',
    icon: 'pending_actions',
    accent: 'bg-tertiary-fixed text-tertiary',
  },
];

export default function AdminDashboardView({ onNavigate }) {
  const [metrics, setMetrics] = useState({ users: null, active: null, pending: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    Promise.all([
      fetchTotalElements(`${API_BASE}/api/users?page=0&pageSize=1`),
      fetchTotalElements(`${API_BASE}/api/bookings?status=COMPLETED&page=0&pageSize=1`),
      fetchTotalElements(`${API_BASE}/api/booking-requests?status=PENDING&page=0&pageSize=1`),
    ])
      .then(([users, active, pending]) => {
        setMetrics({ users, active, pending });
      })
      .catch(() => {
        setError('No se pudieron cargar las métricas. Verifica la conexión con el servidor.');
      })
      .finally(() => setLoading(false));
  }, []);

  const metricValues = {
    users: metrics.users?.toLocaleString('es-BO') ?? '—',
    active: metrics.active?.toLocaleString('es-BO') ?? '—',
    pending: metrics.pending?.toLocaleString('es-BO') ?? '—',
  };

  return (
    <section className="space-y-6">
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 text-sm font-medium">
          <span className="material-symbols-outlined text-[20px] shrink-0">error</span>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
        {METRIC_DEFINITIONS.map((def) => (
          <article
            key={def.key}
            onClick={() => {
              if (def.key === 'pending') {
                onNavigate?.('requests');
              } else if (def.key === 'active') {
                onNavigate?.('reservations');
              } else if (def.key === 'users') {
                onNavigate?.('dashboard');
              }
            }}
            className="rounded-xl p-5 border bg-surface-container-lowest border-surface-container-high shadow-[0_4px_18px_0_rgba(0,30,64,0.04)] hover:shadow-[0_8px_24px_0_rgba(0,30,64,0.08)] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-md ${def.accent} group-hover:scale-110 transition-transform`}>
                <span className="material-symbols-outlined">{def.icon}</span>
              </div>
              {loading && (
                <div className="h-2 w-10 rounded-full bg-surface-container-high animate-pulse" />
              )}
            </div>

            <p className="text-sm text-on-surface-variant">{def.label}</p>

            {loading ? (
              <div className="mt-2 h-9 w-24 rounded-lg bg-surface-container-high animate-pulse" />
            ) : (
              <p className="font-headline text-4xl font-bold mt-1 text-on-surface">
                {metricValues[def.key]}
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
