import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminAnalyticsView from './AdminAnalyticsView';

describe('AdminAnalyticsView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('resernur_token', 'token-1234');
    globalThis.fetch = vi.fn();
    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    window.URL.revokeObjectURL = vi.fn();
  });

  it('debería renderizar la vista de analíticas con controles de rango de fecha', () => {
    render(<AdminAnalyticsView />);

    expect(screen.getByText('Reportes y Estadísticas')).toBeInTheDocument();
    expect(screen.getByText('Fecha de Inicio')).toBeInTheDocument();
    expect(screen.getByText('Fecha de Fin')).toBeInTheDocument();
    expect(screen.getByText('Reporte General')).toBeInTheDocument();
    expect(screen.getByText('Espacios Frecuentes')).toBeInTheDocument();
    expect(screen.getByText('Rechazos / Cancelados')).toBeInTheDocument();
  });

  it('debería cambiar los valores de fecha de inicio y fin', () => {
    render(<AdminAnalyticsView />);

    const inputs = document.querySelectorAll('input[type="date"]');
    
    fireEvent.change(inputs[0], { target: { value: '2026-06-01' } });
    fireEvent.change(inputs[1], { target: { value: '2026-06-15' } });

    expect(inputs[0].value).toBe('2026-06-01');
    expect(inputs[1].value).toBe('2026-06-15');
  });

  it('debería mostrar error si falta seleccionar fecha de inicio o fin al intentar descargar', async () => {
    render(<AdminAnalyticsView />);

    const inputs = document.querySelectorAll('input[type="date"]');
    // Forzamos valores vacíos
    fireEvent.change(inputs[0], { target: { value: '' } });

    const downloadButtons = screen.getAllByRole('button', { name: /Descargar Excel/i });
    fireEvent.click(downloadButtons[0]); // Click en primer reporte

    expect(await screen.findByText('Por favor selecciona ambas fechas.')).toBeInTheDocument();
  });

  it('debería realizar la llamada a la API y descargar el archivo blob de reporte con éxito', async () => {
    const mockBlob = new Blob(['mock-data'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      headers: {
        get: (header) => {
          if (header === 'Content-Disposition') {
            return 'attachment; filename="custom_filename.xlsx"';
          }
          return null;
        }
      },
      blob: () => Promise.resolve(mockBlob),
    });

    render(<AdminAnalyticsView />);

    const inputs = document.querySelectorAll('input[type="date"]');
    fireEvent.change(inputs[0], { target: { value: '2026-06-01' } });
    fireEvent.change(inputs[1], { target: { value: '2026-06-30' } });

    const downloadButtons = screen.getAllByRole('button', { name: /Descargar Excel/i });
    fireEvent.click(downloadButtons[0]); // General Bookings Card

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalled();
    });

    const callArgs = globalThis.fetch.mock.calls[0];
    console.log("--- CALLARGS[0] ---", {
      arg: callArgs[0],
      type: typeof callArgs[0],
      constructor: callArgs[0]?.constructor?.name,
      str: callArgs[0]?.toString()
    });
    expect(callArgs[0].toString()).toContain('from=2026-06-01&to=2026-06-30');
    expect(callArgs[1]).toEqual(
      expect.objectContaining({
        headers: {
          Authorization: 'Bearer token-1234',
        },
        method: 'GET',
      })
    );

    expect(await screen.findByText(/Reporte descargado exitosamente: custom_filename.xlsx/i)).toBeInTheDocument();
  });

  it('debería usar el nombre por defecto si no viene cabecera Content-Disposition', async () => {
    const mockBlob = new Blob(['mock-data']);
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      headers: {
        get: () => null // no header
      },
      blob: () => Promise.resolve(mockBlob),
    });

    render(<AdminAnalyticsView />);

    const inputs = document.querySelectorAll('input[type="date"]');
    fireEvent.change(inputs[0], { target: { value: '2026-06-01' } });
    fireEvent.change(inputs[1], { target: { value: '2026-06-30' } });

    const downloadButtons = screen.getAllByRole('button', { name: /Descargar Excel/i });
    fireEvent.click(downloadButtons[1]); // Espacios Frecuentes Card

    expect(await screen.findByText(/Reporte descargado exitosamente: most_used_places_report.xlsx/i)).toBeInTheDocument();
  });

  it('debería mostrar error si el servidor responde con error HTTP', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
    });

    render(<AdminAnalyticsView />);

    const inputs = document.querySelectorAll('input[type="date"]');
    fireEvent.change(inputs[0], { target: { value: '2026-06-01' } });
    fireEvent.change(inputs[1], { target: { value: '2026-06-30' } });

    const downloadButtons = screen.getAllByRole('button', { name: /Descargar Excel/i });
    fireEvent.click(downloadButtons[2]); // Rejected/Cancelled Card

    expect(await screen.findByText('Error 400: No se pudo generar el reporte.')).toBeInTheDocument();
  });
});
