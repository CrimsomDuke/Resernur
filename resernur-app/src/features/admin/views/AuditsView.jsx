import React, { useState, useEffect } from 'react';

// Mapping de iconos según el tipo de recurso
const getResourceIcon = (entityName) => {
  const iconMap = {
    BOOKINGS: 'event_seat',
    PLACES: 'domain',
    USERS: 'person',
    REQUESTS: 'pending_actions',
    ROLES: 'security',
    REPORTS: 'picture_as_pdf',
    default: 'info'
  };
  return iconMap[entityName] || iconMap.default;
};

// Mapping de acciones a iconos de color
const getActionColor = (action) => {
  const colorMap = {
    CREATE: 'bg-emerald-500',
    READ: 'bg-blue-500',
    UPDATE: 'bg-orange-500',
    DELETE: 'bg-red-500',
    APPROVE: 'bg-green-500',
    REJECT: 'bg-red-500'
  };
  return colorMap[action] || 'bg-gray-500';
};

// Formatear fecha y hora desde timestamp
const formatDateTime = (timestamp) => {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;

  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const AuditRow = ({ log, adminUsers, onShowDetails }) => {
  const adminUser = adminUsers.find((u) => u.id === log.executorId);
  const adminName = adminUser?.name || `Admin ${log.executorId}`;
  const resourceIcon = getResourceIcon(log.entityName);
  const actionColor = getActionColor(log.action);
  const dateTime = formatDateTime(log.timestamp);

  return (
    <tr className="hover:bg-surface-container-low transition-colors group border-b border-outline-variant/10">
      <td className="px-6 py-4 align-middle">
        <div className="flex flex-col">
          <span className="font-body-semibold text-primary">{dateTime}</span>
          <span className="text-caption-micro text-on-surface-variant uppercase">{adminName}</span>
        </div>
      </td>
      <td className="px-6 py-4 align-middle">
        <div className="flex items-center gap-3">
          <img
            className="w-8 h-8 rounded-full border border-outline-variant/50"
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${adminName}`}
            alt={adminName}
          />
          <div className="flex flex-col">
            <span className="text-body-base font-body-semibold">{adminName}</span>
            <span className="text-caption-micro text-on-surface-variant">ID: {log.executorId}</span>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 align-middle">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${actionColor}`}></span>
          <span className="text-body-base">{log.action} - {log.description}</span>
        </div>
      </td>
      <td className="px-6 py-4 align-middle">
        <div className="flex items-center gap-2 px-3 py-1 bg-secondary-container/30 text-on-secondary-container rounded-full w-fit">
          <span className="material-symbols-outlined text-[16px]">{resourceIcon}</span>
          <span className="text-[12px] font-body-semibold">{log.entityName} #{log.entityId}</span>
        </div>
      </td>
      <td className="px-6 py-4 align-middle text-right">
        <button onClick={() => onShowDetails && onShowDetails()} className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors" title={`Detalles: ${log.description}`}>
          <span className="material-symbols-outlined text-[20px]">visibility</span>
        </button>
      </td>
    </tr>
  );
};

export default function AuditsView() {
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedLog, setSelectedLog] = useState(null);
  const [actionType, setActionType] = useState('');
  const [adminFilter, setAdminFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [auditLogs, setAuditLogs] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para obtener los logs del backend
  useEffect(() => {
    const fetchAuditLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('resernur_token');
        if (!token) {
          setError('No hay sesión activa. Por favor inicia sesión.');
          setLoading(false);
          return;
        }

        const params = new URLSearchParams();
        if (adminFilter && adminFilter.trim()) params.append('executorId', adminFilter);
        if (actionType && actionType !== '') params.append('action', actionType);
        if (dateRange.start && dateRange.start !== '') params.append('startDate', dateRange.start);
        if (dateRange.end && dateRange.end !== '') params.append('endDate', dateRange.end);
        params.append('page', currentPage);
        params.append('pageSize', pageSize);

        const response = await fetch(`http://localhost:5000/api/audit-logs?${params.toString()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('resernur_token');
            setError('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
            return;
          }
          throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        setAuditLogs(data.content || []);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      } catch (err) {
        console.error('Error fetching audit logs:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLogs();
  }, [currentPage, pageSize, actionType, adminFilter, dateRange]);

  // Obtener lista de usuarios administradores
  useEffect(() => {
    const fetchAdminUsers = async () => {
      try {
        const token = localStorage.getItem('resernur_token');
        if (!token) return;

        const response = await fetch('http://localhost:5000/api/users?page=0&pageSize=200', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setAdminUsers(data.content || data || []);
        }
      } catch (err) {
        console.error('Error fetching admin users:', err);
      }
    };

    fetchAdminUsers();
  }, []);

  const startIndex = auditLogs.length > 0 ? currentPage * pageSize + 1 : 0;
  const endIndex = Math.min((currentPage + 1) * pageSize, totalElements);

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-label-caps font-label-caps text-on-primary-container tracking-[0.2em]">ADMIN SUITE</span>
          <h1 className="text-display-xl font-display-xl text-primary mt-1">Registro de Auditoría</h1>
          <p className="text-on-surface-variant mt-2 font-body-base">Monitoreo y trazabilidad de todas las acciones administrativas realizadas en ReserNur.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-surface-container-high text-primary font-body-semibold rounded-xl flex items-center gap-2 hover:bg-surface-variant transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">refresh</span>
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Bento Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="md:col-span-2 bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/30 shadow-sm flex flex-col gap-3">
          <label className="text-label-caps font-label-caps text-on-surface-variant">Rango de Fechas</label>
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">calendar_month</span>
              <input
                className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-lg text-body-base focus:ring-1 focus:ring-primary/20"
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
            </div>
            <span className="text-outline-variant">a</span>
            <div className="flex-1 relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">calendar_today</span>
              <input
                className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-lg text-body-base focus:ring-1 focus:ring-primary/20"
                placeholder="Hoy"
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/30 shadow-sm flex flex-col gap-3">
          <label className="text-label-caps font-label-caps text-on-surface-variant">Tipo de Acción</label>
          <select
            className="w-full bg-surface-container-low border-none rounded-lg text-body-base focus:ring-1 focus:ring-primary/20 py-2"
            value={actionType}
            onChange={(e) => {
              setActionType(e.target.value);
              setCurrentPage(0);
            }}
          >
            <option value="">Todas las acciones</option>
            <option value="CREATE">Creaciones</option>
            <option value="READ">Lectura</option>
            <option value="UPDATE">Modificaciones</option>
            <option value="DELETE">Eliminaciones</option>
            <option value="APPROVE">Aprobaciones</option>
            <option value="REJECT">Rechazos</option>
          </select>
        </div>
        <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/30 shadow-sm flex flex-col gap-3">
          <label className="text-label-caps font-label-caps text-on-surface-variant">ID Administrador</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">person_search</span>
            <input
              className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-lg text-body-base focus:ring-1 focus:ring-primary/20"
              placeholder="Filtrar por ID..."
              type="number"
              value={adminFilter}
              onChange={(e) => {
                setAdminFilter(e.target.value);
                setCurrentPage(0);
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Audit Table */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <span className="material-symbols-outlined text-[40px] text-primary animate-spin">hourglass_bottom</span>
              <p className="text-on-surface-variant mt-2">Cargando auditorías...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <span className="material-symbols-outlined text-[40px] text-error">error_outline</span>
              <p className="text-error mt-2">{error}</p>
            </div>
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <span className="material-symbols-outlined text-[40px] text-on-surface-variant opacity-50">inbox</span>
              <p className="text-on-surface-variant mt-2">No hay registros de auditoría</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-primary/5 border-b border-outline-variant/20">
                    <th className="px-6 py-4 text-label-caps font-label-caps text-on-surface-variant">Fecha / Hora</th>
                    <th className="px-6 py-4 text-label-caps font-label-caps text-on-surface-variant">Administrador</th>
                    <th className="px-6 py-4 text-label-caps font-label-caps text-on-surface-variant">Acción Realizada</th>
                    <th className="px-6 py-4 text-label-caps font-label-caps text-on-surface-variant">Recurso Afectado</th>
                    <th className="px-6 py-4 text-label-caps font-label-caps text-on-surface-variant text-right">Detalles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {auditLogs.map((log, idx) => (
                    <AuditRow
                      key={log.id ?? log.Id ?? `${log.executorId}-${log.entityName}-${log.timestamp}-${idx}`}
                      log={log}
                      adminUsers={adminUsers}
                      onShowDetails={() => setSelectedLog(log)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-surface-container-low px-6 py-4 flex items-center justify-between border-t border-outline-variant/20 flex-wrap gap-4">
              <span className="text-body-base text-on-surface-variant font-body-base">
                {`Mostrando ${startIndex}-${endIndex} de ${totalElements} registros`}
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant/30 text-on-surface-variant hover:bg-surface-variant transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>

                {Array.from({ length: Math.min(3, totalPages) }).map((_, idx) => (
                  <button
                    key={`page-${idx}`}
                    onClick={() => setCurrentPage(idx)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg font-body-semibold ${
                      currentPage === idx
                        ? 'bg-primary-container text-white shadow-sm'
                        : 'border border-outline-variant/30 text-on-surface-variant hover:bg-surface-variant'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}

                {totalPages > 3 && (
                  <>
                    <span className="px-2 text-outline-variant">...</span>
                    <button
                      key={`page-last-${totalPages}`}
                      onClick={() => setCurrentPage(totalPages - 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant/30 text-on-surface-variant hover:bg-surface-variant transition-colors"
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                <button
                  disabled={currentPage === totalPages - 1}
                  onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant/30 text-on-surface-variant hover:bg-surface-variant transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Summary Insights Bento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-primary-container text-white p-6 rounded-xl relative overflow-hidden shadow-md">
          <div className="relative z-10">
            <span className="text-label-caps opacity-70 tracking-widest">ACTIVIDAD TOTAL</span>
            <div className="text-[32px] font-display-xl font-extrabold mt-2">{totalElements}</div>
            <div className="flex items-center gap-2 mt-4 text-emerald-300">
              <span className="material-symbols-outlined text-[18px]">trending_up</span>
              <span className="text-body-semibold font-body-semibold">Registros en el sistema</span>
            </div>
          </div>
          <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-[120px] opacity-10">monitoring</span>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant/30 p-6 rounded-xl shadow-sm">
          <span className="text-label-caps text-on-surface-variant tracking-widest">ACCIONES POR TIPO</span>
          <div className="space-y-4 mt-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-body-base">Modificaciones (UPDATE)</span>
                <span className="font-body-semibold text-primary">45%</span>
              </div>
              <div className="w-full h-2 bg-surface-container-low rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: '45%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-body-base">Creaciones (CREATE)</span>
                <span className="font-body-semibold text-primary">30%</span>
              </div>
              <div className="w-full h-2 bg-surface-container-low rounded-full overflow-hidden">
                <div className="h-full bg-secondary" style={{ width: '30%' }}></div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant/30 p-6 rounded-xl shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-label-caps text-on-surface-variant tracking-widest">INFORMACIÓN DEL SISTEMA</span>
            <div className="flex items-center gap-3 mt-4">
              <div className="w-10 h-10 rounded-lg bg-error-container flex items-center justify-center text-on-error-container">
                <span className="material-symbols-outlined">info</span>
              </div>
              <div className="flex flex-col">
                <span className="text-body-semibold font-body-semibold">Auditoria Activa</span>
                <span className="text-caption-micro text-on-surface-variant">Sistema conectado a BD</span>
              </div>
            </div>
          </div>
          <button className="mt-4 w-full py-2 bg-surface-container-high text-primary font-body-semibold rounded-lg hover:bg-surface-variant transition-colors border border-outline-variant/30">
            Ver Más Estadísticas
          </button>
        </div>
      </div>

+      {/* Details modal */}
+      {selectedLog && (
+        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
+          <div className="bg-white dark:bg-surface-container-lowest w-11/12 md:w-2/3 lg:w-1/2 rounded-xl p-6 shadow-lg">
+            <div className="flex items-start justify-between">
+              <h3 className="text-lg font-body-semibold">Detalle de Auditoría</h3>
+              <button onClick={() => setSelectedLog(null)} className="text-on-surface-variant">Cerrar</button>
+            </div>
+            <div className="mt-4 space-y-3 text-body-base">
+              <div><strong>Fecha:</strong> {formatDateTime(selectedLog.timestamp)}</div>
+              <div><strong>Administrador (ID):</strong> {selectedLog.executorId}</div>
+              <div><strong>Acción:</strong> {selectedLog.action}</div>
+              <div><strong>Descripción:</strong> {selectedLog.description}</div>
+              <div><strong>Recurso:</strong> {selectedLog.entityName} #{selectedLog.entityId}</div>
+            </div>
+            <div className="mt-6 flex justify-end">
+              <button onClick={() => setSelectedLog(null)} className="px-4 py-2 bg-primary-container text-white rounded-lg">Cerrar</button>
+            </div>
+          </div>
+        </div>
+      )}
+
     </div>
   );
 }
