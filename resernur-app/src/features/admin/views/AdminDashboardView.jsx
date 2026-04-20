import React from 'react';

const METRICS = [
  {
    key: 'users',
    label: 'Usuarios totales',
    value: '12,450',
    icon: 'group',
    accent: 'bg-primary-fixed text-primary'
  },
  {
    key: 'active',
    label: 'Reservas activas',
    value: '842',
    icon: 'calendar_month',
    accent: 'bg-surface-container-high text-primary'
  },
  {
    key: 'pending',
    label: 'Solicitudes pendientes',
    value: '37',
    icon: 'pending_actions',
    accent: 'bg-tertiary-fixed text-tertiary'
  },
  {
    key: 'health',
    label: 'Salud del sistema',
    value: '99.9%',
    icon: 'monitor_heart',
    accent: 'bg-gradient-to-br from-primary to-primary-container text-white',
    inverted: true
  }
];

export default function AdminDashboardView({ onCreateForm }) {
  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5">
        {METRICS.map((metric) => (
          <article
            key={metric.key}
            className={`rounded-xl p-5 border ${
              metric.inverted
                ? 'border-primary-container shadow-[0_8px_24px_0_rgba(0,30,64,0.12)]'
                : 'bg-surface-container-lowest border-surface-container-high shadow-[0_4px_18px_0_rgba(0,30,64,0.04)]'
            } ${metric.accent.includes('bg-gradient') ? metric.accent : ''}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-md ${metric.inverted ? 'bg-white/20' : metric.accent}`}>
                <span className={`material-symbols-outlined ${metric.inverted ? 'text-white' : ''}`}>{metric.icon}</span>
              </div>
            </div>

            <p className={`text-sm ${metric.inverted ? 'text-white/80' : 'text-on-surface-variant'}`}>{metric.label}</p>
            <p className={`font-headline text-4xl font-bold mt-1 ${metric.inverted ? 'text-white' : 'text-on-surface'}`}>{metric.value}</p>
          </article>
        ))}
      </div>

      <div className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-6">
        <h3 className="font-headline text-xl font-bold text-primary">Resumen Administrativo</h3>
        <p className="text-on-surface-variant mt-2 max-w-3xl">
          Este dashboard es una base visual para el panel del administrador. Podras conectarlo despues con datos reales de reservas,
          usuarios y estado del sistema.
        </p>

        <div className="mt-5">
          <button
            type="button"
            onClick={onCreateForm}
            className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-md font-semibold hover:bg-primary-container transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Crear formulario de espacio
          </button>
        </div>
      </div>
    </section>
  );
}
