import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SpaceExplorer from './SpaceExplorer';

describe('SpaceExplorer Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('resernur_token', 'fake-token-xyz');
    globalThis.fetch = vi.fn();

    
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debería mostrar indicador de carga inicial', () => {
    globalThis.fetch.mockReturnValue(new Promise(() => {}));

    render(<SpaceExplorer onReserve={() => {}} onAuthError={() => {}} />);

    expect(screen.getByText('Cargando espacios del catálogo...')).toBeInTheDocument();
  });

  it('debería renderizar la lista de espacios obtenidos desde la API', async () => {
    const mockUsers = { content: [{ id: 2, fullName: 'Juan Pérez' }] };
    const mockSpaces = {
      content: [
        { id: 1, name: 'Aula 202', capacity: 30, description: 'Aula del Bloque A', status: 'AVAILABLE', userInChargeId: 2 },
        { id: 2, name: 'Laboratorio de Química', capacity: 20, description: 'Lab del Bloque B', status: 'UNDER_MAINTENANCE', userInChargeId: 2 }
      ]
    };

    
    globalThis.fetch.mockImplementation((url) => {
      if (url.includes('/api/users')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockUsers) });
      }
      if (url.includes('/api/places')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSpaces) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ content: [] }) });
    });

    render(<SpaceExplorer onReserve={() => {}} onAuthError={() => {}} />);

    
    const space1 = await screen.findByText('Aula 202');
    expect(space1).toBeInTheDocument();

    expect(screen.getByText('Laboratorio de Química')).toBeInTheDocument();
    expect(screen.getByText('En Mantenimiento')).toBeInTheDocument();

    
    expect(screen.getByText('30 Pax')).toBeInTheDocument();
    expect(screen.getByText('20 Pax')).toBeInTheDocument();
  });

  it('debería filtrar los espacios al escribir en el buscador', async () => {
    const mockUsers = { content: [] };
    const mockSpaces = {
      content: [
        { id: 1, name: 'Aula 202', capacity: 30, description: 'Bloque A', status: 'AVAILABLE', userInChargeId: null },
        { id: 2, name: 'Auditorio', capacity: 100, description: 'Bloque C', status: 'AVAILABLE', userInChargeId: null }
      ]
    };

    globalThis.fetch.mockImplementation((url) => {
      if (url.includes('/api/users')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockUsers) });
      }
      if (url.includes('/api/places')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSpaces) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ content: [] }) });
    });

    render(<SpaceExplorer onReserve={() => {}} onAuthError={() => {}} />);

    await screen.findByText('Aula 202');

    const searchInput = screen.getByPlaceholderText('Buscar...');
    
    
    fireEvent.change(searchInput, { target: { value: 'audi' } });

    expect(screen.getByText('Auditorio')).toBeInTheDocument();
    expect(screen.queryByText('Aula 202')).not.toBeInTheDocument();
  });

  it('debería mostrar detalles del espacio seleccionado y permitir avanzar a la reserva', async () => {
    const mockUsers = { content: [] };
    const mockSpaces = {
      content: [
        { id: 1, name: 'Aula 202', capacity: 30, description: 'Bloque A', status: 'AVAILABLE', userInChargeId: null }
      ]
    };
    const mockImages = { content: [] };
    const mockEquipment = { content: [{ id: 10, equipmentName: 'Proyector Epson', quantity: 1 }] };

    globalThis.fetch.mockImplementation((url) => {
      if (url.includes('/api/users')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockUsers) });
      }
      if (url.includes('/api/places/1/images')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockImages) });
      }
      if (url.includes('/api/places/1/equipment')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockEquipment) });
      }
      if (url.includes('/api/places')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSpaces) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ content: [] }) });
    });

    const mockOnReserve = vi.fn();

    render(<SpaceExplorer onReserve={mockOnReserve} onAuthError={() => {}} />);

    const card = await screen.findByText('Aula 202');
    
    
    fireEvent.click(card);

    
    const equipmentText = await screen.findByText('Proyector Epson');
    expect(equipmentText).toBeInTheDocument();

    const reserveButton = screen.getByRole('button', { name: /continuar reserva/i });
    fireEvent.click(reserveButton);

    expect(mockOnReserve).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
  });

  it('debería permitir a un administrador activar mantenimiento o eliminar un espacio', async () => {
    const mockUsers = { content: [] };
    const mockSpaces = {
      content: [
        { id: 1, name: 'Aula 202', capacity: 30, description: 'Bloque A', status: 'AVAILABLE', userInChargeId: null }
      ]
    };

    globalThis.fetch.mockImplementation((url) => {
      if (url.includes('/api/users')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockUsers) });
      }
      if (url.includes('/api/places/1/change-status')) {
        return Promise.resolve({ ok: true });
      }
      if (url.includes('/api/places/1')) {
        
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ content: [] }) });
      }
      if (url.includes('/api/places')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSpaces) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ content: [] }) });
    });

    const mockOnEditSpace = vi.fn();

    render(
      <SpaceExplorer 
        onReserve={() => {}} 
        onAuthError={() => {}} 
        isAdmin={true}
        onEditSpace={mockOnEditSpace}
      />
    );

    const card = await screen.findByText('Aula 202');
    fireEvent.click(card);

    
    const editButton = await screen.findByRole('button', { name: /editar espacio/i });
    const maintButton = screen.getByRole('button', { name: /mantenimiento/i });
    const deleteButton = screen.getByRole('button', { name: /eliminar espacio permanentemente/i });

    expect(editButton).toBeInTheDocument();
    expect(maintButton).toBeInTheDocument();
    expect(deleteButton).toBeInTheDocument();

    
    fireEvent.click(editButton);
    expect(mockOnEditSpace).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));

    
    fireEvent.click(maintButton);
    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/places/1/change-status/UNDER_MAINTENANCE'),
        expect.any(Object)
      );
    });

    
    globalThis.fetch.mockImplementation((url, init) => {
      if (init?.method === 'DELETE') {
        return Promise.resolve({ ok: true });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ content: [] }) });
    });

    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/places/1'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  it('debería manejar fallas de la API de espacios y cargar desde localStorage si existen datos', async () => {
    const mockLocalSpaces = [
      { id: 10, name: 'Espacio Local 1', capacity: 5, description: 'Local storage fallback', status: 'AVAILABLE', userInChargeId: null }
    ];
    localStorage.setItem('resernur_local_spaces', JSON.stringify(mockLocalSpaces));

    globalThis.fetch.mockImplementation((url) => {
      if (url.includes('/api/places')) {
        return Promise.reject(new Error('API caída'));
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ content: [] }) });
    });

    render(<SpaceExplorer onReserve={() => {}} onAuthError={() => {}} />);

    
    const localSpace = await screen.findByText('Espacio Local 1');
    expect(localSpace).toBeInTheDocument();
    expect(screen.getByText('No se pudo cargar desde la API, mostrando espacios guardados localmente.')).toBeInTheDocument();
  });

  it('debería mostrar error general si la API falla y localStorage está vacío', async () => {
    globalThis.fetch.mockImplementation((url) => {
      if (url.includes('/api/places')) {
        return Promise.reject(new Error('Error de conexión'));
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ content: [] }) });
    });

    render(<SpaceExplorer onReserve={() => {}} onAuthError={() => {}} />);

    const errorContainer = await screen.findByText('Error de conexión');
    expect(errorContainer).toBeInTheDocument();
  });

  it('debería limpiar token y llamar onAuthError si la API retorna 401 o 403', async () => {
    const mockOnAuthError = vi.fn();
    globalThis.fetch.mockImplementation((url) => {
      if (url.includes('/api/places')) {
        return Promise.resolve({
          status: 401,
          ok: false,
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ content: [] }) });
    });

    render(<SpaceExplorer onReserve={() => {}} onAuthError={mockOnAuthError} />);

    await waitFor(() => {
      expect(localStorage.getItem('resernur_token')).toBeNull();
      expect(mockOnAuthError).toHaveBeenCalled();
    });
  });

  it('debería fallar handleToggleMaintenance si la API retorna error', async () => {
    const mockUsers = { content: [] };
    const mockSpaces = {
      content: [
        { id: 1, name: 'Aula 202', capacity: 30, description: 'Bloque A', status: 'AVAILABLE', userInChargeId: null }
      ]
    };

    globalThis.fetch.mockImplementation((url) => {
      if (url.includes('/api/users')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockUsers) });
      }
      if (url.includes('/api/places/1/change-status')) {
        return Promise.resolve({
          ok: false,
          status: 400,
          text: () => Promise.resolve('Bad Request error message'),
        });
      }
      if (url.includes('/api/places')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSpaces) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ content: [] }) });
    });

    render(<SpaceExplorer onReserve={() => {}} onAuthError={() => {}} isAdmin={true} />);

    const card = await screen.findByText('Aula 202');
    fireEvent.click(card);

    const maintButton = await screen.findByRole('button', { name: /mantenimiento/i });
    fireEvent.click(maintButton);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Error: HTTP 400 - Bad Request error message');
    });
  });

  it('debería fallar handleToggleMaintenance por error de red', async () => {
    const mockUsers = { content: [] };
    const mockSpaces = {
      content: [
        { id: 1, name: 'Aula 202', capacity: 30, description: 'Bloque A', status: 'AVAILABLE', userInChargeId: null }
      ]
    };
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    globalThis.fetch.mockImplementation((url) => {
      if (url.includes('/api/users')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockUsers) });
      }
      if (url.includes('/api/places/1/change-status')) {
        return Promise.reject(new Error('Fallo de red'));
      }
      if (url.includes('/api/places')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSpaces) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ content: [] }) });
    });

    render(<SpaceExplorer onReserve={() => {}} onAuthError={() => {}} isAdmin={true} />);

    const card = await screen.findByText('Aula 202');
    fireEvent.click(card);

    const maintButton = await screen.findByRole('button', { name: /mantenimiento/i });
    fireEvent.click(maintButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
      expect(window.alert).toHaveBeenCalledWith('Error de red al intentar cambiar el estado.');
    });
    consoleSpy.mockRestore();
  });

  it('debería retornar si el usuario cancela la eliminación de un espacio', async () => {
    const mockUsers = { content: [] };
    const mockSpaces = {
      content: [
        { id: 1, name: 'Aula 202', capacity: 30, description: 'Bloque A', status: 'AVAILABLE', userInChargeId: null }
      ]
    };

    globalThis.fetch.mockImplementation((url) => {
      if (url.includes('/api/users')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockUsers) });
      }
      if (url.includes('/api/places')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSpaces) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ content: [] }) });
    });

    window.confirm.mockImplementationOnce(() => false);

    render(<SpaceExplorer onReserve={() => {}} onAuthError={() => {}} isAdmin={true} />);

    const card = await screen.findByText('Aula 202');
    fireEvent.click(card);

    const deleteButton = await screen.findByRole('button', { name: /eliminar espacio permanentemente/i });
    fireEvent.click(deleteButton);

    expect(globalThis.fetch).not.toHaveBeenCalledWith(expect.stringContaining('/api/places/1'), expect.objectContaining({ method: 'DELETE' }));
  });

  it('debería alertar error 500 al eliminar espacio con reservas asociadas', async () => {
    const mockUsers = { content: [] };
    const mockSpaces = {
      content: [
        { id: 1, name: 'Aula 202', capacity: 30, description: 'Bloque A', status: 'AVAILABLE', userInChargeId: null }
      ]
    };

    globalThis.fetch.mockImplementation((url) => {
      if (url.includes('/api/users')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockUsers) });
      }
      if (url.includes('/api/places/1')) {
        return Promise.resolve({
          ok: false,
          status: 500,
        });
      }
      if (url.includes('/api/places')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSpaces) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ content: [] }) });
    });

    render(<SpaceExplorer onReserve={() => {}} onAuthError={() => {}} isAdmin={true} />);

    const card = await screen.findByText('Aula 202');
    fireEvent.click(card);

    const deleteButton = await screen.findByRole('button', { name: /eliminar espacio permanentemente/i });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Este espacio no puede ser eliminado'));
    });
  });

  it('debería alertar otros errores HTTP al eliminar espacio', async () => {
    const mockUsers = { content: [] };
    const mockSpaces = {
      content: [
        { id: 1, name: 'Aula 202', capacity: 30, description: 'Bloque A', status: 'AVAILABLE', userInChargeId: null }
      ]
    };

    globalThis.fetch.mockImplementation((url) => {
      if (url.includes('/api/users')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockUsers) });
      }
      if (url.includes('/api/places/1')) {
        return Promise.resolve({
          ok: false,
          status: 400,
          text: () => Promise.resolve('Error de validacion'),
        });
      }
      if (url.includes('/api/places')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSpaces) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ content: [] }) });
    });

    render(<SpaceExplorer onReserve={() => {}} onAuthError={() => {}} isAdmin={true} />);

    const card = await screen.findByText('Aula 202');
    fireEvent.click(card);

    const deleteButton = await screen.findByRole('button', { name: /eliminar espacio permanentemente/i });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Error HTTP 400: Error de validacion'));
    });
  });

  it('debería alertar por error de red al eliminar espacio', async () => {
    const mockUsers = { content: [] };
    const mockSpaces = {
      content: [
        { id: 1, name: 'Aula 202', capacity: 30, description: 'Bloque A', status: 'AVAILABLE', userInChargeId: null }
      ]
    };
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    globalThis.fetch.mockImplementation((url) => {
      if (url.includes('/api/users')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockUsers) });
      }
      if (url.includes('/api/places/1')) {
        return Promise.reject(new Error('Fallo de conexion'));
      }
      if (url.includes('/api/places')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSpaces) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ content: [] }) });
    });

    render(<SpaceExplorer onReserve={() => {}} onAuthError={() => {}} isAdmin={true} />);

    const card = await screen.findByText('Aula 202');
    fireEvent.click(card);

    const deleteButton = await screen.findByRole('button', { name: /eliminar espacio permanentemente/i });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
      expect(window.alert).toHaveBeenCalledWith('Error de red al intentar eliminar el espacio.');
    });
    consoleSpy.mockRestore();
  });

  it('debería avanzar y pausar el carrusel de imágenes al pasar el mouse por encima', async () => {
    vi.useRealTimers();

    const mockUsers = { content: [] };
    const mockSpaces = {
      content: [
        { id: 1, name: 'Aula 202', capacity: 30, description: 'Bloque A', status: 'AVAILABLE', userInChargeId: null }
      ]
    };
    const mockImages = {
      content: [
        { id: 101, url: 'img1.jpg' },
        { id: 102, url: 'img2.jpg' },
        { id: 103, url: 'img3.jpg' }
      ]
    };

    globalThis.fetch.mockImplementation((url) => {
      if (url.includes('/api/users')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockUsers) });
      }
      if (url.includes('/api/places/1/images')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockImages) });
      }
      if (url.includes('/api/places')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSpaces) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ content: [] }) });
    });

    const { container } = render(<SpaceExplorer onReserve={() => {}} onAuthError={() => {}} />);

    const card = await screen.findByText('Aula 202');
    fireEvent.click(card);

    
    let mainImg;
    await waitFor(() => {
      mainImg = container.querySelector('.lg\\:w-3\\/5 img');
      expect(mainImg).not.toBeNull();
      expect(mainImg.src).toContain('img1.jpg');
    });

    
    vi.useFakeTimers();

    
    const imageContainer = mainImg.closest('div');

    
    
    fireEvent.mouseEnter(imageContainer);
    fireEvent.mouseLeave(imageContainer);

    
    await act(async () => {
      vi.advanceTimersByTime(3500);
    });
    expect(mainImg.src).toContain('img2.jpg');

    
    fireEvent.mouseEnter(imageContainer);

    
    await act(async () => {
      vi.advanceTimersByTime(3500);
    });
    
    expect(mainImg.src).toContain('img2.jpg');

    
    fireEvent.mouseLeave(imageContainer);

    
    await act(async () => {
      vi.advanceTimersByTime(3500);
    });
    expect(mainImg.src).toContain('img3.jpg');

    
    const nextButton = screen.getByLabelText('Imagen siguiente');
    const prevButton = screen.getByLabelText('Imagen anterior');

    fireEvent.click(nextButton);
    expect(mainImg.src).toContain('img1.jpg');

    fireEvent.click(prevButton);
    expect(mainImg.src).toContain('img3.jpg');

    
    const dotButtons = screen.getAllByLabelText(/Ver imagen \d+/);
    fireEvent.click(dotButtons[1]); 
    expect(mainImg.src).toContain('img2.jpg');
  });

  it('debería manejar fallas en el fetch de equipamiento silenciosamente', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockUsers = { content: [] };
    const mockSpaces = {
      content: [
        { id: 1, name: 'Aula 202', capacity: 30, description: 'Bloque A', status: 'AVAILABLE', userInChargeId: null }
      ]
    };

    globalThis.fetch.mockImplementation((url) => {
      if (url.includes('/api/users')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockUsers) });
      }
      if (url.includes('/api/places/1/equipment')) {
        return Promise.reject(new Error('Fallo de red en equipo'));
      }
      if (url.includes('/api/places')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSpaces) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ content: [] }) });
    });

    render(<SpaceExplorer onReserve={() => {}} onAuthError={() => {}} />);

    const card = await screen.findByText('Aula 202');
    fireEvent.click(card);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error cargando equipos', expect.any(Error));
    });
    consoleSpy.mockRestore();
  });

  it('debería manejar JSON inválido en localStorage en fetchSpaces', async () => {
    localStorage.setItem('resernur_local_spaces', '{invalid json');
    globalThis.fetch.mockImplementation(() => Promise.reject(new Error('API caída')));

    render(<SpaceExplorer onReserve={() => {}} onAuthError={() => {}} />);

    const errorContainer = await screen.findByText('API caída');
    expect(errorContainer).toBeInTheDocument();
  });

  it('debería manejar fallas en el fetch de usuario en fetchSpaces', async () => {
    globalThis.fetch.mockImplementation((url) => {
      if (url.includes('/api/users')) {
        return Promise.reject(new Error('Fallo de red en usuarios'));
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ content: [] }) });
    });

    render(<SpaceExplorer onReserve={() => {}} onAuthError={() => {}} />);
    
    await screen.findByText('No hay espacios para mostrar en este momento.');
  });

  it('debería lanzar error si el endpoint de lugares retorna ok false en fetchSpaces', async () => {
    globalThis.fetch.mockImplementation((url) => {
      if (url.includes('/api/places')) {
        return Promise.resolve({
          ok: false,
          status: 500,
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ content: [] }) });
    });

    render(<SpaceExplorer onReserve={() => {}} onAuthError={() => {}} />);

    const errorContainer = await screen.findByText('No se pudieron cargar los espacios. Verifica que la API este encendida.');
    expect(errorContainer).toBeInTheDocument();
  });
});

