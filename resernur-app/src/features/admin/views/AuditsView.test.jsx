import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AuditsView from './AuditsView';

describe('AuditsView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('resernur_token', 'fake-token-111');
    globalThis.fetch = vi.fn();
  });

  it('debería mostrar indicador de carga inicial', async () => {
    globalThis.fetch.mockReturnValue(new Promise(() => {}));

    render(<AuditsView />);

    expect(screen.getByText('Cargando auditorías...')).toBeInTheDocument();
  });

  it('debería mostrar error si no hay sesión activa', async () => {
    localStorage.removeItem('resernur_token');

    render(<AuditsView />);

    expect(await screen.findByText('No hay sesión activa. Por favor inicia sesión.')).toBeInTheDocument();
  });

  it('debería mostrar error si la API de logs responde con fallo de autenticación 401', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
    });

    render(<AuditsView />);

    expect(await screen.findByText('Tu sesión ha expirado. Por favor inicia sesión nuevamente.')).toBeInTheDocument();
    expect(localStorage.getItem('resernur_token')).toBeNull();
  });

  it('debería lanzar y mostrar error general si la API de logs responde con status 500', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(<AuditsView />);

    expect(await screen.findByText('Error: 500')).toBeInTheDocument();
  });

  it('debería mostrar mensaje de error si ocurre un fallo de red', async () => {
    globalThis.fetch.mockRejectedValueOnce(new Error('Fallo de conexión'));

    render(<AuditsView />);

    expect(await screen.findByText('Fallo de conexión')).toBeInTheDocument();
  });

  it('debería mostrar estado vacío si no hay logs de auditoría', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ content: [], totalPages: 0, totalElements: 0 }),
    });

    render(<AuditsView />);

    expect(await screen.findByText('No hay registros de auditoría')).toBeInTheDocument();
  });

  it('debería renderizar la tabla, estadísticas, paginación, filtros y abrir detalle de log con éxito', async () => {
    const now = new Date();
    const nowIso = now.toISOString();
    const minAgoIso = new Date(now - 5 * 60000).toISOString();
    const hoursAgoIso = new Date(now - 2 * 3600000).toISOString();
    const daysAgoIso = new Date(now - 3 * 86400000).toISOString();
    const longAgoIso = new Date(now - 10 * 86400000).toISOString();

    const mockLogs = {
      content: [
        { id: 1, entityName: 'BOOKINGS', entityId: 10, action: 'CREATE', description: 'Creación de reserva', executorId: 2, timestamp: nowIso },
        { id: 2, entityName: 'PLACES', entityId: 20, action: 'UPDATE', description: 'Actualización de aula', executorId: 3, timestamp: minAgoIso },
        { id: 3, entityName: 'USERS', entityId: 30, action: 'DELETE', description: 'Eliminación de usuario', executorId: 4, timestamp: hoursAgoIso },
        { id: 4, entityName: 'REQUESTS', entityId: 40, action: 'APPROVE', description: 'Aprobación de solicitud', executorId: 5, timestamp: daysAgoIso },
        { id: 5, entityName: 'ROLES', entityId: 50, action: 'REJECT', description: 'Rechazo de rol', executorId: 6, timestamp: longAgoIso },
        { id: 6, entityName: 'REPORTS', entityId: 60, action: 'READ', description: 'Lectura de reporte', executorId: 7, timestamp: null },
      ],
      totalPages: 10,
      totalElements: 100
    };

    const mockUsers = {
      content: [
        { id: 2, fullName: 'Carlos Admin' },
        { id: 3, name: 'María Admin' },
        { id: 4, username: 'juan_admin' },
        { id: 5, email: 'pedro@nur.edu' },
        // executorId 6 y 7 probarán la generación de nombre por defecto ("Administrador X")
      ]
    };

    globalThis.fetch.mockImplementation((url) => {
      if (url.includes('/api/audit-logs')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockLogs),
        });
      }
      if (url.includes('/api/users')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockUsers),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(<AuditsView />);

    // Esperamos a que los datos se muestren
    const element = await screen.findByText(/Creación de reserva/);
    expect(element).toBeInTheDocument();

    // Validar visualización de nombres de administradores según la lógica de prioridad
    expect(screen.getAllByText('Carlos Admin').length).toBeGreaterThan(0);
    expect(screen.getAllByText('María Admin').length).toBeGreaterThan(0);
    expect(screen.getAllByText('juan_admin').length).toBeGreaterThan(0);
    expect(screen.getAllByText('pedro@nur.edu').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Administrador 6').length).toBeGreaterThan(0);

    // Validar los formatos relativos de fechas (Ahora, Hace X min, etc.)
    expect(screen.getByText('Ahora')).toBeInTheDocument();
    expect(screen.getByText('Hace 5 min')).toBeInTheDocument();
    expect(screen.getByText('Hace 2h')).toBeInTheDocument();
    expect(screen.getByText('Hace 3d')).toBeInTheDocument();
    expect(screen.getByText('N/A')).toBeInTheDocument();

    // Validar Bento stats y porcentajes
    expect(screen.getByText('100')).toBeInTheDocument(); // TOTAL ELEMENTS

    // Probar abrir el modal de detalles
    const viewButtons = screen.getAllByRole('button', { name: /detalles/i });
    fireEvent.click(viewButtons[0]);

    expect(screen.getByText('Detalle completo')).toBeInTheDocument();
    expect(screen.getAllByText('BOOKINGS #10').length).toBeGreaterThan(0);

    // Cerrar el modal
    const closeBtn = screen.getAllByRole('button', { name: /cerrar/i })[1];
    fireEvent.click(closeBtn);
    expect(screen.queryByText('Detalle completo')).not.toBeInTheDocument();
  });

  it('debería permitir filtrar por fecha, tipo de acción e ID administrador', async () => {
    const mockLogs = { content: [], totalPages: 0, totalElements: 0 };
    globalThis.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockLogs),
    });

    const { container } = render(<AuditsView />);

    await screen.findByText('No hay registros de auditoría');

    // Cambiar filtros
    const dateInputs = container.querySelectorAll('input[type="datetime-local"]');
    const actionSelect = container.querySelector('select');
    const adminInput = container.querySelector('input[type="number"]');

    await act(async () => {
      fireEvent.change(dateInputs[0], { target: { value: '2026-06-15T08:00' } });
      fireEvent.change(dateInputs[1], { target: { value: '2026-06-15T18:00' } });
      fireEvent.change(actionSelect, { target: { value: 'UPDATE' } });
      fireEvent.change(adminInput, { target: { value: '9' } });
    });

    // Validar que se llamó al endpoint con los filtros como parámetros
    const lastCall = globalThis.fetch.mock.calls[globalThis.fetch.mock.calls.length - 1];
    const calledUrl = lastCall[0];
    expect(calledUrl).toContain('startDate=2026-06-15T08%3A00');
    expect(calledUrl).toContain('endDate=2026-06-15T18%3A00');
    expect(calledUrl).toContain('action=UPDATE');
    expect(calledUrl).toContain('executorId=9');
  });

  it('debería navegar correctamente en la paginación', async () => {
    const mockLogs = {
      content: [{ id: 1, entityName: 'PLACES', entityId: 10, action: 'CREATE', description: 'Test', executorId: 2, timestamp: '2026-06-15T12:00:00Z' }],
      totalPages: 10,
      totalElements: 100
    };

    globalThis.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockLogs),
    });

    render(<AuditsView />);

    const nextButton = await screen.findByRole('button', { name: /chevron_right/i });
    const prevButton = screen.getByRole('button', { name: /chevron_left/i });

    expect(prevButton).toBeDisabled();

    // Avanzar de página
    await act(async () => {
      fireEvent.click(nextButton);
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('page=1'),
      expect.any(Object)
    );

    // Ir a una página específica
    const pageButton = screen.getByRole('button', { name: '3' }); // página index 2
    await act(async () => {
      fireEvent.click(pageButton);
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('page=2'),
      expect.any(Object)
    );
  });

  it('debería recargar los datos al hacer clic en actualizar', async () => {
    globalThis.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ content: [], totalPages: 0, totalElements: 0 }),
    });

    render(<AuditsView />);

    const refreshButton = await screen.findByRole('button', { name: /actualizar/i });

    await act(async () => {
      fireEvent.click(refreshButton);
    });

    // Se debió llamar 2 veces (montaje + click en actualizar)
    expect(globalThis.fetch).toHaveBeenCalledTimes(3); // 2 llamadas a audit-logs + 1 llamada inicial a api/users
  });
});
