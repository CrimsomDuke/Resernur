import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AdminSidebar from './AdminSidebar';

describe('AdminSidebar Component', () => {
  const items = [
    { key: 'dashboard', label: 'Inicio', icon: 'dashboard' },
    { key: 'requests', label: 'Solicitudes', icon: 'pending_actions' },
  ];

  it('debería renderizar la barra lateral y los elementos de navegación', () => {
    render(
      <AdminSidebar
        items={items}
        activeSection="dashboard"
        onNavigate={vi.fn()}
      />
    );

    expect(screen.getByText('ReserNur')).toBeInTheDocument();
    expect(screen.getByText('Panel de Gestión')).toBeInTheDocument();
    expect(screen.getByText('Inicio')).toBeInTheDocument();
    expect(screen.getByText('Solicitudes')).toBeInTheDocument();
  });

  it('debería llamar a onNavigate al hacer clic en un elemento de navegación', () => {
    const handleNavigate = vi.fn();
    render(
      <AdminSidebar
        items={items}
        activeSection="dashboard"
        onNavigate={handleNavigate}
      />
    );

    const requestsButton = screen.getByTestId('admin-requests');
    fireEvent.click(requestsButton);

    expect(handleNavigate).toHaveBeenCalledWith('requests');
  });

  it('debería aplicar clases CSS activas al elemento de la sección activa', () => {
    render(
      <AdminSidebar
        items={items}
        activeSection="dashboard"
        onNavigate={vi.fn()}
      />
    );

    const dashboardButton = screen.getByTestId('admin-dashboard');
    const requestsButton = screen.getByTestId('admin-requests');

    expect(dashboardButton).toHaveClass('bg-surface-container-lowest text-primary font-bold shadow-sm');
    expect(requestsButton).toHaveClass('text-on-surface-variant hover:text-primary hover:bg-surface-container');
  });
});
