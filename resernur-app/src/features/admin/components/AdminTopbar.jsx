import React from 'react';

export default function AdminTopbar({ title }) {
  return (
    <header className="h-20 bg-white/90 backdrop-blur-md border-b border-surface-container-high px-4 md:px-6 lg:px-8 flex items-center justify-between gap-4 sticky top-0 z-20">
      <div>
        <p className="text-xs uppercase tracking-widest font-label font-semibold text-on-surface-variant">Admin Suite</p>
        <h1 className="font-headline text-2xl font-bold text-primary leading-tight">{title}</h1>
      </div>

      <div className="hidden md:flex items-center gap-3">
        <div className="relative w-72">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant">search</span>
          <input
            type="text"
            placeholder="Buscar modulo..."
            className="w-full bg-surface-container-high border-none rounded-md py-2.5 pl-10 pr-4 text-sm text-on-surface placeholder:text-outline-variant focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <button className="text-outline hover:text-primary hover:bg-surface-container rounded-full p-2 transition-colors relative" type="button">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full" />
        </button>
      </div>
    </header>
  );
}
