import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BookingEngine from './BookingEngine';

const mockSpace = {
  id: 1,
  name: 'Aula Magna',
  capacity: 100,
  status: 'AVAILABLE',
  images: ['https://example.com/image.jpg']
};

describe('BookingEngine Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('resernur_token', 'fake-jwt-token');
    globalThis.fetch = vi.fn();
  });

  it('debería retornar null si no hay espacio a reservar', () => {
    const { container } = render(<BookingEngine spaceToBook={null} onGoBack={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('debería renderizar la información básica del espacio y los campos de entrada del formulario', () => {
    const { container } = render(<BookingEngine spaceToBook={mockSpace} onGoBack={() => {}} />);

    expect(screen.getAllByText('Aula Magna').length).toBeGreaterThan(0);
    expect(screen.getByText('100 Asistentes')).toBeInTheDocument();

    // Validar existencia de inputs
    expect(container.querySelector('input[type="date"]')).toBeInTheDocument();
    expect(container.querySelector('input[type="number"]')).toBeInTheDocument();
    expect(container.querySelectorAll('input[type="time"]').length).toBe(2);
    expect(container.querySelector('select')).toBeInTheDocument();
    expect(container.querySelector('textarea')).toBeInTheDocument();
  });

  it('debería mostrar un error si la hora de inicio es igual o posterior a la hora de fin', async () => {
    const { container } = render(<BookingEngine spaceToBook={mockSpace} onGoBack={() => {}} />);

    const dateInput = container.querySelector('input[type="date"]');
    const attendeesInput = container.querySelector('input[type="number"]');
    const timeInputs = container.querySelectorAll('input[type="time"]');
    const startInput = timeInputs[0];
    const endInput = timeInputs[1];
    const reasonText = container.querySelector('textarea');
    const submitBtn = screen.getByRole('button', { name: /enviar solicitud/i });

    // Llenar formulario con fin anterior a inicio
    fireEvent.change(dateInput, { target: { value: '2026-06-15' } });
    fireEvent.change(attendeesInput, { target: { value: '50' } });
    fireEvent.change(startInput, { target: { value: '10:00' } });
    fireEvent.change(endInput, { target: { value: '09:00' } });
    fireEvent.change(reasonText, { target: { value: 'Reunión de profesores' } });

    fireEvent.click(submitBtn);

    expect(screen.getByText('La hora de inicio debe ser anterior a la hora de fin.')).toBeInTheDocument();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('debería enviar la solicitud con éxito y mostrar la pantalla de confirmación', async () => {
    const mockOnGoBack = vi.fn();

    // 1. Mock users/me
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 10 }),
    });

    // 2. Mock booking-requests post
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const { container } = render(<BookingEngine spaceToBook={mockSpace} onGoBack={mockOnGoBack} />);

    const dateInput = container.querySelector('input[type="date"]');
    const attendeesInput = container.querySelector('input[type="number"]');
    const timeInputs = container.querySelectorAll('input[type="time"]');
    const startInput = timeInputs[0];
    const endInput = timeInputs[1];
    const reasonText = container.querySelector('textarea');
    const submitBtn = screen.getByRole('button', { name: /enviar solicitud/i });

    fireEvent.change(dateInput, { target: { value: '2026-06-15' } });
    fireEvent.change(attendeesInput, { target: { value: '50' } });
    fireEvent.change(startInput, { target: { value: '10:00' } });
    fireEvent.change(endInput, { target: { value: '12:00' } });
    fireEvent.change(reasonText, { target: { value: 'Clase magistral' } });

    // Enviar formulario
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    const successMsg = await screen.findByText('¡Solicitud Enviada!');
    expect(successMsg).toBeInTheDocument();
    expect(screen.getByText(/Aula Magna/)).toBeInTheDocument();

    const backBtn = screen.getByRole('button', { name: /volver al visualizador/i });
    fireEvent.click(backBtn);
    expect(mockOnGoBack).toHaveBeenCalled();
  });

  it('debería manejar y mostrar errores provenientes del servidor al enviar la solicitud', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 10 }),
    });

    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ errorMessage: 'El espacio ya se encuentra reservado en ese horario.' }),
    });

    const { container } = render(<BookingEngine spaceToBook={mockSpace} onGoBack={() => {}} />);

    const dateInput = container.querySelector('input[type="date"]');
    const attendeesInput = container.querySelector('input[type="number"]');
    const timeInputs = container.querySelectorAll('input[type="time"]');
    const startInput = timeInputs[0];
    const endInput = timeInputs[1];
    const reasonText = container.querySelector('textarea');
    const submitBtn = screen.getByRole('button', { name: /enviar solicitud/i });

    fireEvent.change(dateInput, { target: { value: '2026-06-15' } });
    fireEvent.change(attendeesInput, { target: { value: '50' } });
    fireEvent.change(startInput, { target: { value: '10:00' } });
    fireEvent.change(endInput, { target: { value: '12:00' } });
    fireEvent.change(reasonText, { target: { value: 'Clase magistral' } });

    await act(async () => {
      fireEvent.click(submitBtn);
    });

    const errorMsg = await screen.findByText('El espacio ya se encuentra reservado en ese horario.');
    expect(errorMsg).toBeInTheDocument();
  });

  it('debería mostrar error si fetchCurrentUserId retorna null', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
    });

    const { container } = render(<BookingEngine spaceToBook={mockSpace} onGoBack={() => {}} />);

    const dateInput = container.querySelector('input[type="date"]');
    const attendeesInput = container.querySelector('input[type="number"]');
    const timeInputs = container.querySelectorAll('input[type="time"]');
    const startInput = timeInputs[0];
    const endInput = timeInputs[1];
    const reasonText = container.querySelector('textarea');
    const submitBtn = screen.getByRole('button', { name: /enviar solicitud/i });

    fireEvent.change(dateInput, { target: { value: '2026-06-15' } });
    fireEvent.change(attendeesInput, { target: { value: '50' } });
    fireEvent.change(startInput, { target: { value: '10:00' } });
    fireEvent.change(endInput, { target: { value: '12:00' } });
    fireEvent.change(reasonText, { target: { value: 'Clase magistral' } });

    await act(async () => {
      fireEvent.click(submitBtn);
    });

    const errorMsg = await screen.findByText('No se pudo identificar tu usuario. Intenta cerrar sesión y volver a ingresar.');
    expect(errorMsg).toBeInTheDocument();
  });

  it('debería cambiar el tipo de actividad y adjuntar un archivo de respaldo al formulario', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 10 }),
    });

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const { container } = render(<BookingEngine spaceToBook={mockSpace} onGoBack={() => {}} />);

    const dateInput = container.querySelector('input[type="date"]');
    const attendeesInput = container.querySelector('input[type="number"]');
    const timeInputs = container.querySelectorAll('input[type="time"]');
    const startInput = timeInputs[0];
    const endInput = timeInputs[1];
    const reasonText = container.querySelector('textarea');
    const activitySelect = container.querySelector('select');
    const fileInput = container.querySelector('input[type="file"]');
    const submitBtn = screen.getByRole('button', { name: /enviar solicitud/i });

    fireEvent.change(dateInput, { target: { value: '2026-06-15' } });
    fireEvent.change(attendeesInput, { target: { value: '50' } });
    fireEvent.change(startInput, { target: { value: '10:00' } });
    fireEvent.change(endInput, { target: { value: '12:00' } });
    fireEvent.change(reasonText, { target: { value: 'Clase con PDF' } });
    
    fireEvent.change(activitySelect, { target: { value: 'CULTURAL' } });

    const file = new File(['hello'], 'hello.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await act(async () => {
      fireEvent.click(submitBtn);
    });

    const successMsg = await screen.findByText('¡Solicitud Enviada!');
    expect(successMsg).toBeInTheDocument();

    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    const lastCallArgs = globalThis.fetch.mock.calls[1];
    expect(lastCallArgs[0]).toContain('/api/booking-requests');
    const sentFormData = lastCallArgs[1].body;
    expect(sentFormData.get('activityType')).toBe('CULTURAL');
    expect(sentFormData.get('attachment')).toBe(file);
  });

  it('debería manejar error genérico si el servidor retorna no ok sin errorMessage ni error', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 10 }),
    });

    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    });

    const { container } = render(<BookingEngine spaceToBook={mockSpace} onGoBack={() => {}} />);

    const dateInput = container.querySelector('input[type="date"]');
    const attendeesInput = container.querySelector('input[type="number"]');
    const timeInputs = container.querySelectorAll('input[type="time"]');
    const startInput = timeInputs[0];
    const endInput = timeInputs[1];
    const reasonText = container.querySelector('textarea');
    const submitBtn = screen.getByRole('button', { name: /enviar solicitud/i });

    fireEvent.change(dateInput, { target: { value: '2026-06-15' } });
    fireEvent.change(attendeesInput, { target: { value: '50' } });
    fireEvent.change(startInput, { target: { value: '10:00' } });
    fireEvent.change(endInput, { target: { value: '12:00' } });
    fireEvent.change(reasonText, { target: { value: 'Error generico test' } });

    await act(async () => {
      fireEvent.click(submitBtn);
    });

    const errorMsg = await screen.findByText('Error 500: no se pudo crear la solicitud.');
    expect(errorMsg).toBeInTheDocument();
  });

  it('debería retornar null en fetchCurrentUserId si la respuesta no es JSON válido', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.reject(new Error('Invalid JSON')),
    });

    const { container } = render(<BookingEngine spaceToBook={mockSpace} onGoBack={() => {}} />);

    const dateInput = container.querySelector('input[type="date"]');
    const attendeesInput = container.querySelector('input[type="number"]');
    const timeInputs = container.querySelectorAll('input[type="time"]');
    const startInput = timeInputs[0];
    const endInput = timeInputs[1];
    const reasonText = container.querySelector('textarea');
    const submitBtn = screen.getByRole('button', { name: /enviar solicitud/i });

    fireEvent.change(dateInput, { target: { value: '2026-06-15' } });
    fireEvent.change(attendeesInput, { target: { value: '50' } });
    fireEvent.change(startInput, { target: { value: '10:00' } });
    fireEvent.change(endInput, { target: { value: '12:00' } });
    fireEvent.change(reasonText, { target: { value: 'JSON invalido' } });

    await act(async () => {
      fireEvent.click(submitBtn);
    });

    const errorMsg = await screen.findByText('No se pudo identificar tu usuario. Intenta cerrar sesión y volver a ingresar.');
    expect(errorMsg).toBeInTheDocument();
  });
});
