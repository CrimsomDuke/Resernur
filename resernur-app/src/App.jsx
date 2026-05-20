import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import Login from './features/auth/Login'
import TopNavBar from './components/TopNavBar'
import SpaceExplorer from './features/visual_space_explorer/SpaceExplorer'
import BookingEngine from './features/space_booking_engine/BookingEngine'
import AdminPanel from './features/admin/AdminPanel'
import CalendarView from './features/calendar/CalendarView'
import UserRequestsView from './features/user_requests/UserRequestsView'
import ProtectedRoute from './components/ProtectedRoute'
import { isAuthenticated, getRoleFromToken } from './utils/auth'

const ADMIN_ROLE = 'ROLE_ADMINISTRADOR';
const MANAGER_ROLE = 'ROLE_ENCARGADO';

function getInitialViewByRole(role) {
  return role === ADMIN_ROLE || role === MANAGER_ROLE ? '/admin' : '/espacios';
}

// Layout wrapper to inject TopNavBar and handle global states
function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userRole, setUserRole] = useState(null);
  const [spaceToBook, setSpaceToBook] = useState(null);
  const [spaceToEdit, setSpaceToEdit] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('resernur_token');
    if (token && isAuthenticated()) {
      setUserRole(getRoleFromToken(token));
    }
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("resernur_token");
    setUserRole(null);
    setSpaceToBook(null);
    setSpaceToEdit(null);
    navigate('/login');
  };

  const handleNavigate = (view) => {
    if (view === 'explorer') navigate('/espacios');
    else if (view === 'my-requests') navigate('/mis-reservas');
    else if (view === 'calendar') navigate('/calendario');
    else if (view === 'admin') navigate('/admin');
  };

  const handleReserveSpace = (space) => {
    setSpaceToBook(space);
    navigate('/reserva');
  };

  const handleEditSpace = (space) => {
    if (userRole !== ADMIN_ROLE) return;
    setSpaceToEdit(space);
    navigate('/admin');
  };

  // Determinar la vista actual basada en la ruta para el TopNavBar
  let currentViewStr = "explorer";
  if (location.pathname.includes('/mis-reservas')) currentViewStr = "my-requests";
  else if (location.pathname.includes('/calendario')) currentViewStr = "calendar";
  else if (location.pathname.includes('/admin')) currentViewStr = "admin";
  else if (location.pathname.includes('/reserva')) currentViewStr = "bookingEngine";

  // Si estamos en /login, no mostramos el layout
  if (location.pathname === '/login') {
    return <Login onLoginSuccess={(token) => {
      const role = getRoleFromToken(token);
      setUserRole(role);
      navigate(getInitialViewByRole(role));
    }} />;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <TopNavBar 
        currentView={currentViewStr} 
        onNavigate={handleNavigate} 
        onLogout={handleLogout} 
        isAdmin={userRole === ADMIN_ROLE || userRole === MANAGER_ROLE}
        isManager={userRole === MANAGER_ROLE}
      />
      
      <main style={{ padding: '2rem', paddingTop: '6rem' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/espacios" replace />} />
          
          <Route path="/espacios" element={
            <ProtectedRoute>
              <SpaceExplorer
                onReserve={handleReserveSpace}
                onAuthError={handleLogout}
                isAdmin={userRole === ADMIN_ROLE || userRole === MANAGER_ROLE}
                onEditSpace={handleEditSpace}
              />
            </ProtectedRoute>
          } />

          <Route path="/reserva" element={
            <ProtectedRoute>
              <BookingEngine 
                spaceToBook={spaceToBook} 
                onGoBack={() => navigate('/espacios')} 
              />
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute requireAdmin={true} userRole={userRole}>
              <AdminPanel 
                 editingSpace={spaceToEdit} 
                 onEditHandled={() => setSpaceToEdit(null)}
                 isManager={userRole === MANAGER_ROLE}
              />
            </ProtectedRoute>
          } />

          <Route path="/calendario" element={
            <ProtectedRoute>
              <CalendarView onGoBack={() => navigate('/espacios')} />
            </ProtectedRoute>
          } />
          
          <Route path="/mis-reservas" element={
            <ProtectedRoute>
              <UserRequestsView onNavigate={handleNavigate} />
            </ProtectedRoute>
          } />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/espacios" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;
