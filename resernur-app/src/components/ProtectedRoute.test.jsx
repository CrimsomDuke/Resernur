import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProtectedRoute from './ProtectedRoute';
import * as authUtils from '../utils/auth';

vi.mock('../utils/auth', () => ({
  isAuthenticated: vi.fn(),
  getRoleFromToken: vi.fn(),
}));

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('debería redirigir a /login si el usuario NO está autenticado', () => {
    authUtils.isAuthenticated.mockReturnValue(false);

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <div>Contenido Privado</div>
            </ProtectedRoute>
          } />
          <Route path="/login" element={<div>Página de Login</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Página de Login')).toBeInTheDocument();
    expect(screen.queryByText('Contenido Privado')).not.toBeInTheDocument();
  });

  it('debería redirigir a /espacios si requiere admin pero el usuario es un rol normal', () => {
    authUtils.isAuthenticated.mockReturnValue(true);
    authUtils.getRoleFromToken.mockReturnValue('ROLE_USUARIO_NORMAL');

    render(
      <MemoryRouter initialEntries={['/admin-panel']}>
        <Routes>
          <Route path="/admin-panel" element={
            <ProtectedRoute requireAdmin={true}>
              <div>Panel de Administrador</div>
            </ProtectedRoute>
          } />
          <Route path="/espacios" element={<div>Vista de Espacios (Público/Normal)</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Vista de Espacios (Público/Normal)')).toBeInTheDocument();
    expect(screen.queryByText('Panel de Administrador')).not.toBeInTheDocument();
  });

  it('debería mostrar el contenido privado si el usuario es administrador', () => {
    authUtils.isAuthenticated.mockReturnValue(true);
    authUtils.getRoleFromToken.mockReturnValue('ROLE_ADMINISTRADOR');

    render(
      <MemoryRouter initialEntries={['/admin-panel']}>
        <Routes>
          <Route path="/admin-panel" element={
            <ProtectedRoute requireAdmin={true}>
              <div>Panel de Administrador</div>
            </ProtectedRoute>
          } />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Panel de Administrador')).toBeInTheDocument();
  });

  it('debería mostrar el contenido privado si el usuario es encargado (manager)', () => {
    authUtils.isAuthenticated.mockReturnValue(true);
    authUtils.getRoleFromToken.mockReturnValue('ROLE_ENCARGADO');

    render(
      <MemoryRouter initialEntries={['/admin-panel']}>
        <Routes>
          <Route path="/admin-panel" element={
            <ProtectedRoute requireAdmin={true}>
              <div>Panel de Administrador</div>
            </ProtectedRoute>
          } />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Panel de Administrador')).toBeInTheDocument();
  });
});
