import { useState, useEffect } from 'react'
import Login from './features/auth/Login'
import TopNavBar from './components/TopNavBar'
import SpaceExplorer from './features/visual_space_explorer/SpaceExplorer'
import BookingEngine from './features/space_booking_engine/BookingEngine'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState("explorer"); // 'explorer' | 'bookingEngine' | 'admin'
  const [spaceToBook, setSpaceToBook] = useState(null);

  useEffect(() => {
    // === PARCHE TEMPORAL PARA FORZAR EL CIERRE DE SESIÓN MIENTRAS SOLUCIONAS EL TOKEN EXPIRO ===
    localStorage.removeItem("resernur_token");
    setIsAuthenticated(false);
    // ===========================================================================================
    
    // const token = localStorage.getItem("resernur_token");
    // if (token) setIsAuthenticated(true);
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setCurrentView("explorer");
  };

  const handleLogout = () => {
    localStorage.removeItem("resernur_token");
    setIsAuthenticated(false);
  };

  const handleNavigate = (view) => {
    setCurrentView(view);
  };

  const handleReserveSpace = (space) => {
    setSpaceToBook(space);
    setCurrentView("bookingEngine");
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
      />
      
      <main style={{ padding: '2rem' }}>
        {currentView === "explorer" && (
          <SpaceExplorer onReserve={handleReserveSpace} />
        )}

        {currentView === "bookingEngine" && (
          <BookingEngine 
            spaceToBook={spaceToBook} 
            onGoBack={() => setCurrentView("explorer")} 
          />
        )}

        {(currentView === "calendar" || currentView === "booking" || currentView === "admin") && (
          <div style={{ textAlign: 'center', padding: '5rem', color: '#6b7280' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: '1rem' }}>construction</span>
            <h2>Sección en Construcción</h2>
            <p>Esta pantalla está siendo diseñada en Figma.</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
