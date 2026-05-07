import React, { useState, useEffect, useMemo } from 'react';
import './CalendarView.css';

const STATUS_COLORS = {
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
  ONGOING: 'bg-blue-100 text-blue-800 border-blue-200',
  PENDING: 'bg-orange-100 text-orange-800 border-orange-200',
};

export default function CalendarView({ onGoBack }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('resernur_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // Fetch up to 1000 bookings to ensure we get everything for now
        const res = await fetch('http://localhost:5000/api/bookings?pageSize=1000', { headers });
        if (res.ok) {
          const data = await res.json();
          setBookings(data.content || []);
        }
      } catch (err) {
        console.error('Failed to fetch bookings:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay(); // 0 is Sunday, 1 is Monday...
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  // Adjust so Monday is 0 and Sunday is 6
  let firstDay = getFirstDayOfMonth(currentYear, currentMonth) - 1;
  if (firstDay === -1) firstDay = 6; 

  const monthName = currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' });

  // Group bookings by date string (YYYY-MM-DD)
  const bookingsByDate = useMemo(() => {
    const map = {};
    bookings.forEach(booking => {
      if (booking.status === 'REJECTED' || booking.status === 'CANCELLED') return;
      
      const datePart = booking.startTime.split('T')[0];
      if (!map[datePart]) map[datePart] = [];
      map[datePart].push(booking);
    });
    return map;
  }, [bookings]);

  // Generate calendar cells
  const blanks = Array.from({ length: firstDay }, (_, i) => (
    <div key={`blank-${i}`} className="bg-surface-container-lowest border border-[#eceef0] min-h-[120px] opacity-50"></div>
  ));

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayBookings = bookingsByDate[dateStr] || [];

    const isToday = new Date().toISOString().split('T')[0] === dateStr;

    return (
      <div key={`day-${d}`} className={`bg-white border border-[#eceef0] min-h-[120px] flex flex-col p-2 transition-colors hover:bg-primary/5`}>
        <div className="flex justify-between items-center mb-1">
          <span className={`text-[13px] font-bold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-white' : 'text-on-surface-variant'}`}>
            {d}
          </span>
          {dayBookings.length > 0 && (
            <span className="text-[10px] font-bold text-primary-container bg-primary/10 px-1.5 py-0.5 rounded">
              {dayBookings.length}
            </span>
          )}
        </div>
        <div className="flex-1 overflow-y-auto calendar-scroll pr-1 space-y-1 mt-1">
          {dayBookings.map((b) => {
            const startTimeStr = b.startTime.split('T')[1].substring(0, 5);
            const statusClass = STATUS_COLORS[b.status] || 'bg-surface-container-high text-on-surface';
            
            return (
              <div key={b.id} className={`text-[10px] p-1.5 rounded border leading-tight ${statusClass} truncate cursor-pointer hover:opacity-80 transition-opacity`} title={`${b.place?.name} - ${b.bookingRequest?.user?.fullName}`}>
                <strong className="block mb-0.5">{startTimeStr}</strong>
                {b.place?.name}
              </div>
            );
          })}
        </div>
      </div>
    );
  });

  const allCells = [...blanks, ...days];

  return (
    <main className="pt-24 pb-12 px-6 md:px-8 max-w-[1440px] mx-auto text-on-surface">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold text-primary tracking-tight font-headline">Calendario de Reservas</h1>
          <p className="text-on-surface-variant font-body mt-2">
            Visualiza todas las reservas programadas en los espacios de la universidad.
          </p>
        </div>
        {onGoBack && (
          <button
            onClick={onGoBack}
            className="px-6 py-3 bg-surface-container-high text-on-secondary-container rounded-xl font-bold hover:bg-surface-container-highest transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Volver
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-surface-container-high">
        {/* Header toolbar */}
        <div className="flex items-center justify-between p-6 bg-surface-container-lowest border-b border-[#eceef0]">
          <div className="flex items-center gap-4">
            <button onClick={previousMonth} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant hover:text-primary">
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <h2 className="text-2xl font-bold text-primary-container capitalize min-w-[200px] text-center">
              {monthName}
            </h2>
            <button onClick={nextMonth} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant hover:text-primary">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 border border-outline-variant text-primary-container font-semibold rounded-lg hover:bg-primary/5 transition-colors text-sm"
            >
              Hoy
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="h-[600px] flex items-center justify-center flex-col text-primary">
            <span className="material-symbols-outlined animate-spin text-5xl mb-4">progress_activity</span>
            <p className="font-bold">Cargando calendario...</p>
          </div>
        ) : (
          <div className="p-4 bg-surface-container-lowest">
            {/* Days of week header */}
            <div className="grid grid-cols-7 mb-2">
              {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(day => (
                <div key={day} className="text-center text-[12px] font-bold text-on-surface-variant uppercase tracking-wider py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="calendar-grid rounded-xl overflow-hidden border border-[#eceef0] bg-[#eceef0] gap-[1px]">
              {allCells}
            </div>
            
            {/* Legend */}
            <div className="mt-6 flex items-center justify-center gap-6 text-[12px] font-bold">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                <span className="text-on-surface-variant">Completadas / Aprobadas</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                <span className="text-on-surface-variant">En curso</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-400"></span>
                <span className="text-on-surface-variant">Pendientes</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
