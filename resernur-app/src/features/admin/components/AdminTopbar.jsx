import React from 'react';

export default function AdminTopbar({ title }) {
  return (
    <header className="h-[72px] bg-white border-b border-surface-container-high px-4 md:px-6 lg:px-8 flex items-center justify-between gap-4">
      <div>
        <p className="text-xs uppercase tracking-widest font-label font-semibold text-on-surface-variant">Admin Suite</p>
        <h1 className="font-headline text-2xl font-bold text-primary leading-tight">{title}</h1>
      </div>
    </header>
  );
}
