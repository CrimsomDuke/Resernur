import React, { useState } from 'react';

const AuditRow = ({ date, admin, adminId, action, resource, resourceIcon }) => (
  <tr className="hover:bg-surface-container-low transition-colors group border-b border-outline-variant/10">
    <td className="px-6 py-4 align-middle">
      <div className="flex flex-col">
        <span className="font-body-semibold text-primary">{date}</span>
        <span className="text-caption-micro text-on-surface-variant uppercase">{admin}</span>
      </div>
    </td>
    <td className="px-6 py-4 align-middle">
      <div className="flex items-center gap-3">
        <img 
          className="w-8 h-8 rounded-full border border-outline-variant/50" 
          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${admin}`}
          alt={admin}
        />
        <div className="flex flex-col">
          <span className="text-body-base font-body-semibold">{admin}</span>
          <span className="text-caption-micro text-on-surface-variant">ID: {adminId}</span>
        </div>
      </div>
    </td>
    <td className="px-6 py-4 align-middle">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        <span className="text-body-base">{action}</span>
      </div>
    </td>
    <td className="px-6 py-4 align-middle">
      <div className="flex items-center gap-2 px-3 py-1 bg-secondary-container/30 text-on-secondary-container rounded-full w-fit">
        <span className="material-symbols-outlined text-[16px]">{resourceIcon}</span>
        <span className="text-[12px] font-body-semibold">{resource}</span>
      </div>
    </td>
    <td className="px-6 py-4 align-middle text-right">
      <button className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors">
        <span className="material-symbols-outlined text-[20px]">visibility</span>
      </button>
    </td>
  </tr>
);

export default function AuditsView() {
  const [dateRange, setDateRange] = useState({
    start: '01 Ene, 2024',
    end: '15 Feb, 2024'
  });
  const [actionType, setActionType] = useState('all');
  const [adminFilter, setAdminFilter] = useState('');

  const auditRows = [
    {
      date: 'Hoy, 14:23',
      timeAgo: 'Hace 15 minutos',
      admin: 'Alejandro Ruiz',
      adminId: 'SF-0012',
      action: 'Aprobó solicitud #4928',
      resource: 'Salón de Grados',
      resourceIcon: 'meeting_room'
    },
    {
      date: 'Hoy, 12:45',
      timeAgo: 'Hace 2 horas',
      admin: 'María Fernanda V.',
      adminId: 'SF-0045',
      action: 'Creó salón: Laboratorio 302',
      resource: 'Edificio Ciencias',
      resourceIcon: 'biotech'
    },
    {
      date: 'Ayer, 18:12',
      timeAgo: '14 de Feb',
      admin: 'Carlos Méndez',
      adminId: 'SF-0022',
      action: 'Rechazó solicitud #4920',
      resource: 'Cancha Techada',
      resourceIcon: 'sports_basketball'
    },
    {
      date: 'Ayer, 09:15',
      timeAgo: '14 de Feb',
      admin: 'Ana Lucía Torres',
      adminId: 'SF-0089',
      action: 'Actualizó permisos: Docente J. Gómez',
      resource: 'Seguridad/Roles',
      resourceIcon: 'security'
    },
    {
      date: '13 Feb, 16:50',
      timeAgo: 'Hace 2 días',
      admin: 'Roberto Silva',
      adminId: 'SF-0005',
      action: 'Modificó horario: Auditorio Magno',
      resource: 'Campus Central',
      resourceIcon: 'school'
    }
  ];

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
          <button className="px-5 py-2.5 bg-surface-container-high text-primary font-body-semibold rounded-xl flex items-center gap-2 hover:bg-surface-variant transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[20px]">refresh</span>
            <span>Actualizar</span>
          </button>
          <button className="px-6 py-2.5 bg-gradient-to-r from-primary-container to-[#003366] text-white font-body-semibold rounded-xl flex items-center gap-2 hover:opacity-95 transition-opacity shadow-sm">
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span>Exportar</span>
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
                type="text"
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              />
            </div>
            <span className="text-outline-variant">a</span>
            <div className="flex-1 relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">calendar_today</span>
              <input 
                className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-lg text-body-base focus:ring-1 focus:ring-primary/20"
                placeholder="Hoy"
                type="text"
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              />
            </div>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/30 shadow-sm flex flex-col gap-3">
          <label className="text-label-caps font-label-caps text-on-surface-variant">Tipo de Acción</label>
          <select 
            className="w-full bg-surface-container-low border-none rounded-lg text-body-base focus:ring-1 focus:ring-primary/20 py-2"
            value={actionType}
            onChange={(e) => setActionType(e.target.value)}
          >
            <option value="all">Todas las acciones</option>
            <option value="approvals">Aprobaciones</option>
            <option value="creations">Creaciones</option>
            <option value="deletions">Eliminaciones</option>
            <option value="modifications">Modificaciones</option>
          </select>
        </div>
        <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/30 shadow-sm flex flex-col gap-3">
          <label className="text-label-caps font-label-caps text-on-surface-variant">Usuario Administrador</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">person_search</span>
            <input 
              className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-lg text-body-base focus:ring-1 focus:ring-primary/20"
              placeholder="Filtrar por nombre..."
              type="text"
              value={adminFilter}
              onChange={(e) => setAdminFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Main Audit Table */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden">
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
              {auditRows.map((row, idx) => (
                <AuditRow key={idx} {...row} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-surface-container-low px-6 py-4 flex items-center justify-between border-t border-outline-variant/20">
          <span className="text-body-base text-on-surface-variant font-body-base">Mostrando 1-10 de 1,248 registros</span>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant/30 text-on-surface-variant hover:bg-surface-variant transition-colors">
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary-container text-white font-body-semibold shadow-sm">1</button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant/30 text-on-surface-variant hover:bg-surface-variant transition-colors">2</button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant/30 text-on-surface-variant hover:bg-surface-variant transition-colors">3</button>
            <span className="px-2 text-outline-variant">...</span>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant/30 text-on-surface-variant hover:bg-surface-variant transition-colors">125</button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant/30 text-on-surface-variant hover:bg-surface-variant transition-colors">
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Insights Bento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-primary-container text-white p-6 rounded-xl relative overflow-hidden shadow-md">
          <div className="relative z-10">
            <span className="text-label-caps opacity-70 tracking-widest">ACTIVIDAD TOTAL (MES)</span>
            <div className="text-[32px] font-display-xl font-extrabold mt-2">4,821</div>
            <div className="flex items-center gap-2 mt-4 text-emerald-300">
              <span className="material-symbols-outlined text-[18px]">trending_up</span>
              <span className="text-body-semibold font-body-semibold">+12% vs mes anterior</span>
            </div>
          </div>
          <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-[120px] opacity-10">monitoring</span>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant/30 p-6 rounded-xl shadow-sm">
          <span className="text-label-caps text-on-surface-variant tracking-widest">ACCIONES POR CATEGORÍA</span>
          <div className="space-y-4 mt-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-body-base">Solicitudes Aprobadas</span>
                <span className="font-body-semibold text-primary">64%</span>
              </div>
              <div className="w-full h-2 bg-surface-container-low rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: '64%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-body-base">Nuevos Espacios</span>
                <span className="font-body-semibold text-primary">22%</span>
              </div>
              <div className="w-full h-2 bg-surface-container-low rounded-full overflow-hidden">
                <div className="h-full bg-secondary" style={{ width: '22%' }}></div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant/30 p-6 rounded-xl shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-label-caps text-on-surface-variant tracking-widest">ÚLTIMO REPORTE GENERADO</span>
            <div className="flex items-center gap-3 mt-4">
              <div className="w-10 h-10 rounded-lg bg-error-container flex items-center justify-center text-on-error-container">
                <span className="material-symbols-outlined">picture_as_pdf</span>
              </div>
              <div className="flex flex-col">
                <span className="text-body-semibold font-body-semibold">Auditoria_Q1_2024.pdf</span>
                <span className="text-caption-micro text-on-surface-variant">Generado por: Admin Principal</span>
              </div>
            </div>
          </div>
          <button className="mt-4 w-full py-2 bg-surface-container-high text-primary font-body-semibold rounded-lg hover:bg-surface-variant transition-colors border border-outline-variant/30">
            Descargar Reporte Completo
          </button>
        </div>
      </div>
    </div>
  );
}
