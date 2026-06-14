import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Login from './Login';

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    globalThis.fetch = vi.fn();
  });

  it('debería renderizar los campos del formulario y el botón de ingresar', () => {
    render(<Login onLoginSuccess={() => {}} />);

    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ingresar/i })).toBeInTheDocument();
  });

  it('debería permitir escribir en los campos de texto', () => {
    render(<Login onLoginSuccess={() => {}} />);

    const emailInput = screen.getByLabelText(/correo electrónico/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);

    fireEvent.change(emailInput, { target: { value: 'test@nur.edu' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(emailInput.value).toBe('test@nur.edu');
    expect(passwordInput.value).toBe('password123');
  });

  it('debería llamar a onLoginSuccess y guardar el token en localStorage cuando las credenciales sean válidas', async () => {
    const mockOnLoginSuccess = vi.fn();
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ token: 'fake-jwt-token-123' }),
    });

    render(<Login onLoginSuccess={mockOnLoginSuccess} />);

    const emailInput = screen.getByLabelText(/correo electrónico/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const submitButton = screen.getByRole('button', { name: /ingresar/i });
    fireEvent.change(emailInput, { target: { value: 'admin@nur.edu' } });
    fireEvent.change(passwordInput, { target: { value: 'S3guridad39*' } });

    fireEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(screen.getByText('Validando...')).toBeInTheDocument();

    await waitFor(() => {
      expect(localStorage.getItem('resernur_token')).toBe('fake-jwt-token-123');
      expect(mockOnLoginSuccess).toHaveBeenCalledWith('fake-jwt-token-123');
    });
  });

  it('debería mostrar un mensaje de error si las credenciales son inválidas', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
    });

    render(<Login onLoginSuccess={() => {}} />);

    const emailInput = screen.getByLabelText(/correo electrónico/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const submitButton = screen.getByRole('button', { name: /ingresar/i });
    fireEvent.change(emailInput, { target: { value: 'wrong@nur.edu' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });

    fireEvent.click(submitButton);

    const errorMessage = await screen.findByText('Credenciales inválidas o falla de conexión.');
    expect(errorMessage).toBeInTheDocument();
    
    expect(submitButton).not.toBeDisabled();
    expect(submitButton.textContent).toBe('Ingresar');
  });

  it('debería mostrar un mensaje de error si el servidor responde ok pero no incluye el token', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ user: 'someUser' }), // no hay token
    });

    render(<Login onLoginSuccess={() => {}} />);

    const emailInput = screen.getByLabelText(/correo electrónico/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const submitButton = screen.getByRole('button', { name: /ingresar/i });
    fireEvent.change(emailInput, { target: { value: 'admin@nur.edu' } });
    fireEvent.change(passwordInput, { target: { value: 'password' } });
    fireEvent.click(submitButton);

    const errorMessage = await screen.findByText('No se recibió token del servidor.');
    expect(errorMessage).toBeInTheDocument();
  });
});
