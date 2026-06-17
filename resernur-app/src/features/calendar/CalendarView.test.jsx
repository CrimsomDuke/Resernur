import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import CalendarView from './CalendarView';

describe('CalendarView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('resernur_token', 'fake-token-abc');
    globalThis.fetch = vi.fn();

    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 15));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debería mostrar cargando al inicio', async () => {
    globalThis.fetch.mockReturnValue(new Promise(() => {}));

    render(<CalendarView onGoBack={() => {}} />);

    expect(screen.getByText('Cargando calendario...')).toBeInTheDocument();
  });

  it('debería renderizar la cabecera, mes actual y los días de la semana', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ content: [] }),
    });

    await act(async () => {
      render(<CalendarView onGoBack={() => {}} />);
    });

    expect(screen.queryByText('Cargando calendario...')).not.toBeInTheDocument();

    expect(screen.getByText('Calendario de Reservas')).toBeInTheDocument();
    expect(screen.getByText('junio de 2026')).toBeInTheDocument();

    ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].forEach(day => {
      expect(screen.getByText(day)).toBeInTheDocument();
    });
  });

  it('debería llamar a onGoBack al hacer clic en volver', async () => {
    const mockGoBack = vi.fn();
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ content: [] }),
    });

    await act(async () => {
      render(<CalendarView onGoBack={mockGoBack} />);
    });

    const backButton = screen.getByRole('button', { name: /volver/i });
    
    await act(async () => {
      fireEvent.click(backButton);
    });
    
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('debería permitir navegar entre meses (Anterior / Siguiente / Hoy)', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ content: [] }),
    });

    await act(async () => {
      render(<CalendarView onGoBack={() => {}} />);
    });

    expect(screen.getByText('junio de 2026')).toBeInTheDocument();

    const prevButton = screen.getByText('chevron_left');
    await act(async () => {
      fireEvent.click(prevButton);
    });
    expect(screen.getByText('mayo de 2026')).toBeInTheDocument();

    const nextButton = screen.getByText('chevron_right');
    await act(async () => {
      fireEvent.click(nextButton); // Vuelve a Junio
    });
    await act(async () => {
      fireEvent.click(nextButton); // Pasa a Julio
    });
    expect(screen.getByText('julio de 2026')).toBeInTheDocument();

    const todayButton = screen.getByRole('button', { name: /hoy/i });
    await act(async () => {
      fireEvent.click(todayButton);
    });
    expect(screen.getByText('junio de 2026')).toBeInTheDocument();
  });

  it('debería agrupar y renderizar reservas en las celdas correctas del calendario', async () => {
    const mockBookings = {
      content: [
        {
          id: 991,
          startTime: '2026-06-10T09:00:00',
          endTime: '2026-06-10T11:00:00',
          status: 'ACCEPTED',
          place: { name: 'Laboratorio de Cómputo 3' },
          bookingRequest: { user: { fullName: 'Ing. Carlos Pérez' } }
        },
        {
          id: 992,
          startTime: '2026-06-10T14:30:00',
          endTime: '2026-06-10T16:00:00',
          status: 'PENDING',
          place: { name: 'Aula Magna' },
          bookingRequest: { user: { fullName: 'Lic. María Gómez' } }
        },
        {
          id: 993,
          startTime: '2026-06-10T10:00:00',
          endTime: '2026-06-10T12:00:00',
          status: 'REJECTED',
          place: { name: 'Aula 101' },
          bookingRequest: { user: { fullName: 'Estudiante' } }
        }
      ]
    };

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockBookings),
    });

    await act(async () => {
      render(<CalendarView onGoBack={() => {}} />);
    });

    expect(screen.getByText('Laboratorio de Cómputo 3')).toBeInTheDocument();
    expect(screen.getByText('Aula Magna')).toBeInTheDocument();

    expect(screen.queryByText('Aula 101')).not.toBeInTheDocument();

    expect(screen.getByText('09:00')).toBeInTheDocument();
    expect(screen.getByText('14:30')).toBeInTheDocument();
  });

  it('debería registrar un error en consola si falla la petición de bookings', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    globalThis.fetch.mockRejectedValueOnce(new Error('Fallo de red en bookings'));

    await act(async () => {
      render(<CalendarView onGoBack={() => {}} />);
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch bookings:', expect.any(Error));
    expect(screen.queryByText('Cargando calendario...')).not.toBeInTheDocument();
    
    consoleErrorSpy.mockRestore();
  });
});
