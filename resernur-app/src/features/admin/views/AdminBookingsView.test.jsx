import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AdminBookingsView from './AdminBookingsView';

describe('AdminBookingsView Component', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('resernur_token', 'token-bookings-333');
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const mockBookings = {
    content: [
      {
        id: 101,
        startTime: '2026-06-15T14:00:00Z',
        endTime: '2026-06-15T16:00:00Z',
        status: 'COMPLETED',
        placeId: 1,
        activityType: 'EXAMEN',
        bookingRequest: { userId: 5, reason: 'Examen de Física' }
      },
      {
        id: 102,
        startTime: '2026-06-14T08:00:00Z',
        endTime: '2026-06-14T10:00:00Z', // Past date
        status: 'COMPLETED',
        placeId: 2,
        activityType: 'CLASE',
        bookingRequest: { userId: 6, reason: 'Clase de Álgebra' }
      }
    ],
    totalPages: 2,
    totalElements: 2
  };

  const mockUser5 = { id: 5, fullName: 'Estudiante Cinco', email: 'estud5@nur.edu' };
  const mockUser6 = { id: 6, fullName: 'Profesor Seis', email: 'prof6@nur.edu' };
  const mockPlace1 = { id: 1, name: 'Aula 201' };
  const mockPlace2 = { id: 2, name: 'Aula 202' };

  const setupMockFetch = () => {
    globalThis.fetch.mockImplementation((url) => {
      if (url.includes('/api/bookings') && !url.includes('/cancel')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockBookings),
        });
      }
      if (url.includes('/api/users/5')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockUser5) });
      }
      if (url.includes('/api/users/6')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockUser6) });
      }
      if (url.includes('/api/places/1')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockPlace1) });
      }
      if (url.includes('/api/places/2')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockPlace2) });
      }
      return Promise.resolve({ ok: false, status: 404 });
    });
  };

  it('debería mostrar indicador de carga inicial', async () => {
    globalThis.fetch.mockReturnValue(new Promise(() => {}));

    render(<AdminBookingsView />);

    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('debería mostrar error si falla la llamada inicial de reservas', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(<AdminBookingsView />);

    expect(await screen.findByText('No se pudieron cargar las reservas activas. Verifica la conexión.')).toBeInTheDocument();
  });

  it('debería renderizar la lista de reservas activas y cargar nombres correspondientes', async () => {
    setupMockFetch();

    render(<AdminBookingsView />);

    // Esperar a que se carguen los datos
    expect(await screen.findByText('Aula 201')).toBeInTheDocument();
    expect(screen.getByText('Estudiante Cinco')).toBeInTheDocument();
    
    // Por defecto, la tab es 'activas', por lo que el examen de física (futuro) debe aparecer
    expect(screen.getByText('EXAMEN')).toBeInTheDocument();
    // La reserva vieja (Aula 202) no debe aparecer en 'activas'
    expect(screen.queryByText('Aula 202')).not.toBeInTheDocument();
  });

  it('debería cambiar de pestaña e interactuar con la paginación', async () => {
    setupMockFetch();

    render(<AdminBookingsView />);

    // Click en la tab de historial
    const historyTab = await screen.findByRole('button', { name: /Historial/i });
    fireEvent.click(historyTab);

    // Debe mostrar la clase del Aula 202 que es del pasado
    expect(await screen.findByText('Aula 202')).toBeInTheDocument();
    expect(screen.getByText('Profesor Seis')).toBeInTheDocument();
    expect(screen.queryByText('Aula 201')).not.toBeInTheDocument();

    // Interactuar con los botones de paginación
    const nextBtn = screen.getByRole('button', { name: /Siguiente/i });
    await act(async () => {
      fireEvent.click(nextBtn);
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('page=1'),
      expect.any(Object)
    );
  });

  it('debería abrir el panel de detalles y poder cancelar la reserva', async () => {
    setupMockFetch();

    render(<AdminBookingsView />);

    const row = await screen.findByText('Aula 201');
    fireEvent.click(row.closest('tr'));

    // Esperar detalles
    expect(await screen.findByText('Reserva #101')).toBeInTheDocument();
    expect(screen.getByText('estud5@nur.edu')).toBeInTheDocument();
    expect(screen.getByText('"Examen de Física"')).toBeInTheDocument();

    // Hacemos clic en Cancelar Reserva
    const cancelBtn = screen.getByRole('button', { name: /Cancelar Reserva/i });
    fireEvent.click(cancelBtn);

    // Abre el modal de confirmación
    expect(screen.getByText('¿Cancelar Reserva?')).toBeInTheDocument();

    // Mockeamos el endpoint de cancelación
    globalThis.fetch.mockImplementation((url, options) => {
      if (url.includes('/api/bookings/101/cancel')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      }
      // re-mock general
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockBookings) });
    });

    const confirmCancelBtn = screen.getByRole('button', { name: /Sí, cancelar/i });
    await act(async () => {
      fireEvent.click(confirmCancelBtn);
    });

    // Validar mensaje de éxito
    expect(await screen.findByText('Reserva cancelada correctamente.')).toBeInTheDocument();
    expect(screen.queryByText('¿Cancelar Reserva?')).not.toBeInTheDocument();
  });

  it('debería manejar errores de la API al cancelar una reserva', async () => {
    setupMockFetch();

    render(<AdminBookingsView />);

    const row = await screen.findByText('Aula 201');
    fireEvent.click(row.closest('tr'));

    const cancelBtn = await screen.findByRole('button', { name: /Cancelar Reserva/i });
    fireEvent.click(cancelBtn);

    // Mockear fallo de cancelación
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ errorMessage: 'Error de prueba al cancelar' }),
    });

    const confirmCancelBtn = screen.getByRole('button', { name: /Sí, cancelar/i });
    await act(async () => {
      fireEvent.click(confirmCancelBtn);
    });

    expect(await screen.findByText('Error de prueba al cancelar')).toBeInTheDocument();
  });

  it('debería cerrar el panel de detalles y el modal de cancelación', async () => {
    setupMockFetch();

    render(<AdminBookingsView />);

    const row = await screen.findByText('Aula 201');
    fireEvent.click(row.closest('tr'));

    // Cerrar panel lateral
    const closeDetailBtn = await screen.findByRole('button', { name: 'close' }); // botón close icon
    fireEvent.click(closeDetailBtn);
    expect(screen.queryByText('Reserva #101')).not.toBeInTheDocument();

    // Abrir de nuevo e ir al modal
    fireEvent.click(row.closest('tr'));
    const cancelBtn = await screen.findByRole('button', { name: /Cancelar Reserva/i });
    fireEvent.click(cancelBtn);

    // Cerrar modal
    const closeConfirmBtn = screen.getByRole('button', { name: 'Cerrar' });
    fireEvent.click(closeConfirmBtn);
    expect(screen.queryByText('¿Cancelar Reserva?')).not.toBeInTheDocument();
  });
});
