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

const getAdminDisplayName = (adminUser, executorId) => {
  return (
    adminUser?.fullName ||
    adminUser?.name ||
    adminUser?.username ||
    adminUser?.email ||
    `Administrador ${executorId}`
  );
};

const getAdminUserById = (adminUsers, executorId) => {
  return adminUsers.find((user) => Number(user.id) === Number(executorId));
};

const AuditRow = ({ log, adminUsers, onShowDetails }) => {
  const adminUser = getAdminUserById(adminUsers, log.executorId);
  const adminName = getAdminDisplayName(adminUser, log.executorId);
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
        <button
          type="button"
          onClick={() => onShowDetails && onShowDetails(log)}
          className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors"
          title={`Detalles: ${log.description || log.action}`}
          aria-label={`Ver detalles del registro ${log.Id ?? log.id ?? ''}`}
        >
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
  const [refreshKey, setRefreshKey] = useState(0);

  const [auditLogs, setAuditLogs] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleShowDetails = (log) => {
    setSelectedLog(log);
  };

  const handleCloseDetails = () => {
    setSelectedLog(null);
  };

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
  }, [currentPage, pageSize, actionType, adminFilter, dateRange, refreshKey]);

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

  const startIndex = totalElements > 0 ? currentPage * pageSize + 1 : 0;
  const endIndex = Math.min(currentPage * pageSize + auditLogs.length, totalElements);

  // Calcular estadísticas de acciones dinámicamente
  const calculateActionStats = () => {
    if (auditLogs.length === 0) {
      return {
        CREATE: { count: 0, percentage: 0 },
        READ: { count: 0, percentage: 0 },
        UPDATE: { count: 0, percentage: 0 },
        DELETE: { count: 0, percentage: 0 },
        APPROVE: { count: 0, percentage: 0 },
        REJECT: { count: 0, percentage: 0 }
      };
    }

    const stats = {
      CREATE: { count: 0, percentage: 0 },
      READ: { count: 0, percentage: 0 },
      UPDATE: { count: 0, percentage: 0 },
      DELETE: { count: 0, percentage: 0 },
      APPROVE: { count: 0, percentage: 0 },
      REJECT: { count: 0, percentage: 0 }
    };

    // Contar ocurrencias de cada acción en la página actual
    auditLogs.forEach((log) => {
      if (stats[log.action]) {
        stats[log.action].count += 1;
      }
    });

    // Calcular porcentajes
    const total = auditLogs.length;
    Object.keys(stats).forEach((action) => {
      stats[action].percentage = Math.round((stats[action].count / total) * 100);
    });

    return stats;
  };

  const actionStats = calculateActionStats();

  // Obtener las 2 acciones más frecuentes para mostrar
  const topActions = Object.entries(actionStats)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 2)
    .filter((item) => item[1].count > 0);

  const getPaginationItems = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index);
    }

    const items = [0];
    let start = Math.max(1, currentPage - 1);
    let end = Math.min(totalPages - 2, currentPage + 1);

    if (currentPage <= 2) {
      start = 1;
      end = 3;
    } else if (currentPage >= totalPages - 3) {
      start = totalPages - 4;
      end = totalPages - 2;
    }

    if (start > 1) {
      items.push('ellipsis-start');
    }

    for (let page = start; page <= end; page += 1) {
      items.push(page);
    }

    if (end < totalPages - 2) {
      items.push('ellipsis-end');
    }

    items.push(totalPages - 1);
    return items;
  };

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
            onClick={() => setRefreshKey((value) => value + 1)}
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
          <label className="text-label-caps font-label-caps text-on-surface-variant">Rango de Fecha y Hora</label>
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">calendar_month</span>
              <input
                className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-lg text-body-base focus:ring-1 focus:ring-primary/20"
                type="datetime-local"
                value={dateRange.start}
                onChange={(e) => {
                  setDateRange({ ...dateRange, start: e.target.value });
                  setCurrentPage(0);
                }}
              />
            </div>
            <span className="text-outline-variant">a</span>
            <div className="flex-1 relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">calendar_today</span>
              <input
                className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-lg text-body-base focus:ring-1 focus:ring-primary/20"
                type="datetime-local"
                value={dateRange.end}
                onChange={(e) => {
                  setDateRange({ ...dateRange, end: e.target.value });
                  setCurrentPage(0);
                }}
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
                      onShowDetails={handleShowDetails}
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

                {getPaginationItems().map((item) => {
                  if (typeof item === 'string') {
                    return (
                      <span key={item} className="px-2 text-outline-variant">
                        ...
                      </span>
                    );
                  }

                  return (
                    <button
                      key={`page-${item}`}
                      onClick={() => setCurrentPage(item)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg font-body-semibold ${
                        currentPage === item
                          ? 'bg-primary-container text-white shadow-sm'
                          : 'border border-outline-variant/30 text-on-surface-variant hover:bg-surface-variant'
                      }`}
                    >
                      {item + 1}
                    </button>
                  );
                })}

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
          {auditLogs.length === 0 ? (
            <div className="mt-6 text-center text-on-surface-variant">
              <p className="text-body-base">No hay datos para mostrar</p>
            </div>
          ) : (
            <div className="space-y-4 mt-6">
              {topActions.map(([action, stats]) => {
                const actionColors = {
                  CREATE: 'bg-emerald-500',
                  READ: 'bg-blue-500',
                  UPDATE: 'bg-orange-500',
                  DELETE: 'bg-red-500',
                  APPROVE: 'bg-green-500',
                  REJECT: 'bg-red-500'
                };

                const actionLabels = {
                  CREATE: 'Creaciones',
                  READ: 'Lecturas',
                  UPDATE: 'Modificaciones',
                  DELETE: 'Eliminaciones',
                  APPROVE: 'Aprobaciones',
                  REJECT: 'Rechazos'
                };

                return (
                  <div key={action}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-body-base">
                        {actionLabels[action]} ({action})
                      </span>
                      <span className="font-body-semibold text-primary">{stats.percentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-surface-container-low rounded-full overflow-hidden">
                      <div
                        className={`h-full ${actionColors[action]}`}
                        style={{ width: `${stats.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Details modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 px-4 py-6 backdrop-blur-sm">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            onClick={handleCloseDetails}
            aria-label="Cerrar detalle de auditoría"
          />
          <div className="relative z-10 w-full max-w-4xl overflow-hidden border border-outline-variant/20 bg-surface-container-lowest shadow-2xl">
            <div className="bg-gradient-to-r from-primary to-secondary px-6 py-5 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-label-caps font-label-caps tracking-[0.22em] opacity-80">Detalle completo</p>
                  <h3 className="mt-1 text-2xl font-display-xl">Registro de auditoría</h3>
                  <p className="mt-2 max-w-2xl text-sm text-white/85">Consulta el evento, el autor y el payload completo sin salir de la vista.</p>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-2 text-sm font-body-semibold backdrop-blur">
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                  <span>{selectedLog.action}</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <span className="material-symbols-outlined text-[24px]">fact_check</span>
                  </div>
                  <div>
                    <p className="text-label-caps font-label-caps text-on-surface-variant">Evento</p>
                    <h4 className="text-xl font-body-semibold text-on-surface">{selectedLog.entityName} #{selectedLog.entityId}</h4>
                    <p className="text-sm text-on-surface-variant">ID del registro: {selectedLog.Id ?? selectedLog.id ?? 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 shadow-sm">
                <span className="text-label-caps font-label-caps text-on-surface-variant">Fecha y hora</span>
                <div className="mt-2 text-lg font-body-semibold text-primary">{formatDateTime(selectedLog.timestamp)}</div>
                <div className="mt-1 text-caption-micro text-on-surface-variant">{selectedLog.timestamp || 'N/A'}</div>
              </div>
              <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 shadow-sm">
                <span className="text-label-caps font-label-caps text-on-surface-variant">Administrador</span>
                <div className="mt-3 flex items-center gap-3">
                  <img
                    className="h-12 w-12 rounded-full border border-outline-variant/50"
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${getAdminDisplayName(getAdminUserById(adminUsers, selectedLog.executorId), selectedLog.executorId)}`}
                    alt={getAdminDisplayName(getAdminUserById(adminUsers, selectedLog.executorId), selectedLog.executorId)}
                  />
                  <div className="min-w-0">
                    <div className="truncate text-lg font-body-semibold text-on-surface">
                      {getAdminDisplayName(getAdminUserById(adminUsers, selectedLog.executorId), selectedLog.executorId)}
                    </div>
                    <div className="text-caption-micro text-on-surface-variant">ID: {selectedLog.executorId}</div>
                    <div className="mt-1 text-caption-micro text-on-surface-variant">Cuenta vinculada al usuario del sistema</div>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 shadow-sm">
                <span className="text-label-caps font-label-caps text-on-surface-variant">Acción</span>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-secondary-container/30 px-3 py-1 text-on-secondary-container w-fit">
                  <span className={`h-2 w-2 rounded-full ${getActionColor(selectedLog.action)}`}></span>
                  <span className="font-body-semibold">{selectedLog.action}</span>
                </div>
              </div>
              <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 shadow-sm">
                <span className="text-label-caps font-label-caps text-on-surface-variant">Recurso afectado</span>
                <div className="mt-2 text-lg font-body-semibold text-primary">{selectedLog.entityName} #{selectedLog.entityId}</div>
                <div className="mt-1 text-caption-micro text-on-surface-variant">ID del registro: {selectedLog.Id ?? selectedLog.id ?? 'N/A'}</div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 shadow-sm">
              <span className="text-label-caps font-label-caps text-on-surface-variant">Descripción</span>
              <p className="mt-2 text-body-base leading-7 text-on-surface">{selectedLog.description || 'Sin descripción registrada.'}</p>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleCloseDetails}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-body-semibold text-white transition-opacity hover:opacity-90"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

     </div>
   );
 }
