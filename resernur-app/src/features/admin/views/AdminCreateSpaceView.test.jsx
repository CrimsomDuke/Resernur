import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminCreateSpaceView from './AdminCreateSpaceView';

describe('AdminCreateSpaceView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('resernur_token', 'token-create-space-444');
    globalThis.fetch = vi.fn();
    window.confirm = vi.fn().mockReturnValue(true);
    window.alert = vi.fn();
  });

  const mockUsersList = {
    content: [
      { id: 10, fullName: 'Encargado Carlos', role: 'ENCARGADO', email: 'carlos@nur.edu' },
      { id: 11, fullName: 'Docente Juan', role: 'DOCENTE', email: 'juan@nur.edu' },
      { id: 12, fullName: 'Encargado María', role: 'ENCARGADO', email: 'maria@nur.edu' }
    ]
  };

  const mockExistingEquipment = {
    content: [
      { id: 501, equipmentName: 'Pizarra Acrílica', quantity: 2, status: 'AVAILABLE' }
    ]
  };

  const mockExistingImages = {
    content: [
      { id: 901, url: 'http://localhost:5000/images/aula1.jpg' }
    ]
  };

  const setupMockFetch = () => {
    globalThis.fetch.mockImplementation((url, options = {}) => {
      if (url.includes('/api/users')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockUsersList)
        });
      }
      if (url.includes('/equipment') && options.method !== 'POST') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockExistingEquipment)
        });
      }
      if (url.includes('/images') && options.method !== 'POST') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockExistingImages)
        });
      }
      return Promise.resolve({ ok: false, status: 404 });
    });
  };

  it('debería renderizar formulario de creación y cargar encargados en el select', async () => {
    setupMockFetch();

    render(<AdminCreateSpaceView />);

    expect(screen.getByText('Crear nuevo espacio')).toBeInTheDocument();
    
    // Esperar a que cargue los encargados
    await waitFor(() => {
      expect(screen.getByText('Encargado Carlos')).toBeInTheDocument();
      expect(screen.getByText('Encargado María')).toBeInTheDocument();
      // Docente Juan no debe ser una opción seleccionable porque no tiene rol ENCARGADO
      expect(screen.queryByText('Docente Juan')).not.toBeInTheDocument();
    });
  });

  it('debería mostrar error de red al cargar encargados', async () => {
    globalThis.fetch.mockRejectedValueOnce(new Error('Fallo de conexión'));

    render(<AdminCreateSpaceView />);

    expect(await screen.findByText('Error de red al cargar encargados.')).toBeInTheDocument();
  });

  it('debería eliminar token si al cargar encargados recibe 401 o 403', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      status: 401,
      ok: false
    });

    render(<AdminCreateSpaceView />);

    expect(await screen.findByText('No autorizado para cargar encargados. Inicia sesion nuevamente.')).toBeInTheDocument();
    expect(localStorage.getItem('resernur_token')).toBeNull();
  });

  it('debería manejar la edición de un espacio cargando su equipamiento e imágenes existentes', async () => {
    setupMockFetch();

    const editingSpace = {
      id: 201,
      name: 'Laboratorio de Redes',
      capacity: 35,
      userInChargeId: 12,
      location: 'Bloque C'
    };

    render(<AdminCreateSpaceView editingSpace={editingSpace} onCancelEdit={vi.fn()} />);

    // Verificar campos pre-poblados
    expect(await screen.findByDisplayValue('Laboratorio de Redes')).toBeInTheDocument();
    expect(screen.getByDisplayValue('35')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Bloque C')).toBeInTheDocument();

    // Debe mostrar equipamiento e imágenes cargadas
    expect(screen.getByText('Pizarra Acrílica')).toBeInTheDocument();
    expect(screen.getByAltText('Space')).toBeInTheDocument();
  });

  it('debería permitir agregar, modificar cantidad y eliminar elementos del equipamiento', async () => {
    setupMockFetch();
    render(<AdminCreateSpaceView />);

    // Agregar proyector
    const eqNameInput = screen.getByPlaceholderText('Nombre del equipo (Ej. Proyector)');
    const eqQtyInput = screen.getByDisplayValue('1');
    const addEqBtn = screen.getByRole('button', { name: 'Añadir' });

    fireEvent.change(eqNameInput, { target: { value: 'Proyector Epson' } });
    fireEvent.change(eqQtyInput, { target: { value: '3' } });
    fireEvent.click(addEqBtn);

    expect(screen.getByText('Proyector Epson')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    // Incrementar cantidad
    const incrementBtn = screen.getByRole('button', { name: '+' });
    fireEvent.click(incrementBtn);
    expect(screen.getByText('4')).toBeInTheDocument();

    // Decrementar cantidad
    const decrementBtn = screen.getByRole('button', { name: '-' });
    fireEvent.click(decrementBtn);
    expect(screen.getByText('3')).toBeInTheDocument();

    // Eliminar equipamiento
    const deleteBtn = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteBtn);
    expect(screen.queryByText('Proyector Epson')).not.toBeInTheDocument();
  });

  it('debería poder subir imágenes y borrarlas', async () => {
    setupMockFetch();
    render(<AdminCreateSpaceView />);

    // Simular subir archivo
    const fileInput = screen.getByLabelText(/Fotos del espacio/i);
    const file = new File(['dummy content'], 'photo.png', { type: 'image/png' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(screen.getByText('photo.png')).toBeInTheDocument();

    // Remover la foto subida
    const closeBtn = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByText('photo.png')).not.toBeInTheDocument();
  });

  it('debería eliminar una imagen existente en el servidor', async () => {
    setupMockFetch();
    const editingSpace = { id: 201, name: 'Aula 101', capacity: 20, userInChargeId: 10 };
    
    render(<AdminCreateSpaceView editingSpace={editingSpace} />);

    // Esperar que cargue la imagen existente
    const imgElement = await screen.findByAltText('Space');
    expect(imgElement).toBeInTheDocument();

    // Mock delete endpoint
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200
    });

    const removeBtn = screen.getByRole('button', { name: /close/i });
    fireEvent.click(removeBtn);

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByAltText('Space')).not.toBeInTheDocument();
    });
  });

  it('debería fallar al enviar el formulario si no hay sesión activa', async () => {
    setupMockFetch();
    render(<AdminCreateSpaceView />);

    await waitFor(() => screen.getByText('Encargado Carlos'));

    // Rellenar formulario
    fireEvent.change(screen.getByTestId('create-space-name'), { target: { value: 'Laboratorio X' } });
    fireEvent.change(screen.getByTestId('create-space-capacity'), { target: { value: '50' } });
    fireEvent.change(screen.getByTestId('create-space-userInCharge'), { target: { value: '10' } });

    // Quitar token
    localStorage.removeItem('resernur_token');

    const submitBtn = screen.getByTestId('create-space-submit-button');
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(await screen.findByText('No hay sesion activa. Inicia sesion nuevamente.')).toBeInTheDocument();
  });

  it('debería guardar un nuevo espacio con equipamiento e imágenes con éxito', async () => {
    setupMockFetch();
    const handleEditSaved = vi.fn();
    render(<AdminCreateSpaceView onEditSaved={handleEditSaved} />);

    await waitFor(() => screen.getByText('Encargado Carlos'));

    // Rellenar campos obligatorios
    fireEvent.change(screen.getByTestId('create-space-name'), { target: { value: 'Aula Magna' } });
    fireEvent.change(screen.getByTestId('create-space-capacity'), { target: { value: '100' } });
    fireEvent.change(screen.getByTestId('create-space-userInCharge'), { target: { value: '10' } });

    // Agregar un equipamiento
    fireEvent.change(screen.getByPlaceholderText('Nombre del equipo (Ej. Proyector)'), { target: { value: 'Pantalla' } });
    fireEvent.click(screen.getByRole('button', { name: 'Añadir' }));

    // Simular respuestas de creación de espacio, equipamiento e imágenes
    globalThis.fetch.mockImplementation((url, options) => {
      if (url.includes('/api/places') && options.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: { id: 88, name: 'Aula Magna', capacity: 100, userInChargeId: 10, description: '' }
          })
        });
      }
      if (url.includes('/equipment') && options.method === 'POST') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) });
      }
      if (url.includes('/images') && options.method === 'POST') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ content: [{ url: 'uploaded.jpg' }] }) });
      }
      return Promise.resolve({ ok: true });
    });

    const submitBtn = screen.getByTestId('create-space-submit-button');
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(await screen.findByText('Espacio creado con exito.')).toBeInTheDocument();
  });

  it('debería actualizar un espacio en modo edición', async () => {
    setupMockFetch();
    const handleEditSaved = vi.fn();
    const editingSpace = { id: 201, name: 'Laboratorio de Redes', capacity: 35, userInChargeId: 10 };

    render(<AdminCreateSpaceView editingSpace={editingSpace} onEditSaved={handleEditSaved} />);

    await waitFor(() => screen.getByDisplayValue('Laboratorio de Redes'));

    // Cambiar capacidad
    fireEvent.change(screen.getByTestId('create-space-capacity'), { target: { value: '40' } });

    // Mock PUT response
    globalThis.fetch.mockImplementation((url, options) => {
      if (url.includes('/api/places/201') && options.method === 'PUT') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: { id: 201, name: 'Laboratorio de Redes', capacity: 40, userInChargeId: 10 }
          })
        });
      }
      return Promise.resolve({ ok: true });
    });

    const submitBtn = screen.getByTestId('create-space-submit-button');
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(await screen.findByText('Espacio y equipamiento actualizados con exito.')).toBeInTheDocument();
    expect(handleEditSaved).toHaveBeenCalledWith({ id: 201, name: 'Laboratorio de Redes', capacity: 40, userInChargeId: 10 });
  });

  it('debería manejar error del backend si la creación del espacio falla', async () => {
    setupMockFetch();
    render(<AdminCreateSpaceView />);

    await waitFor(() => screen.getByText('Encargado Carlos'));

    fireEvent.change(screen.getByTestId('create-space-name'), { target: { value: 'Aula Magna' } });
    fireEvent.change(screen.getByTestId('create-space-capacity'), { target: { value: '100' } });
    fireEvent.change(screen.getByTestId('create-space-userInCharge'), { target: { value: '10' } });

    // Mock error response
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ errorMessage: 'El nombre ya existe.' })
    });

    const submitBtn = screen.getByTestId('create-space-submit-button');
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(await screen.findByText('El nombre ya existe.')).toBeInTheDocument();
  });
});
