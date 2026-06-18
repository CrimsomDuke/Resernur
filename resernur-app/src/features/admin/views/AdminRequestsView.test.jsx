import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminRequestsView from './AdminRequestsView';

describe('AdminRequestsView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('resernur_token', 'token-requests-555');
    globalThis.fetch = vi.fn();
  });

  const mockRequests = {
    content: [
      {
        id: 201,
        userId: 5,
        placeId: 1,
        requestedStartTime: '2026-06-16T08:00:00Z',
        requestedEndTime: '2026-06-16T10:00:00Z',
        activityType: 'TALLER',
        reason: 'Taller de Ciberseguridad',
        status: 'PENDING',
        requestedAt: '2026-06-15T10:00:00Z',
        attachmentFileId: 701
      }
    ],
    totalPages: 3,
    totalElements: 25
  };

  const mockUser5 = { id: 5, fullName: 'Estudiante Cinco', email: 'c5@nur.edu', role: 'ESTUDIANTE' };
  const mockPlace1 = { id: 1, name: 'Auditorio Principal', capacity: 150, description: 'Auditorio del Bloque B' };

  const setupMockFetch = () => {
    globalThis.fetch.mockImplementation((url) => {
      if (url.includes('/api/booking-requests') && !url.includes('/accept') && !url.includes('/reject') && !url.includes('/request-changes')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockRequests)
        });
      }
      if (url.includes('/api/users/5')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockUser5) });
      }
      if (url.includes('/api/places/1')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockPlace1) });
      }
      return Promise.resolve({ ok: false, status: 404 });
    });
  };

  it('debería mostrar indicador de carga inicial', async () => {
    globalThis.fetch.mockReturnValue(new Promise(() => {}));

    render(<AdminRequestsView />);

    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('debería mostrar error si la API de solicitudes falla', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    render(<AdminRequestsView />);

    expect(await screen.findByText('No se pudieron cargar las solicitudes. Verifica la conexión.')).toBeInTheDocument();
  });

  it('debería renderizar la tabla de solicitudes y el panel de historial de decisiones vacío', async () => {
    setupMockFetch();

    render(<AdminRequestsView />);

    expect(await screen.findByText('Cola de Aprobación')).toBeInTheDocument();
    expect(await screen.findByText('Auditorio Principal')).toBeInTheDocument();
    expect(await screen.findByText('Taller de Ciberseguridad')).toBeInTheDocument();
    expect(screen.getByText('Historial de Decisiones')).toBeInTheDocument();
    expect(screen.getByText('Las decisiones tomadas en esta sesión aparecerán aquí.')).toBeInTheDocument();
  });

  it('debería filtrar solicitudes por pestañas de estado (PENDING, REJECTED, CHANGES_REQUESTED)', async () => {
    setupMockFetch();

    render(<AdminRequestsView />);

    // Click en pestaña Rechazadas
    const rejectedTab = await screen.findByRole('button', { name: /Rechazadas/i });
    fireEvent.click(rejectedTab);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('status=REJECTED'),
      expect.any(Object)
    );

    // Click en pestaña Cambios Solicitados
    const changesTab = screen.getByRole('button', { name: /Cambios Solicitados/i });
    fireEvent.click(changesTab);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('status=CHANGES_REQUESTED'),
      expect.any(Object)
    );
  });

  it('debería permitir aprobar una solicitud directamente desde el botón de la fila', async () => {
    setupMockFetch();

    render(<AdminRequestsView />);

    // Esperar a que cargue
    expect(await screen.findByText('Auditorio Principal')).toBeInTheDocument();
    const approveBtn = screen.getByTitle('Aprobar');

    // Mock accept API
    globalThis.fetch.mockImplementation((url) => {
      if (url.includes('/accept')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockRequests) });
    });

    await act(async () => {
      fireEvent.click(approveBtn);
    });

    expect(await screen.findByText('Solicitud aprobada correctamente.')).toBeInTheDocument();
    // Debe haber ingresado al feed de decisiones
    expect(screen.getByText(/Aprobada.*Auditorio Principal/)).toBeInTheDocument();
  });

  it('debería permitir rechazar una solicitud ingresando un motivo en el modal', async () => {
    setupMockFetch();

    render(<AdminRequestsView />);

    // Esperar a que cargue y hacer click en rechazar
    expect(await screen.findByText('Auditorio Principal')).toBeInTheDocument();
    const rejectBtn = screen.getByTitle('Rechazar');
    fireEvent.click(rejectBtn);

    // Debe abrir el modal
    expect(screen.getByText('Rechazar Solicitud')).toBeInTheDocument();

    // Rellenar motivo
    const txtArea = screen.getByPlaceholderText('Escribe el motivo aquí...');
    fireEvent.change(txtArea, { target: { value: 'Espacio no disponible por mantenimiento' } });

    // Mock reject API
    globalThis.fetch.mockImplementation((url, options) => {
      if (url.includes('/reject')) {
        expect(options.method).toBe('POST');
        expect(JSON.parse(options.body).reason).toBe('Espacio no disponible por mantenimiento');
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockRequests) });
    });

    const confirmRejectBtn = screen.getByRole('button', { name: 'Confirmar Rechazo' });
    await act(async () => {
      fireEvent.click(confirmRejectBtn);
    });

    expect(await screen.findByText('Solicitud rechazada.')).toBeInTheDocument();
    expect(screen.getByText(/Rechazada.*Auditorio Principal/)).toBeInTheDocument();
  });

  it('debería abrir el panel lateral de detalles y solicitar cambios', async () => {
    setupMockFetch();

    render(<AdminRequestsView />);

    // Click en la fila para abrir detalles
    const rowCell = await screen.findByText('Taller de Ciberseguridad');
    fireEvent.click(rowCell.closest('tr'));

    // Esperar a que cargue el detalle lateral
    expect(await screen.findByText('Detalle de Solicitud #201')).toBeInTheDocument();
    expect(screen.getByText('ESTUDIANTE')).toBeInTheDocument();
    expect(screen.getAllByText('c5@nur.edu').length).toBeGreaterThan(0);
    expect(screen.getByText('Auditorio del Bloque B')).toBeInTheDocument();
    expect(screen.getByText('Documento adjunto')).toBeInTheDocument();

    // Hacemos click en Pedir Cambios en el panel lateral
    const requestChangesBtn = screen.getByRole('button', { name: /Pedir Cambios/i });
    fireEvent.click(requestChangesBtn);

    // Debe abrir el modal
    expect(screen.getByText('Solicitar Cambios')).toBeInTheDocument();

    // Rellenar motivo de cambios
    const txtArea = screen.getByPlaceholderText('Escribe el motivo aquí...');
    fireEvent.change(txtArea, { target: { value: 'Por favor ajusta la capacidad estimada' } });

    // Mock request-changes API
    globalThis.fetch.mockImplementation((url) => {
      if (url.includes('/request-changes')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockRequests) });
    });

    const confirmSendBtn = screen.getByRole('button', { name: 'Enviar Cambios' });
    await act(async () => {
      fireEvent.click(confirmSendBtn);
    });

    expect(await screen.findByText('Cambios solicitados.')).toBeInTheDocument();
  });

  it('debería interactuar con la paginación', async () => {
    setupMockFetch();

    render(<AdminRequestsView />);

    const nextBtn = await screen.findByRole('button', { name: /Siguiente/i });
    await act(async () => {
      fireEvent.click(nextBtn);
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('page=1'),
      expect.any(Object)
    );
  });
});
