import React, { useEffect, useMemo, useRef, useState } from 'react';
import logoNur from '../assets/nur.png';
const API = 'http://localhost:5000';

function authHeaders() {
  const token = localStorage.getItem('resernur_token');
  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
}

export default function TopNavBar({ currentView, onNavigate, onLogout, isAdmin = false, isManager = false }) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const notificationPanelRef = useRef(null);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !(n.read || n.isRead)).length;
  }, [notifications]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API}/api/users/me`, { headers: authHeaders() });
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.data || data);
        }
      } catch (e) {}
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (!currentUser || !currentUser.id) return;

    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${API}/api/notifications/user/${currentUser.id}?pageSize=50`, {
          headers: authHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.content || []);
        }
      } catch (err) {
        // Silently ignore polling errors
      }
    };

    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, 10000);
    return () => clearInterval(intervalId);
  }, [currentUser]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!notificationPanelRef.current) return;
      if (!notificationPanelRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleNotifications = async () => {
    const nextOpen = !isNotificationsOpen;
    setIsNotificationsOpen(nextOpen);
    if (nextOpen && unreadCount > 0 && currentUser?.id) {
      try {
        // This endpoint marks unread as read in the backend
        await fetch(`${API}/api/notifications/user/${currentUser.id}/unread`, {
          headers: authHeaders(),
        });
        
        // Optimistically update local state
        setNotifications(prev => prev.map(n => ({ ...n, read: true, isRead: true })));
      } catch (err) {
        console.error("Error marking notifications as read", err);
      }
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-slate-50/80 backdrop-blur-xl shadow-sm">
      <div className="flex justify-between items-center w-full px-8 py-4 max-w-[1440px] mx-auto">
        <div className="flex items-center gap-8">
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => onNavigate("explorer")}
          >
            <img src={logoNur} alt="NUR Logo" className="h-8 drop-shadow-md" />
            <span className="text-2xl font-headline font-black tracking-tight text-primary italic truncate">
              ReserNur
            </span>
          </div>
          <div className="hidden md:flex gap-6">

            <a 
              className={`font-medium transition-colors cursor-pointer ${currentView === 'explorer' ? 'text-blue-900 font-bold border-b-2 border-blue-900 pb-1' : 'text-slate-500 hover:text-blue-800'}`}
              onClick={() => onNavigate("explorer")}
            >
              Espacios
            </a>
            <a 
              className={`font-medium transition-colors cursor-pointer ${currentView === 'my-requests' ? 'text-blue-900 font-bold border-b-2 border-blue-900 pb-1' : 'text-slate-500 hover:text-blue-800'}`}
              onClick={() => onNavigate("my-requests")}
            >
              Mis Reservas
            </a>
            <a 
              className={`font-medium transition-colors cursor-pointer ${currentView === 'calendar' ? 'text-blue-900 font-bold border-b-2 border-blue-900 pb-1' : 'text-slate-500 hover:text-blue-800'}`}
              onClick={() => onNavigate("calendar")}
            >
              Calendario
            </a>
            {isAdmin && (
              <a 
                className={`font-medium transition-colors cursor-pointer ${currentView === 'admin' ? 'text-blue-900 font-bold border-b-2 border-blue-900 pb-1' : 'text-slate-500 hover:text-blue-800'}`}
                onClick={() => onNavigate("admin")}
              >
                {isManager ? 'Encargado' : 'Administrador'}
              </a>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative" ref={notificationPanelRef}>
            <button
              type="button"
              onClick={handleToggleNotifications}
              className="p-2 hover:bg-slate-100/50 rounded-lg transition-all scale-95 active:scale-90 relative"
              title="Notificaciones"
            >
              <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-600 text-white rounded-full border border-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-[340px] max-h-[420px] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl z-50">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-800">Notificaciones</p>
                  <span className="text-xs text-slate-500">{notifications.length} total</span>
                </div>

                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-slate-500">
                    No tienes notificaciones todavia.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {notifications.map((notification) => {
                      let displayMessage = notification.message;
                      if (displayMessage === "Your booking request has been created and is pending review") {
                        displayMessage = "Tu solicitud ha sido creada y está pendiente de revisión.";
                      } else if (displayMessage === "Se creo una nueva reserva") {
                        displayMessage = "Ha llegado una nueva solicitud de reserva.";
                      }

                      const isReadStatus = notification.read || notification.isRead;

                      return (
                        <article key={notification.id} className="px-4 py-3 hover:bg-slate-50 transition-colors border-l-4" style={{ borderColor: isReadStatus ? 'transparent' : '#dc2626' }}>
                          <p className={`text-sm text-slate-800 ${!isReadStatus ? 'font-bold' : ''}`}>{displayMessage}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
          <button className="p-2 hover:bg-slate-100/50 rounded-lg transition-all scale-95 active:scale-90" onClick={onLogout} title="Cerrar Sesión">
            <span className="material-symbols-outlined text-on-surface-variant">logout</span>
          </button>
          <img 
            alt="User profile" 
            className="w-10 h-10 rounded-full object-cover ring-2 ring-primary-container/10" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCdPtmXIudInNX3du3Vc02g9AIFISgJBl6I_CXOM7QPP_AvHUtL9pIdyKePs8JJg23POS7bNNluWrsxsnl7qjnLZldc39NWYwRhpKbr7f1e3WJAMMKEs5sTjEI3DlFhjr2JblTIY_UaZVKKjvTxRnXwfw2B-Da261TOPp--2308yjwbV74feHtmSgfR7ulsK12QN8HmfPiE_7TTa2ci4dOARgJIE2yKW3YGK5T-N6cmu1fFq1nEGW4jXFvB-xWooQuIVATcswJuzqs"
          />
        </div>
      </div>
      <div className="bg-slate-200/50 h-[1px] w-full mt-auto"></div>
    </nav>
  );
}
