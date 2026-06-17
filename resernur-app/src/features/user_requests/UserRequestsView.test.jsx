import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UserRequestsView, { formatDateTime } from './UserRequestsView';

describe('UserRequestsView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('resernur_token', 'fake-token-999');
    globalThis.fetch = vi.fn();
  });

  it('debería mostrar el indicador de carga al iniciar', async () => {
    globalThis.fetch.mockReturnValue(new Promise(() => {}));

    render(<UserRequestsView onNavigate={() => {}} />);

    expect(screen.getByText('Cargando tu historial...')).toBeInTheDocument();
  });

  it('debería mostrar un mensaje de error si falla la llamada a /api/users/me', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
    });

    render(<UserRequestsView onNavigate={() => {}} />);

    const errorMsg = await screen.findByText('No se pudo obtener la sesión actual.');
    expect(errorMsg).toBeInTheDocument();

    const retryButton = screen.getByRole('button', { name: /reintentar/i });
    expect(retryButton).toBeInTheDocument();
  });

  it('debería mostrar el estado vacío si el usuario no tiene reservas', async () => {
    const mockOnNavigate = vi.fn();
    const mockUser = { id: 10, fullName: 'Usuario Test' };
    const mockPlaces = { content: [{ id: 1, name: 'Aula 101' }] };
    const mockRequests = { content: [], totalPages: 1 };

    globalThis.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPlaces),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRequests),
      });

    render(<UserRequestsView onNavigate={mockOnNavigate} />);

    const noRequestsMsg = await screen.findByText('No tienes solicitudes aún');
    expect(noRequestsMsg).toBeInTheDocument();

    const exploreButton = screen.getByRole('button', { name: /ir a espacios/i });
    fireEvent.click(exploreButton);
    expect(mockOnNavigate).toHaveBeenCalledWith('explorer');
  });

  it('debería renderizar la lista de solicitudes con sus detalles correspondientes', async () => {
    const mockUser = { id: 10 };
    const mockPlaces = { content: [{ id: 1, name: 'Aula 101' }] };
    const mockRequests = {
      content: [
        {
          id: 501,
          placeId: 1,
          status: 'ACCEPTED',
          requestedStartTime: '2026-06-10T08:00:00Z',
          requestedEndTime: '2026-06-10T10:00:00Z',
          requestedAt: '2026-06-09T12:00:00Z',
          activityType: 'Examen de Grado',
          reason: 'Defensa de tesis',
        },
        {
          id: 502,
          placeId: 2,
          status: 'REJECTED',
          requestedStartTime: '2026-06-12T14:00:00Z',
          requestedEndTime: '2026-06-12T16:00:00Z',
          requestedAt: '2026-06-09T12:00:00Z',
          activityType: 'Clase Extra',
          reason: 'Refuerzo de materia',
          changesRequestedReason: 'El espacio está ocupado en ese horario',
        }
      ],
      totalPages: 1
    };

    globalThis.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPlaces),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRequests),
      });

    render(<UserRequestsView onNavigate={() => {}} />);

    const aulaText = await screen.findByText('Aula 101');
    expect(aulaText).toBeInTheDocument();

    expect(screen.getByText('Espacio #2')).toBeInTheDocument();
    expect(screen.getByText('Examen de Grado')).toBeInTheDocument();
    expect(screen.getByText('Clase Extra')).toBeInTheDocument();

    expect(screen.getByText('El espacio está ocupado en ese horario')).toBeInTheDocument();
  });

  it('debería soportar la paginación de solicitudes', async () => {
    const mockUser = { id: 10 };
    const mockPlaces = { content: [] };
    const mockRequestsPage1 = {
      content: [{ id: 501, placeId: 1, status: 'PENDING', requestedStartTime: '2026-06-10T08:00:00Z', requestedEndTime: '2026-06-10T10:00:00Z' }],
      totalPages: 2
    };
    const mockRequestsPage2 = {
      content: [{ id: 502, placeId: 1, status: 'ACCEPTED', requestedStartTime: '2026-06-11T08:00:00Z', requestedEndTime: '2026-06-11T10:00:00Z' }],
      totalPages: 2
    };

    globalThis.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPlaces),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRequestsPage1),
      });

    render(<UserRequestsView onNavigate={() => {}} />);

    const nextButton = await screen.findByRole('button', { name: /siguiente/i });
    const prevButton = screen.getByRole('button', { name: /anterior/i });

    expect(prevButton).toBeDisabled();
    expect(nextButton).not.toBeDisabled();

    globalThis.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPlaces),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRequestsPage2),
      });

    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledTimes(6);
    });
  });

  it('debería reintentar cargar datos al hacer clic en el botón de reintentar', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: false, status: 401 });

    render(<UserRequestsView onNavigate={() => {}} />);

    const retryButton = await screen.findByRole('button', { name: /reintentar/i });

    const mockUser = { id: 10 };
    const mockPlaces = { content: [] };
    const mockRequests = { content: [], totalPages: 1 };
    
    globalThis.fetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockUser) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockPlaces) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockRequests) });

    await act(async () => {
      fireEvent.click(retryButton);
    });

    const noRequestsMsg = await screen.findByText('No tienes solicitudes aún');
    expect(noRequestsMsg).toBeInTheDocument();
  });

  it('debería permitir retroceder de página al hacer clic en Anterior', async () => {
    const mockUser = { id: 10 };
    const mockPlaces = { content: [] };
    const mockRequestsPage1 = {
      content: [{ id: 501, placeId: 1, status: 'PENDING', requestedStartTime: '2026-06-10T08:00:00Z', requestedEndTime: '2026-06-10T10:00:00Z' }],
      totalPages: 2
    };
    const mockRequestsPage2 = {
      content: [{ id: 502, placeId: 1, status: 'ACCEPTED', requestedStartTime: '2026-06-11T08:00:00Z', requestedEndTime: '2026-06-11T10:00:00Z' }],
      totalPages: 2
    };

    globalThis.fetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockUser) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockPlaces) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockRequestsPage1) });

    render(<UserRequestsView onNavigate={() => {}} />);

    const nextButton = await screen.findByRole('button', { name: /siguiente/i });
    
    globalThis.fetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockUser) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockPlaces) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockRequestsPage2) });

    await act(async () => {
      fireEvent.click(nextButton);
    });

    const prevButton = screen.getByRole('button', { name: /anterior/i });
    expect(prevButton).not.toBeDisabled();

    globalThis.fetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockUser) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockPlaces) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockRequestsPage1) });

    await act(async () => {
      fireEvent.click(prevButton);
    });

    await waitFor(() => {
      const prevButtonUpdated = screen.getByRole('button', { name: /anterior/i });
      expect(prevButtonUpdated).toBeDisabled();
    });
  });

  it('debería dar formato correcto en formatDateTime o guion si no hay valor', () => {
    expect(formatDateTime(null)).toBe('—');
    expect(formatDateTime(undefined)).toBe('—');
    
    const formatted = formatDateTime('2026-06-10T08:00:00Z');
    expect(formatted).not.toBe('—');
  });
});
