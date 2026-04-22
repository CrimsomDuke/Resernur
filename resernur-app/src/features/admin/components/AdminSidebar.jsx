import React from 'react';
import logoNur from '../../../assets/nur.png';

export default function AdminSidebar({ items, activeSection, onNavigate }) {
  return (
    <aside className="hidden lg:flex w-72 shrink-0 flex-col bg-surface-container-low border-r border-surface-container-high">
      <div className="px-5 py-6">
        <div className="bg-gradient-to-br from-primary to-primary-container text-white rounded-lg px-4 py-4 shadow-sm shadow-primary/10">
          <div className="flex items-center gap-3">
            <img src={logoNur} alt="NUR" className="h-9 w-9 rounded" />
            <div>
              <p className="font-headline text-lg leading-tight font-bold">ReserNur</p>
              <p className="font-label text-[10px] uppercase tracking-widest text-white/80">Panel Administrativo</p>
            </div>
          </div>
        </div>
      </div>

      <nav className="px-3 pb-4 flex-1 overflow-y-auto">
        <div className="space-y-1">
          {items.map((item) => {
            const isActive = item.key === activeSection;
            const isCreateSpace = item.key === 'create-space';
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onNavigate(item.key)}
                className={`w-full text-left px-4 py-3 rounded-r-full rounded-l-none flex items-center gap-3 transition-colors ${
                  isActive
                    ? 'bg-surface-container-lowest text-primary font-bold shadow-sm'
                    : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span className="font-headline text-sm tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

    </aside>
  );
}
