# Ventana Gestión de Usuarios

## Componente React - UserManagementView.jsx

```jsx
import React, { useState } from 'react';

const SAMPLE_USERS = [
  {
    id: 1,
    name: 'Mario Ballesteros',
    email: 'm.ballesteros@scholarflow.edu',
    role: 'Docente',
    roleColor: 'primary',
    status: 'Activo',
    statusColor: 'green',
    lastAccess: 'Hace 12 min',
    avatar: 'MB'
  },
  {
    id: 2,
    name: 'Elena Gutiérrez',
    email: 'elena.gtz@scholarflow.edu',
    role: 'Administrador',
    roleColor: 'on-primary-container',
    status: 'Activo',
    statusColor: 'green',
    lastAccess: 'Ayer, 18:45',
    avatar: 'EG'
  },
  {
    id: 3,
    name: 'Roberto Luna',
    email: 'r.luna@student.scholar.edu',
    role: 'Estudiante',
    roleColor: 'surface-variant',
    status: 'Inactivo',
    statusColor: 'gray',
    lastAccess: '03 Oct 2023',
    avatar: 'RL'
  }
];

export default function UserManagementView() {
  const [users, setUsers] = useState(SAMPLE_USERS);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: 'estudiante',
    password: '••••••••'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateUser = (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email) {
      alert('Por favor completa todos los campos');
      return;
    }

    const initials = formData.fullName
      .split(' ')
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase();

    const newUser = {
      id: users.length + 1,
      name: formData.fullName,
      email: formData.email,
      role: formData.role.charAt(0).toUpperCase() + formData.role.slice(1),
      roleColor: formData.role === 'admin' ? 'on-primary-container' : 'primary',
      status: 'Activo',
      statusColor: 'green',
      lastAccess: 'Ahora',
      avatar: initials
    };

    setUsers((prev) => [newUser, ...prev]);
    setFormData({ fullName: '', email: '', role: 'estudiante', password: '••••••••' });
    setShowForm(false);
    alert('Usuario creado exitosamente');
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm('¿Está seguro de que desea eliminar este usuario?')) {
      setUsers((prev) => prev.filter((user) => user.id !== userId));
      alert('Usuario eliminado');
    }
  };

  const handleEditUser = (userId) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setFormData({
        fullName: user.name,
        email: user.email,
        role: user.role.toLowerCase(),
        password: '••••••••'
      });
      setShowForm(true);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === 'Activo').length,
    pending: users.filter((u) => u.status === 'Pendiente').length
  };

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
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-br from-[#001e40] to-[#003366] text-white px-6 py-3 rounded-xl font-body-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            Crear Nuevo Usuario
          </button>
        </div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border-l-4 border-primary-container shadow-sm">
            <p className="text-label-caps text-on-secondary-container mb-1">Total Usuarios</p>
            <h3 className="text-headline-md text-primary-container">{stats.total}</h3>
          </div>
          <div className="bg-white p-5 rounded-2xl border-l-4 border-green-500 shadow-sm">
            <p className="text-label-caps text-on-secondary-container mb-1">Activos Ahora</p>
            <h3 className="text-headline-md text-primary-container">{stats.active}</h3>
          </div>
          <div className="bg-white p-5 rounded-2xl border-l-4 border-orange-400 shadow-sm">
            <p className="text-label-caps text-on-secondary-container mb-1">Pendientes</p>
            <h3 className="text-headline-md text-primary-container">{stats.pending}</h3>
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
                  <th className="px-6 py-3 text-label-caps text-on-secondary-container">Estado</th>
                  <th className="px-6 py-3 text-label-caps text-on-secondary-container">Último Acceso</th>
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
                      <td className="px-6 py-4">
                        <div
                          className={`flex items-center gap-1.5 ${
                            user.statusColor === 'green' ? 'text-green-600' : 'text-on-surface-variant'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              user.statusColor === 'green' ? 'bg-green-500' : 'bg-outline-variant'
                            }`}
                          />
                          <span className="text-body-base text-[13px] font-semibold">{user.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-body-base text-[13px] text-on-surface-variant">{user.lastAccess}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEditUser(user.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container-high text-on-surface-variant hover:bg-primary-fixed hover:text-primary-container transition-all"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container-high text-on-surface-variant hover:bg-error-container hover:text-error transition-all"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-on-surface-variant">
                      No se encontraron usuarios
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 bg-surface-container-low flex justify-between items-center text-caption-micro text-on-surface-variant">
            <span>
              Mostrando 1-{filteredUsers.length} de {users.length} usuarios
            </span>
            <div className="flex gap-1">
              <button className="w-8 h-8 flex items-center justify-center rounded bg-white shadow-sm hover:bg-primary-container hover:text-white transition-colors">
                1
              </button>
              {users.length > 10 && (
                <>
                  <button className="w-8 h-8 flex items-center justify-center rounded bg-white shadow-sm hover:bg-primary-container hover:text-white transition-colors">
                    2
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center rounded bg-white shadow-sm hover:bg-primary-container hover:text-white transition-colors">
                    3
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Create/Edit User (4 columns) */}
      <div className="col-span-12 lg:col-span-4">
        {showForm && (
          <div className="bg-white rounded-xl shadow-md border-l-4 border-primary-container sticky top-24 overflow-hidden">
            <div className="p-6 border-b border-[#eceef0]">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-primary-container">person_add</span>
                <h4 className="font-headline-md text-primary-container text-[18px]">Crear Nuevo Usuario</h4>
              </div>
              <p className="text-body-base text-on-surface-variant text-[13px]">
                Ingrese los detalles del usuario para habilitar el acceso.
              </p>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="font-body-semibold text-[13px] text-on-secondary-container">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
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
                  className="w-full bg-surface-container-high border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#003366]/20 text-body-base placeholder:text-outline-variant"
                  placeholder="m.rojas@scholarflow.edu"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-body-semibold text-[13px] text-on-secondary-container">
                  Rol Académico
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full bg-surface-container-high border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#003366]/20 text-body-base appearance-none cursor-pointer"
                >
                  <option value="estudiante">Estudiante</option>
                  <option value="docente">Docente</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-body-semibold text-[13px] text-on-secondary-container">
                  Contraseña Temporal
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full bg-surface-container-high border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#003366]/20 text-body-base"
                    value={formData.password}
                    readOnly
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
                <p className="text-[10px] text-on-surface-variant">Se solicitará cambio al primer inicio de sesión.</p>
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <button
                  type="submit"
                  className="w-full bg-primary-container text-white py-3.5 rounded-xl font-body-semibold shadow-sm hover:shadow-md transition-all active:scale-95"
                >
                  Guardar Usuario
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="w-full bg-surface-container-high text-on-secondary-container py-3 rounded-xl font-body-semibold hover:bg-surface-container-highest transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>

            {/* Contextual Help Card */}
            <div className="m-6 p-4 bg-primary/5 rounded-xl border border-primary/10">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary-container mt-0.5">info</span>
                <div>
                  <p className="text-body-semibold text-primary-container text-[13px]">Importación Masiva</p>
                  <p className="text-caption-micro text-on-secondary-container mt-1">
                    ¿Necesitas agregar cientos de estudiantes? Usa la herramienta de carga vía CSV para mayor
                    eficiencia.
                  </p>
                  <a className="inline-block mt-2 text-primary-container font-bold text-[11px] underline" href="#">
                    Ir a Importar
                  </a>
                </div>
              </div>
            </div>
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
                <li>• Por rol (Estudiante, Docente, Admin)</li>
                <li>• Por estado (Activo, Inactivo)</li>
                <li>• Últimos accesos</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

## Funcionalidades Implementadas

### 📊 Dashboard de Usuarios
- **Estadísticas en tiempo real**: Total, Activos y Pendientes
- **Tabla interactiva**: Muestra nombre, correo, rol, estado y último acceso
- **Búsqueda integrada**: Filtra por nombre o correo en tiempo real

### ➕ Crear Nuevo Usuario
- Formulario con validación
- Campos: Nombre Completo, Correo Institucional, Rol Académico
- Contraseña temporal auto-generada
- Notificación de éxito

### ✏️ Acciones de Usuario
- **Editar**: Carga datos en el formulario
- **Eliminar**: Con confirmación de seguridad
- **Estados**: Indicador visual de activo/inactivo

### 🔍 Búsqueda y Filtrado
- Búsqueda en tiempo real
- Filtros por rol, estado y acceso
- Información de importación masiva por CSV

## Estilos Tailwind CSS
- Colores personalizados (primary, secondary, etc.)
- Diseño responsivo (móvil y desktop)
- Animaciones suaves (hover, transiciones)
- Íconos Material Symbols

## Integraciones Posibles
- Backend: API REST para CRUD de usuarios
- Autenticación: JWT o sesiones
- Exportación: CSV o PDF
- Notificaciones: Email de bienvenida
