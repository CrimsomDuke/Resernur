import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AdminPanel from './AdminPanel';

vi.mock('./components/AdminSidebar', () => ({
  default: ({ items, activeSection, onNavigate }) => (
    <nav data-testid="admin-sidebar">
      {items.map(item => (
        <button 
          key={item.key} 
          onClick={() => onNavigate(item.key)}
          className={activeSection === item.key ? 'active' : ''}
        >
          {item.label}
        </button>
      ))}
      <button onClick={() => onNavigate('unmapped-section')}>Unmapped Section</button>
    </nav>
  )
}));

vi.mock('./components/AdminTopbar', () => ({
  default: ({ title }) => <header data-testid="admin-topbar">{title}</header>
}));

vi.mock('./views/AdminDashboardView', () => ({
  default: () => <div data-testid="view-dashboard">Dashboard View</div>
}));
vi.mock('./views/AdminCreateSpaceView', () => ({
  default: () => <div data-testid="view-create-space">Create Space View</div>
}));
vi.mock('./views/AdminRequestsView', () => ({
  default: () => <div data-testid="view-requests">Requests View</div>
}));
vi.mock('./views/AdminBookingsView', () => ({
  default: () => <div data-testid="view-bookings">Bookings View</div>
}));
vi.mock('./views/AdminAnalyticsView', () => ({
  default: () => <div data-testid="view-analytics">Analytics View</div>
}));
vi.mock('./views/UserManagementView', () => ({
  default: () => <div data-testid="view-users">Users View</div>
}));

describe('AdminPanel Component', () => {
  it('debería renderizar todos los enlaces para un Administrador general', () => {
    render(<AdminPanel isManager={false} />);

    expect(screen.getByRole('button', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Solicitudes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reservas' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crear espacios' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Usuarios' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Analitica' })).toBeInTheDocument();
  });

  it('debería filtrar y restringir enlaces para un Encargado (isManager = true)', () => {
    render(<AdminPanel isManager={true} />);

    expect(screen.getByRole('button', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Solicitudes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reservas' })).toBeInTheDocument();

    expect(screen.queryByRole('button', { name: 'Crear espacios' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Usuarios' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Analitica' })).not.toBeInTheDocument();
  });

  it('debería navegar correctamente al hacer clic en los enlaces de la barra lateral', () => {
    render(<AdminPanel isManager={false} />);

    expect(screen.getByTestId('view-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('admin-topbar').textContent).toBe('Dashboard');

    fireEvent.click(screen.getByRole('button', { name: 'Solicitudes' }));
    expect(screen.getByTestId('view-requests')).toBeInTheDocument();
    expect(screen.getByTestId('admin-topbar').textContent).toBe('Solicitudes');

    fireEvent.click(screen.getByRole('button', { name: 'Reservas' }));
    expect(screen.getByTestId('view-bookings')).toBeInTheDocument();
    expect(screen.getByTestId('admin-topbar').textContent).toBe('Reservas');

    fireEvent.click(screen.getByRole('button', { name: 'Usuarios' }));
    expect(screen.getByTestId('view-users')).toBeInTheDocument();
    expect(screen.getByTestId('admin-topbar').textContent).toBe('Usuarios');

    fireEvent.click(screen.getByRole('button', { name: 'Analitica' }));
    expect(screen.getByTestId('view-analytics')).toBeInTheDocument();
    expect(screen.getByTestId('admin-topbar').textContent).toBe('Analitica');

    fireEvent.click(screen.getByRole('button', { name: 'Unmapped Section' }));
    expect(screen.getByText('Esta seccion del panel administrativo quedara integrada cuando se complete el resto del modulo.')).toBeInTheDocument();
    expect(screen.getByTestId('admin-topbar').textContent).toBe('Administrador');
  });

  it('debería redireccionar automáticamente a la sección de Crear Espacio si recibe editingSpace prop', () => {
    const mockSpace = { id: 1, name: 'Laboratorio A' };

    render(<AdminPanel editingSpace={mockSpace} isManager={false} />);

    expect(screen.getByTestId('view-create-space')).toBeInTheDocument();
    expect(screen.getByTestId('admin-topbar').textContent).toBe('Crear espacios');
  });
});
