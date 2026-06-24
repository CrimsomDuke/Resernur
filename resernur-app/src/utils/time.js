export function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('es-BO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatDateOnly(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatTimeRange(start, end) {
  if (!start || !end) return '—';
  const s = new Date(start);
  const e = new Date(end);
  const fmt = (d) => d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
  return `${fmt(s)} – ${fmt(e)}`;
}