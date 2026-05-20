import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, getRoleFromToken } from '../utils/auth';

const ADMIN_ROLE = 'ROLE_ADMINISTRADOR';
const MANAGER_ROLE = 'ROLE_ENCARGADO';

export default function ProtectedRoute({ children, requireAdmin = false, userRole = null }) {
  const location = useLocation();
  const isAuth = isAuthenticated();

  if (!isAuth) {
    // Si no está logueado, redirigir al login y guardar la ruta que intentaba acceder
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin) {
    const token = localStorage.getItem('resernur_token');
    const role = userRole || getRoleFromToken(token);
    // Para rutas administrativas, aceptamos tanto ADMIN_ROLE como MANAGER_ROLE
    if (role !== ADMIN_ROLE && role !== MANAGER_ROLE) {
      // Si requiere admin/encargado y no es el rol correcto, mandar a explorer
      return <Navigate to="/espacios" replace />;
    }
  }

  return children;
}
