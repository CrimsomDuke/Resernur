import React, { useEffect, useMemo, useState } from 'react';
import AdminSidebar from './components/AdminSidebar';
import AdminTopbar from './components/AdminTopbar';
import AdminDashboardView from './views/AdminDashboardView';
import AdminCreateSpaceView from './views/AdminCreateSpaceView';
import AdminRequestsView from './views/AdminRequestsView';
import AdminBookingsView from './views/AdminBookingsView';
import AdminAnalyticsView from './views/AdminAnalyticsView';
import UserManagementView from './views/UserManagementView';

const MENU_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { key: 'requests', label: 'Solicitudes', icon: 'pending_actions' },
  { key: 'reservations', label: 'Reservas', icon: 'event_seat' },
  { key: 'resources', label: 'Recursos', icon: 'domain' },
  { key: 'create-space', label: 'Crear espacios', icon: 'add_business' },
  { key: 'users', label: 'Usuarios', icon: 'group' },
  { key: 'analytics', label: 'Analitica', icon: 'insights' }
];

export default function AdminPanel({ editingSpace = null, onEditHandled }) {
  const [activeSection, setActiveSection] = useState('dashboard');

  useEffect(() => {
    if (editingSpace?.id) {
      setActiveSection('create-space');
    }
  }, [editingSpace]);

  const currentTitle = useMemo(() => {
    return MENU_ITEMS.find((item) => item.key === activeSection)?.label || 'Administrador';
  }, [activeSection]);

  const renderSection = () => {
    if (activeSection === 'dashboard') {
      return <AdminDashboardView onNavigate={setActiveSection} />;
    }

    if (activeSection === 'requests') {
      return <AdminRequestsView />;
    }

    if (activeSection === 'reservations') {
      return <AdminBookingsView />;
    }

    if (activeSection === 'create-space') {
      return (
        <AdminCreateSpaceView
          editingSpace={editingSpace}
          onEditSaved={onEditHandled}
          onCancelEdit={onEditHandled}
        />
      );
    }

    if (activeSection === 'analytics') {
      return <AdminAnalyticsView />;
    }

    if (activeSection === 'users') {
      return <UserManagementView />;
    }

    return (
      <section className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-8">
        <h2 className="font-headline text-2xl font-bold text-primary">{currentTitle}</h2>
        <p className="text-on-surface-variant mt-2">
          Esta seccion del panel administrativo quedara integrada cuando se complete el resto del modulo.
        </p>
      </section>
    );
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-background rounded-2xl overflow-hidden border border-surface-container-high">
      <div className="flex h-full">
        <AdminSidebar
          items={MENU_ITEMS}
          activeSection={activeSection}
          onNavigate={setActiveSection}
        />

        <div className="flex-1 min-w-0">
          <AdminTopbar title={currentTitle} />

          <main className="p-4 md:p-6 lg:p-8 bg-surface min-h-[calc(100vh-6rem)]">
            {renderSection()}
          </main>
        </div>
      </div>
    </div>
  );
}
