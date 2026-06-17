import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import TopNavBar from './TopNavBar';

describe('TopNavBar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('resernur_token', 'fake-token-456');
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debería renderizar el logo del proyecto y los enlaces de navegación principales', async () => {
    globalThis.fetch.mockReturnValue(new Promise(() => {}));

    render(
      <TopNavBar 
        currentView="explorer" 
        onNavigate={() => {}} 
        onLogout={() => {}} 
      />
    );

    expect(screen.getByText('ReserNur')).toBeInTheDocument();
    expect(screen.getByText('Espacios')).toBeInTheDocument();
    expect(screen.getByText('Mis Reservas')).toBeInTheDocument();
    expect(screen.getByText('Calendario')).toBeInTheDocument();
  });

  it('debería disparar la función onNavigate al hacer clic en los enlaces', async () => {
    const mockOnNavigate = vi.fn();
    globalThis.fetch.mockReturnValue(new Promise(() => {}));

    const { rerender } = render(
      <TopNavBar 
        currentView="explorer" 
        onNavigate={mockOnNavigate} 
        onLogout={() => {}} 
        isAdmin={false}
      />
    );

    fireEvent.click(screen.getByText('Espacios'));
    expect(mockOnNavigate).toHaveBeenCalledWith('explorer');

    fireEvent.click(screen.getByText('Mis Reservas'));
    expect(mockOnNavigate).toHaveBeenCalledWith('my-requests');

    fireEvent.click(screen.getByText('Calendario'));
    expect(mockOnNavigate).toHaveBeenCalledWith('calendar');

    rerender(
      <TopNavBar 
        currentView="explorer" 
        onNavigate={mockOnNavigate} 
        onLogout={() => {}} 
        isAdmin={true}
      />
    );

    fireEvent.click(screen.getByText('Administrador'));
    expect(mockOnNavigate).toHaveBeenCalledWith('admin');
  });

  it('debería disparar la función onLogout al hacer clic en el botón de logout', async () => {
    const mockOnLogout = vi.fn();
    globalThis.fetch.mockReturnValue(new Promise(() => {}));

    render(
      <TopNavBar 
        currentView="explorer" 
        onNavigate={() => {}} 
        onLogout={mockOnLogout} 
      />
    );

    const logoutButton = screen.getByTitle('Cerrar Sesión');
    fireEvent.click(logoutButton);
    expect(mockOnLogout).toHaveBeenCalled();
  });

  it('debería renderizar la sección de administración si isAdmin es true', async () => {
    globalThis.fetch.mockReturnValue(new Promise(() => {}));

    const { rerender } = render(
      <TopNavBar 
        currentView="explorer" 
        onNavigate={() => {}} 
        onLogout={() => {}} 
        isAdmin={false}
      />
    );

    expect(screen.queryByText('Administrador')).not.toBeInTheDocument();
    expect(screen.queryByText('Encargado')).not.toBeInTheDocument();

    rerender(
      <TopNavBar 
        currentView="explorer" 
        onNavigate={() => {}} 
        onLogout={() => {}} 
        isAdmin={true}
        isManager={false}
      />
    );

    expect(screen.getByText('Administrador')).toBeInTheDocument();

    rerender(
      <TopNavBar 
        currentView="explorer" 
        onNavigate={() => {}} 
        onLogout={() => {}} 
        isAdmin={true}
        isManager={true}
      />
    );

    expect(screen.getByText('Encargado')).toBeInTheDocument();
  });

  it('debería obtener el usuario y traer las notificaciones en el polling', async () => {
    vi.useFakeTimers();
    
    const mockUser = { id: 7, name: 'Admin User' };
    const mockNotifications = {
      content: [
        { id: 101, message: 'Se creo una nueva reserva', read: false, createdAt: '2026-06-10T00:00:00Z' },
        { id: 102, message: 'Your booking request has been created and is pending review', read: true, createdAt: '2026-06-10T00:00:00Z' }
      ]
    };

    globalThis.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockNotifications),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ content: [] }),
      });

    await act(async () => {
      render(
        <TopNavBar 
          currentView="explorer" 
          onNavigate={() => {}} 
          onLogout={() => {}} 
        />
      );
    });

    expect(screen.getByText('1')).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(10000);
    });

    expect(globalThis.fetch).toHaveBeenCalledTimes(3);
  });

  it('debería marcar las notificaciones como leídas al abrir el panel', async () => {
    vi.useFakeTimers();

    const mockUser = { id: 7 };
    const mockNotifications = {
      content: [
        { id: 101, message: 'Se creo una nueva reserva', read: false, createdAt: '2026-06-10T00:00:00Z' }
      ]
    };

    globalThis.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockNotifications),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      });

    await act(async () => {
      render(
        <TopNavBar 
          currentView="explorer" 
          onNavigate={() => {}} 
          onLogout={() => {}} 
        />
      );
    });

    expect(screen.getByText('1')).toBeInTheDocument();

    const notificationButton = screen.getByTitle('Notificaciones');

    await act(async () => {
      fireEvent.click(notificationButton);
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/notifications/user/7/unread'),
      expect.any(Object)
    );

    expect(screen.getByText('Ha llegado una nueva solicitud de reserva.')).toBeInTheDocument();
  });

  it('debería disparar la función onNavigate al hacer clic en el logo', async () => {
    const mockOnNavigate = vi.fn();
    globalThis.fetch.mockReturnValue(new Promise(() => {}));

    render(
      <TopNavBar 
        currentView="explorer" 
        onNavigate={mockOnNavigate} 
        onLogout={() => {}} 
      />
    );

    fireEvent.click(screen.getByText('ReserNur'));
    expect(mockOnNavigate).toHaveBeenCalledWith('explorer');
  });

  it('debería mostrar 9+ en el badge si hay más de 9 notificaciones no leídas', async () => {
    vi.useFakeTimers();
    const mockUser = { id: 7 };
    const mockNotifications = {
      content: Array.from({ length: 12 }, (_, idx) => ({
        id: 100 + idx,
        message: 'Notificación ' + idx,
        read: false,
        createdAt: '2026-06-10T00:00:00Z'
      }))
    };

    globalThis.fetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockUser) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockNotifications) });

    await act(async () => {
      render(<TopNavBar currentView="explorer" onNavigate={() => {}} onLogout={() => {}} />);
    });

    expect(screen.getByText('9+')).toBeInTheDocument();
  });

  it('debería cerrar el panel de notificaciones al hacer clic fuera del panel', async () => {
    vi.useFakeTimers();
    const mockUser = { id: 7 };
    const mockNotifications = {
      content: [{ id: 101, message: 'Mensaje', read: false, createdAt: '2026-06-10T00:00:00Z' }]
    };

    globalThis.fetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockUser) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockNotifications) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ ok: true }) });

    await act(async () => {
      render(<TopNavBar currentView="explorer" onNavigate={() => {}} onLogout={() => {}} />);
    });

    const notificationButton = screen.getByTitle('Notificaciones');
    
    await act(async () => {
      fireEvent.click(notificationButton);
    });

    expect(screen.getByText('Notificaciones')).toBeInTheDocument();

    await act(async () => {
      fireEvent.mouseDown(document.body);
    });

    expect(screen.queryByText('Notificaciones')).not.toBeInTheDocument();
  });

  it('debería capturar el error en consola si falla la petición de marcar como leídas', async () => {
    vi.useFakeTimers();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockUser = { id: 7 };
    const mockNotifications = {
      content: [{ id: 101, message: 'Mensaje', read: false, createdAt: '2026-06-10T00:00:00Z' }]
    };

    globalThis.fetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockUser) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockNotifications) })
      .mockRejectedValueOnce(new Error('Fallo de red al marcar leídas'));

    await act(async () => {
      render(<TopNavBar currentView="explorer" onNavigate={() => {}} onLogout={() => {}} />);
    });

    const notificationButton = screen.getByTitle('Notificaciones');
    await act(async () => {
      fireEvent.click(notificationButton);
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error marking notifications as read',
      expect.any(Error)
    );
    consoleErrorSpy.mockRestore();
  });

  it('debería manejar silenciosamente el fallo al cargar el usuario al montar', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(<TopNavBar currentView="explorer" onNavigate={() => {}} onLogout={() => {}} />);

    expect(screen.getByText('ReserNur')).toBeInTheDocument();
  });

  it('debería traducir el mensaje "Your booking request has been created and is pending review"', async () => {
    vi.useFakeTimers();
    const mockUser = { id: 7 };
    const mockNotifications = {
      content: [{ id: 101, message: 'Your booking request has been created and is pending review', read: false, createdAt: '2026-06-10T00:00:00Z' }]
    };

    globalThis.fetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockUser) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockNotifications) })
      .mockResolvedValueOnce({ ok: true });

    await act(async () => {
      render(<TopNavBar currentView="explorer" onNavigate={() => {}} onLogout={() => {}} />);
    });

    const notificationButton = screen.getByTitle('Notificaciones');
    await act(async () => {
      fireEvent.click(notificationButton);
    });

    expect(screen.getByText('Tu solicitud ha sido creada y está pendiente de revisión.')).toBeInTheDocument();
  });
});
