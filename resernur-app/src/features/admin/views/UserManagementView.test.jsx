import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UserManagementView from './UserManagementView';

describe('UserManagementView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('resernur_token', 'token-user-management-666');
    globalThis.fetch = vi.fn();
    window.alert = vi.fn();
  });

  const mockUsers = {
    content: [
      { id: 1, fullName: 'Carlos Admin', email: 'carlos@nur.edu', role: 'ADMINISTRADOR' },
      { id: 2, fullName: 'María Encargado', email: 'maria@nur.edu', role: 'ENCARGADO' },
      { id: 3, fullName: 'Juan Docente', email: 'juan@nur.edu', role: 'SOLICITANTE' }
    ]
  };

  const setupMockFetch = () => {
    globalThis.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockUsers),
    });
  };

  it('debería renderizar la lista de usuarios y contador de total', async () => {
    setupMockFetch();

    render(<UserManagementView />);

    expect(await screen.findByText('Gestión de Usuarios')).toBeInTheDocument();
    expect(screen.getByText('Listado de Usuarios')).toBeInTheDocument();
    
    // Total usuarios card
    expect(screen.getByText('Total Usuarios')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '3' })).toBeInTheDocument();

    // Tabla de usuarios
    expect(screen.getByText('Carlos Admin')).toBeInTheDocument();
    expect(screen.getByText('carlos@nur.edu')).toBeInTheDocument();
    expect(screen.getByText('María Encargado')).toBeInTheDocument();
    expect(screen.getByText('Juan Docente')).toBeInTheDocument();
  });

  it('debería filtrar usuarios según el buscador de texto', async () => {
    setupMockFetch();

    render(<UserManagementView />);

    await screen.findByText('Carlos Admin');

    const searchInput = screen.getByPlaceholderText('Buscar por nombre o correo...');
    fireEvent.change(searchInput, { target: { value: 'maria' } });

    expect(screen.getByText('María Encargado')).toBeInTheDocument();
    expect(screen.queryByText('Carlos Admin')).not.toBeInTheDocument();
    expect(screen.queryByText('Juan Docente')).not.toBeInTheDocument();
  });

  it('debería alternar la visibilidad de la contraseña', async () => {
    setupMockFetch();

    render(<UserManagementView />);

    // Click en botón Crear Nuevo Usuario para abrir formulario lateral
    const addBtn = await screen.findByRole('button', { name: /Crear Nuevo Usuario/i });
    fireEvent.click(addBtn);

    const passwordInput = screen.getByPlaceholderText('Contraseña inicial');
    expect(passwordInput.type).toBe('password');

    // Click en botón de visibilidad (icono visibility)
    const visibilityBtn = screen.getByRole('button', { name: 'Toggle password visibility' });
    fireEvent.click(visibilityBtn);
    expect(passwordInput.type).toBe('text');

    fireEvent.click(visibilityBtn);
    expect(passwordInput.type).toBe('password');
  });

  it('debería crear un nuevo usuario con éxito y refrescar la lista', async () => {
    setupMockFetch();

    render(<UserManagementView />);

    const addBtn = await screen.findByRole('button', { name: /Crear Nuevo Usuario/i });
    fireEvent.click(addBtn);

    // Rellenar formulario
    fireEvent.change(screen.getByPlaceholderText('Ej: Dr. Manuel Rojas'), { target: { value: 'Manuel Rojas' } });
    fireEvent.change(screen.getByPlaceholderText('m.rojas@scholarflow.edu'), { target: { value: 'm.rojas@nur.edu' } });
    
    const selectRole = screen.getByRole('combobox');
    fireEvent.change(selectRole, { target: { value: 'ENCARGADO' } });

    const passwordInput = screen.getByPlaceholderText('Contraseña inicial');
    fireEvent.change(passwordInput, { target: { value: 'pass123' } });

    // Mock register API response
    globalThis.fetch.mockImplementation((url, options = {}) => {
      if (url.includes('/api/auth/register') && options.method === 'POST') {
        const body = JSON.parse(options.body);
        expect(body.fullName).toBe('Manuel Rojas');
        expect(body.email).toBe('m.rojas@nur.edu');
        expect(body.role).toBe('ENCARGADO');
        expect(body.password).toBe('pass123');

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockUsers) });
    });

    const saveBtn = screen.getByRole('button', { name: 'Guardar Usuario' });
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    expect(window.alert).toHaveBeenCalledWith('Usuario creado exitosamente');
    expect(screen.queryByPlaceholderText('Ej: Dr. Manuel Rojas')).not.toBeInTheDocument(); // Form reset and hidden
  });

  it('debería editar un usuario existente con éxito', async () => {
    setupMockFetch();

    render(<UserManagementView />);

    const editButtons = await screen.findAllByTitle('Editar usuario');
    fireEvent.click(editButtons[1]); // Editar María Encargado

    // El formulario lateral de edición debe estar abierto y rellenado
    const nameInput = screen.getByDisplayValue('María Encargado');
    expect(nameInput).toBeInTheDocument();

    const emailInput = screen.getByDisplayValue('maria@nur.edu');
    expect(emailInput).toBeDisabled(); // El correo debe estar deshabilitado al editar
    
    const selectRole = screen.getByRole('combobox');
    expect(selectRole).toBeDisabled(); // El rol debe estar deshabilitado al editar

    // Modificar nombre
    fireEvent.change(nameInput, { target: { value: 'María Gómez' } });

    // Mock PUT update API
    globalThis.fetch.mockImplementation((url, options = {}) => {
      if (url.includes('/api/users/2') && options.method === 'PUT') {
        const body = JSON.parse(options.body);
        expect(body.fullName).toBe('María Gómez');
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockUsers) });
    });

    const saveBtn = screen.getByRole('button', { name: 'Guardar Cambios' });
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    expect(window.alert).toHaveBeenCalledWith('Usuario actualizado exitosamente');
  });

  it('debería alertar errores del backend al crear o editar', async () => {
    setupMockFetch();

    render(<UserManagementView />);

    const addBtn = await screen.findByRole('button', { name: /Crear Nuevo Usuario/i });
    fireEvent.click(addBtn);

    // Rellenar formulario
    fireEvent.change(screen.getByPlaceholderText('Ej: Dr. Manuel Rojas'), { target: { value: 'Manuel Rojas' } });
    fireEvent.change(screen.getByPlaceholderText('m.rojas@scholarflow.edu'), { target: { value: 'm.rojas@nur.edu' } });

    // Mock error response
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 400
    });

    const saveBtn = screen.getByRole('button', { name: 'Guardar Usuario' });
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    expect(window.alert).toHaveBeenCalledWith('No se pudo crear el usuario. Verifica que el correo no exista ya.');
  });
});
