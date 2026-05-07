import { useState, useEffect } from 'react'
import Login from './features/auth/Login'
import TopNavBar from './components/TopNavBar'
import SpaceExplorer from './features/visual_space_explorer/SpaceExplorer'
import BookingEngine from './features/space_booking_engine/BookingEngine'
import AdminPanel from './features/admin/AdminPanel'
import CalendarView from './features/calendar/CalendarView'
import UserRequestsView from './features/user_requests/UserRequestsView'

const ADMIN_ROLE = 'ROLE_ADMINISTRADOR';

function parseTokenPayload(token) {
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function isTokenExpired(payload) {
  if (!payload?.exp) return false;
  const nowInSeconds = Math.floor(Date.now() / 1000);
  return payload.exp <= nowInSeconds;
}

function getRoleFromToken(token) {
  const payload = parseTokenPayload(token);
  return payload?.role || null;
}

function getInitialViewByRole(role) {
  return role === ADMIN_ROLE ? 'admin' : 'explorer';
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [currentView, setCurrentView] = useState("explorer"); // 'explorer' | 'bookingEngine' | 'admin'
  const [spaceToBook, setSpaceToBook] = useState(null);
  const [spaceToEdit, setSpaceToEdit] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('resernur_token');
    if (!token) {
      setIsAuthenticated(false);
      setUserRole(null);
      return;
    }

    const payload = parseTokenPayload(token);
    if (!payload || isTokenExpired(payload)) {
      localStorage.removeItem('resernur_token');
      setIsAuthenticated(false);
      setUserRole(null);
      return;
    }

    const role = getRoleFromToken(token);
    setIsAuthenticated(true);
    setUserRole(role);
    setCurrentView(getInitialViewByRole(role));
  }, []);

  const handleLoginSuccess = (token) => {
    const role = getRoleFromToken(token);
    setIsAuthenticated(true);
    setUserRole(role);
    setCurrentView(getInitialViewByRole(role));
  };

  const handleLogout = () => {
    localStorage.removeItem("resernur_token");
    setIsAuthenticated(false);
    setUserRole(null);
    setCurrentView('explorer');
    setSpaceToBook(null);
    setSpaceToEdit(null);
  };

  const handleNavigate = (view) => {
    if (view === 'admin' && userRole !== ADMIN_ROLE) {
      setCurrentView('explorer');
      return;
    }

    setCurrentView(view);
  };

  const handleReserveSpace = (space) => {
    setSpaceToBook(space);
    setCurrentView("bookingEngine");
  };

  const handleEditSpace = (space) => {
    if (userRole !== ADMIN_ROLE) return;
    setSpaceToEdit(space);
    setCurrentView('admin');
  };

  const handleEditHandled = () => {
    setSpaceToEdit(null);
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <TopNavBar 
        currentView={currentView} 
        onNavigate={handleNavigate} 
        onLogout={handleLogout} 
        isAdmin={userRole === ADMIN_ROLE}
      />
      
      <main style={{ padding: '2rem', paddingTop: '6rem' }}>
        {currentView === "explorer" && (
          <SpaceExplorer
            onReserve={handleReserveSpace}
            onAuthError={handleLogout}
            isAdmin={userRole === ADMIN_ROLE}
            onEditSpace={handleEditSpace}
          />
        )}

        {currentView === "bookingEngine" && (
          <BookingEngine 
            spaceToBook={spaceToBook} 
            onGoBack={() => setCurrentView("explorer")} 
          />
        )}

        {currentView === "admin" && (
          <AdminPanel editingSpace={spaceToEdit} onEditHandled={handleEditHandled} />
        )}

        {currentView === "calendar" && (
          <CalendarView onGoBack={() => setCurrentView("explorer")} />
        )}
        
        {currentView === "my-requests" && (
          <UserRequestsView onNavigate={handleNavigate} />
        )}
      </main>
    </div>
  )
}

export default App
