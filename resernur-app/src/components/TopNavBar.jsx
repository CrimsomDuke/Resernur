import React from 'react';
import logoNur from '../assets/nur.png';

export default function TopNavBar({ currentView, onNavigate, onLogout, isAdmin = false }) {
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
              className={`font-medium transition-colors cursor-pointer ${currentView === 'dashboard' ? 'text-blue-900 font-bold border-b-2 border-blue-900 pb-1' : 'text-slate-500 hover:text-blue-800'}`}
              onClick={() => onNavigate("dashboard")}
            >
              Dashboard
            </a>
            <a 
              className={`font-medium transition-colors cursor-pointer ${currentView === 'explorer' ? 'text-blue-900 font-bold border-b-2 border-blue-900 pb-1' : 'text-slate-500 hover:text-blue-800'}`}
              onClick={() => onNavigate("explorer")}
            >
              Espacios
            </a>
            <a 
              className={`font-medium transition-colors cursor-pointer ${(currentView === 'bookingEngine' || currentView === 'booking') ? 'text-blue-900 font-bold border-b-2 border-blue-900 pb-1' : 'text-slate-500 hover:text-blue-800'}`}
              onClick={() => onNavigate("bookingEngine")}
            >
              Reservas
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
                Administrador
              </a>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-slate-100/50 rounded-lg transition-all scale-95 active:scale-90 relative">
            <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
          </button>
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
