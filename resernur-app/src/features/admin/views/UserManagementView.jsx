import React, { useState, useEffect, useCallback } from 'react';

const API = 'http://localhost:5000';

function authHeaders() {
  const token = localStorage.getItem('resernur_token');
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

export default function UserManagementView() {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: 'SOLICITANTE',
    password: 'resernur123'
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/users?pageSize=100`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data.content) {
          const mappedUsers = data.content.map(u => {
            const initials = u.fullName ? u.fullName.split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase() : 'U';
            return {
              id: u.id,
              name: u.fullName || 'Sin Nombre',
              email: u.email,
              role: u.role || 'SOLICITANTE',
              roleColor: u.role === 'ADMINISTRADOR' ? 'on-primary-container' : 'primary',
              avatar: initials
            };
          });
          setUsers(mappedUsers);
        }
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({ fullName: '', email: '', role: 'SOLICITANTE', password: 'resernur123' });
    setIsEditing(false);
    setEditingUserId(null);
    setShowForm(false);
  };

  const handleCreateOrUpdateUser = async (e) => {
    e.preventDefault();
    if (!formData.fullName || (!isEditing && !formData.email)) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    setIsLoading(true);

    try {
      if (isEditing && editingUserId) {
        // PUT /api/users/{id}
        const payload = {
          fullName: formData.fullName,
          password: formData.password
        };
        const res = await fetch(`${API}/api/users/${editingUserId}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('No se pudo actualizar el usuario');
        alert('Usuario actualizado exitosamente');
      } else {
        // POST /api/auth/register
        const payload = {
          fullName: formData.fullName,
          email: formData.email,
          role: formData.role,
          password: formData.password
        };
        const res = await fetch(`${API}/api/auth/register`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('No se pudo crear el usuario. Verifica que el correo no exista ya.');
        alert('Usuario creado exitosamente');
      }

      resetForm();
      fetchUsers();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = (userId) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setFormData({
        fullName: user.name,
        email: user.email,
        role: user.role,
        password: '' // vacio para no sobreescribir si no escriben nada
      });
      setIsEditing(true);
      setEditingUserId(userId);
      setShowForm(true);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-[1400px] mx-auto grid grid-cols-12 gap-8">
      {/* Main Work Area (8 columns) */}
      <div className="col-span-12 lg:col-span-8">
        {/* Header Section */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-4xl font-bold text-primary-container">Gestión de Usuarios</h2>
            <p className="text-body-base text-on-secondary-container mt-1">
              Administra el acceso institucional y los perfiles de la plataforma.
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(!showForm); }}
            className="bg-gradient-to-br from-[#001e40] to-[#003366] text-white px-6 py-3 rounded-xl font-body-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            Crear Nuevo Usuario
          </button>
        </div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border-l-4 border-primary-container shadow-sm">
            <p className="text-label-caps text-on-secondary-container mb-1">Total Usuarios</p>
            <h3 className="text-headline-md text-primary-container">{users.length}</h3>
          </div>
        </div>

        {/* Users Table Card */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-primary/5 px-6 py-4 flex justify-between items-center">
            <span className="font-headline-md text-primary-container text-[16px]">Listado de Usuarios</span>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-surface-container-high rounded-lg transition-colors">
                <span className="material-symbols-outlined text-[20px]">filter_list</span>
              </button>
              <button className="p-2 hover:bg-surface-container-high rounded-lg transition-colors">
                <span className="material-symbols-outlined text-[20px]">download</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low border-b border-[#eceef0]">
                  <th className="px-6 py-3 text-label-caps text-on-secondary-container">Nombre y Correo</th>
                  <th className="px-6 py-3 text-label-caps text-on-secondary-container">Rol</th>
                  <th className="px-6 py-3 text-label-caps text-on-secondary-container text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eceef0]">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-primary/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary-fixed-dim flex items-center justify-center font-bold text-[#001e40] text-[12px]">
                            {user.avatar}
                          </div>
                          <div>
                            <p className="font-body-semibold text-primary-container">{user.name}</p>
                            <p className="text-caption-micro text-on-surface-variant font-normal lowercase">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-primary/10 text-primary-container text-[10px] font-bold rounded uppercase">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEditUser(user.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container-high text-on-surface-variant hover:bg-primary-fixed hover:text-primary-container transition-all"
                            title="Editar usuario"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="px-6 py-8 text-center text-on-surface-variant">
                      No se encontraron usuarios
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 bg-surface-container-low flex justify-between items-center text-caption-micro text-on-surface-variant">
            <span>
              Mostrando {filteredUsers.length} de {users.length} usuarios
            </span>
          </div>
        </div>
      </div>

      {/* Right Panel: Create/Edit User (4 columns) */}
      <div className="col-span-12 lg:col-span-4">
        {showForm && (
          <div className="bg-white rounded-xl shadow-md border-l-4 border-primary-container sticky top-24 overflow-hidden">
            <div className="p-6 border-b border-[#eceef0]">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-primary-container">
                  {isEditing ? 'manage_accounts' : 'person_add'}
                </span>
                <h4 className="font-headline-md text-primary-container text-[18px]">
                  {isEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
                </h4>
              </div>
              <p className="text-body-base text-on-surface-variant text-[13px]">
                {isEditing ? 'Actualice los datos permitidos del usuario.' : 'Ingrese los detalles del usuario para habilitar el acceso.'}
              </p>
            </div>

            <form onSubmit={handleCreateOrUpdateUser} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="font-body-semibold text-[13px] text-on-secondary-container">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-surface-container-high border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#003366]/20 text-body-base placeholder:text-outline-variant"
                  placeholder="Ej: Dr. Manuel Rojas"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-body-semibold text-[13px] text-on-secondary-container">
                  Correo Institucional
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required={!isEditing}
                  disabled={isEditing}
                  className="w-full bg-surface-container-high border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#003366]/20 text-body-base placeholder:text-outline-variant disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder="m.rojas@scholarflow.edu"
                />
                {isEditing && <p className="text-[10px] text-on-surface-variant">El correo no se puede modificar.</p>}
              </div>

              <div className="space-y-1.5">
                <label className="font-body-semibold text-[13px] text-on-secondary-container">
                  Rol Académico
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  disabled={isEditing}
                  className="w-full bg-surface-container-high border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#003366]/20 text-body-base appearance-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="SOLICITANTE">Solicitante (Estudiante/Docente)</option>
                  <option value="ENCARGADO">Encargado de Espacio</option>
                  <option value="ADMINISTRADOR">Administrador</option>
                </select>
                {isEditing && <p className="text-[10px] text-on-surface-variant">El rol no se puede modificar.</p>}
              </div>

              <div className="space-y-1.5">
                <label className="font-body-semibold text-[13px] text-on-secondary-container">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    onChange={handleInputChange}
                    className="w-full bg-surface-container-high border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#003366]/20 text-body-base pr-12"
                    value={formData.password}
                    placeholder={isEditing ? 'Dejar en blanco para no cambiar' : 'Contraseña inicial'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary-container text-white py-3.5 rounded-xl font-body-semibold shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-70"
                >
                  {isLoading ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Guardar Usuario')}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full bg-surface-container-high text-on-secondary-container py-3 rounded-xl font-body-semibold hover:bg-surface-container-highest transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search Panel when form is hidden */}
        {!showForm && (
          <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
            <div className="mb-4">
              <label className="font-body-semibold text-[13px] text-on-secondary-container mb-2 block">
                Buscar Usuarios
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-surface-container-high border-none rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-[#003366]/20 text-body-base placeholder:text-on-surface-variant"
                  placeholder="Buscar por nombre o correo..."
                />
              </div>
            </div>

            <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
              <p className="text-body-semibold text-primary-container text-[13px] mb-2">Filtros Disponibles</p>
              <ul className="text-caption-micro text-on-secondary-container space-y-2">
                <li>• Por rol (Estudiante, Docente, Encargado, Admin)</li>
                <li>• Búsqueda por nombre o correo</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
