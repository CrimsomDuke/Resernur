import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminDashboardView from './AdminDashboardView';

describe('AdminDashboardView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('resernur_token', 'mocked-token-222');
    globalThis.fetch = vi.fn();
  });

  it('debería mostrar estado de carga inicial', async () => {
    // Retornar promesas pendientes
    globalThis.fetch.mockReturnValue(new Promise(() => {}));

    render(<AdminDashboardView onNavigate={vi.fn()} />);

    // Verificar que muestre elementos pulsores / cargando
    expect(screen.getByText('Usuarios totales')).toBeInTheDocument();
  });

  it('debería renderizar las métricas cargadas correctamente', async () => {
    globalThis.fetch.mockImplementation((url) => {
      let total = 0;
      if (url.includes('/api/users')) total = 1500;
      if (url.includes('/api/bookings')) total = 320;
      if (url.includes('/api/booking-requests')) total = 45;

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ totalElements: total }),
      });
    });

    render(<AdminDashboardView onNavigate={vi.fn()} />);

    // Esperamos a que termine de cargar
    expect(await screen.findByText('1.500')).toBeInTheDocument(); // users formatted
    expect(screen.getByText('320')).toBeInTheDocument(); // active formatted
    expect(screen.getByText('45')).toBeInTheDocument(); // pending formatted
  });

  it('debería mostrar mensaje de error si la carga de alguna métrica falla', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(<AdminDashboardView onNavigate={vi.fn()} />);

    expect(await screen.findByText('No se pudieron cargar las métricas. Verifica la conexión con el servidor.')).toBeInTheDocument();
  });

  it('debería llamar a onNavigate al hacer clic en las tarjetas de métricas', async () => {
    globalThis.fetch.mockImplementation((url) => {
      let total = 10;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ totalElements: total }),
      });
    });

    const handleNavigate = vi.fn();
    render(<AdminDashboardView onNavigate={handleNavigate} />);

    // Esperamos a que cargue
    const usersLabel = await screen.findByText('Usuarios totales');
    const bookingsLabel = screen.getByText('Reservas activas');
    const requestsLabel = screen.getByText('Solicitudes pendientes');

    // Click en la tarjeta de usuarios
    fireEvent.click(usersLabel.closest('article'));
    expect(handleNavigate).toHaveBeenCalledWith('dashboard');

    // Click en la tarjeta de reservas
    fireEvent.click(bookingsLabel.closest('article'));
    expect(handleNavigate).toHaveBeenCalledWith('reservations');

    // Click en la tarjeta de solicitudes
    fireEvent.click(requestsLabel.closest('article'));
    expect(handleNavigate).toHaveBeenCalledWith('requests');
  });

  it('debería retornar 0 si totalElements no está en el json de la respuesta', async () => {
    // Caso donde resernur_token no existe
    localStorage.removeItem('resernur_token');
    
    globalThis.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}), // no totalElements
    });

    render(<AdminDashboardView onNavigate={vi.fn()} />);

    // Como no hay token, el fetch tira de getAuthHeaders() vacío.
    const zeros = await screen.findAllByText('0');
    expect(zeros.length).toBe(3);
  });
});
