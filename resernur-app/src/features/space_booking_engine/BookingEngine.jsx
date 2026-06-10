import React, { useState } from 'react';

export default function BookingEngine({ spaceToBook, onGoBack }) {
  // Get the cover image safely regardless of how the space object is structured
  const coverImage = spaceToBook?.images?.[0]
    ?? spaceToBook?.image
    ?? null;

  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');
  const [attendees, setAttendees] = useState('');
  const [activityType, setActivityType] = useState('ACADEMICO');
  const [attachment, setAttachment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch the current user's numeric ID from the API (JWT only has email as sub, no userId claim)
  async function fetchCurrentUserId() {
    const token = localStorage.getItem('resernur_token');
    if (!token) return null;
    try {
      const res = await fetch('http://localhost:5000/api/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      const data = await res.json();
      // StandardResult<UserDTO> → data.data.id   or plain UserDTO → data.id
      return data?.data?.id ?? data?.id ?? null;
    } catch {
      return null;
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (startTime >= endTime) {
      setErrorMsg('La hora de inicio debe ser anterior a la hora de fin.');
      return;
    }

    setIsSubmitting(true);

    const userId = await fetchCurrentUserId();
    if (!userId) {
      setErrorMsg('No se pudo identificar tu usuario. Intenta cerrar sesión y volver a ingresar.');
      setIsSubmitting(false);
      return;
    }

    // Build ISO datetime strings expected by Spring: "2024-05-24T14:30:00"
    const requestedStartTime = `${date}T${startTime}:00`;
    const requestedEndTime = `${date}T${endTime}:00`;

    try {
      const token = localStorage.getItem('resernur_token');
      const formData = new FormData();
      formData.append('userId', userId);
      formData.append('placeId', spaceToBook.id);
      formData.append('reason', reason);
      formData.append('activityType', activityType);
      formData.append('requestedStartTime', requestedStartTime);
      formData.append('requestedEndTime', requestedEndTime);
      if (attachment) {
        formData.append('attachment', attachment);
      }

      const res = await fetch('http://localhost:5000/api/booking-requests', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // Do NOT set Content-Type with FormData — browser adds boundary automatically
        },
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorText = data?.errorMessage || data?.error || data?.message || `Error ${res.status}: no se pudo crear la solicitud.`;
        throw new Error(errorText);
      }

      setIsSuccess(true);
    } catch (err) {
      setErrorMsg(err.message || 'Ocurrió un error al enviar la solicitud.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!spaceToBook) return null;

  if (isSuccess) {
    return (
      <main className="pt-24 pb-12 px-6 md:px-8 max-w-[1440px] mx-auto text-on-surface flex justify-center items-center min-h-[80vh]">
        <div className="bg-surface-container-lowest p-12 rounded-3xl shadow-xl shadow-secondary/10 border border-slate-100 text-center max-w-lg mt-8">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-white shadow-md">
            <span className="material-symbols-outlined text-5xl text-secondary">check_circle</span>
          </div>
          <h1 className="text-3xl font-extrabold text-primary tracking-tight mb-4 font-headline">¡Solicitud Enviada!</h1>
          <p className="text-on-surface-variant font-body leading-relaxed mb-10">
            Tu solicitud de reserva para el espacio <strong>{spaceToBook.name}</strong> fue enviada exitosamente. Será revisada por el Centro de Aprobaciones Nur.
          </p>
          <button
            onClick={onGoBack}
            className="w-full px-8 py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-container transition-all shadow-lg hover:-translate-y-1"
          >
            Volver al Visualizador
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-24 pb-12 px-6 md:px-8 max-w-[1440px] mx-auto text-on-surface">
      <div className="grid grid-cols-12 gap-8">

        {/* ── Left column ── */}
        <div className="col-span-12 lg:col-span-8">
          <div className="space-y-8">

            <header>
              <h1 className="text-3xl font-extrabold text-primary tracking-tight mb-2">Configurar la Reserva</h1>
              <p className="text-on-surface-variant font-body leading-relaxed max-w-2xl">
                Define la fecha y el rango horario para reservar <strong>{spaceToBook.name}</strong>.
              </p>
            </header>

            {/* Info alert */}
            <div className="flex items-start gap-4 p-5 bg-blue-50 rounded-lg border-l-4 border-blue-600">
              <span className="material-symbols-outlined text-blue-600 shrink-0">info</span>
              <div>
                <p className="text-sm font-bold text-blue-900">Políticas de Reserva Nur</p>
                <p className="text-sm text-blue-800 mt-1">Las reservas están sujetas a aprobación. Debe presentarse la solicitud al menos 48hrs antes del evento.</p>
              </div>
            </div>

            {/* Error */}
            {errorMsg && (
              <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-200 text-red-700 text-sm font-medium">
                <span className="material-symbols-outlined shrink-0" data-testid="error-message">error</span>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">

              {/* Date + attendees */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="block text-sm font-bold tracking-wide uppercase text-on-surface-variant font-label">Fecha de Solicitud</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">calendar_today</span>
                    <input
                      className="w-full pl-12 pr-4 py-4 bg-surface-container-high border-b-2 border-transparent focus:border-primary focus:ring-0 rounded-lg transition-all"
                      type="date"
                      required
                      value={date}
                      onChange={e => setDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="block text-sm font-bold tracking-wide uppercase text-on-surface-variant font-label">Asistentes Esperados</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">group</span>
                    <input
                      className="w-full pl-12 pr-4 py-4 bg-surface-container-high border-b-2 border-transparent focus:border-primary focus:ring-0 rounded-lg transition-all"
                      type="number"
                      placeholder={`1 – ${spaceToBook.capacity}`}
                      required
                      min={1}
                      max={spaceToBook.capacity}
                      value={attendees}
                      onChange={e => setAttendees(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Time range */}
              <div className="bg-surface-container-low p-8 rounded-xl space-y-6">
                <h3 className="text-lg font-bold text-primary">Horario de Uso</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="block text-xs font-bold uppercase text-on-surface-variant">Hora Inicio</label>
                    <input
                      type="time"
                      required
                      className="w-full p-4 bg-white border border-slate-200 rounded-lg"
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-xs font-bold uppercase text-on-surface-variant">Hora Fin</label>
                    <input
                      type="time"
                      required
                      className="w-full p-4 bg-white border border-slate-200 rounded-lg"
                      value={endTime}
                      onChange={e => setEndTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Activity type */}
              <div className="space-y-3">
                <label className="block text-sm font-bold tracking-wide uppercase text-on-surface-variant font-label">Tipo de Actividad</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">category</span>
                  <select
                    required
                    value={activityType}
                    onChange={e => setActivityType(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-surface-container-high border-b-2 border-transparent focus:border-primary focus:ring-0 rounded-lg transition-all appearance-none"
                  >
                    <option value="ACADEMICO">Académico</option>
                    <option value="CULTURAL">Cultural</option>
                    <option value="DEPORTIVO">Deportivo</option>
                    <option value="ADMINISTRATIVO">Administrativo</option>
                    <option value="OTRO">Otro</option>
                  </select>
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-3">
                <label className="block text-sm font-bold tracking-wide uppercase text-on-surface-variant font-label">Motivo de Uso</label>
                <textarea
                  required
                  rows="4"
                  className="w-full p-4 bg-surface-container-high border-b-2 border-transparent focus:border-primary rounded-lg transition-all"
                  placeholder="Explique brevemente para qué evento o clase necesita el espacio..."
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                ></textarea>
              </div>

              {/* Attachment */}
              <div className="space-y-3">
                <label className="block text-sm font-bold tracking-wide uppercase text-on-surface-variant font-label">Documento de Respaldo (opcional)</label>
                <div className="relative">
                  <input
                    type="file"
                    onChange={e => setAttachment(e.target.files[0])}
                    className="w-full p-3 bg-surface-container-high border-b-2 border-transparent focus:border-primary rounded-lg transition-all text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-container file:text-on-primary-container hover:file:bg-primary hover:file:text-white"
                  />
                  <p className="mt-2 text-xs text-on-surface-variant">Sube un PDF o imagen si necesitas respaldar la solicitud (peso máximo recomendado: 5MB).</p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-between pt-8 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onGoBack}
                  className="px-8 py-4 bg-surface-container-highest text-on-surface-variant font-bold rounded-md hover:bg-surface-container-low transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-12 py-4 bg-gradient-to-br from-primary to-primary-container text-white font-bold rounded-md shadow-lg flex items-center gap-3 hover:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span>{isSubmitting ? 'Enviando solicitud...' : 'Enviar Solicitud'}</span>
                  <span className="material-symbols-outlined text-xl">arrow_forward</span>
                </button>
              </div>

            </form>
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <aside className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-surface-container-lowest rounded-xl shadow-xl shadow-blue-900/5 overflow-hidden sticky top-24">
            <div className="h-48 w-full relative">
              {coverImage ? (
                <img className="w-full h-full object-cover" src={coverImage} alt={spaceToBook.name} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #001e40, #003366)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 48 }}>meeting_room</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent flex items-end p-6">
                <div className="text-white">
                  <h4 className="text-xs font-bold tracking-widest uppercase opacity-80">Espacio Seleccionado</h4>
                  <h3 className="text-xl font-bold">{spaceToBook.name}</h3>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-on-surface-variant">Capacidad</span>
                  <span className="font-bold text-primary">{spaceToBook.capacity} Asistentes</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-on-surface-variant">Estado</span>
                  <span className="font-bold text-primary">{spaceToBook.status ?? 'Disponible'}</span>
                </div>
              </div>
              <div className="h-[1px] bg-slate-200"></div>
              <div className="space-y-3">
                <h4 className="text-xs font-bold tracking-widest uppercase text-on-surface-variant">Términos</h4>
                <div className="flex gap-3 items-start">
                  <span className="material-symbols-outlined text-sm text-tertiary mt-1">cancel</span>
                  <p className="text-xs text-on-surface-variant leading-relaxed">Cancelaciones con un mínimo de 24h de antelación.</p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="material-symbols-outlined text-sm text-primary mt-1">school</span>
                  <p className="text-xs text-on-surface-variant leading-relaxed">Exclusivo uso académico institucional de Sede.</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

      </div>
    </main>
  );
}
