import React, { useState, useEffect } from 'react';

export default function SpaceExplorer({ onReserve, onAuthError }) {
  const [spaces, setSpaces] = useState([]);
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const DEFAULT_IMAGES = [
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCnw1bJEiqqg6hJ0WgN5OEE3d9xXzaa5CnvKVVKfWDu2waWCJ1Zw2ImMb4KikxZGOb9hWmXi9gwxVubXM2XKhMMm5kGTp8OxpMo_MjQdX8l11HmcJZg7r7WoMeRJk-I-4zR7J-mxIhOg6k4eRBQ_bVayhZMtERQirMCmUpSXNIAsm4tWZULclwjIcVIP8BWdXM4aOrFI9Wh4cOYiCrFUrYyKAgwW61K6seaVLCpmHjX_dISaLj7oCTsFaNspKyLCcsRVg_NGsO498w",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBn0WnBxGNPHdZnJS6k4vmL84ldZMzye8t7nNvm3Olh9IU1hwx_NUzfPEFT8WlP25wQl1_y908B4s3M_U6KIo154EEBjIXYfyVFQZ23sKHdI3xXT-fP_WTHsfkguVF8g_W6kgYr86IpQ7LlTCyb8baPXvoCZFLk0wBvDFXxoUQJZ_Oh0gGkW5IuVlTJHIAU_A6nNZ_Gm6rL2vmI3Cf9Duhwaxli8_EqBw-2j3nSYOW_ui1N1LAZb5g3NGDDprRrB8q0vh9NNCRiuuk",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDgKAsDu_IhY694CGDVZxFRq6Cikso0ucRJNOfjUD34P4TbIAjX6hF568LYY9W6wUFo-S-v47lS17RcXhlTBHU_WCJLLxM6gyxTknCGRrnjVNtYpRSvhhjhlICuiIJHBvqhJxWfYkyfS6bUedlxC3Veu2mlPt9sDojz3kafo5C5iETh1129j-XzwzWPEJdfbWe7kRq_rPYUjFNR3XDf39MQVeJG2D3ZJndAYpg4NLfb3SArxAetuWmWx6hLtwmgC3gyl3UdlNf_6WI",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuA0odetD4xjwtJaHiSEf_RbVew1xogxel_2VgLbLkWFgCTG_YUZ51xU3NIqr0hR4bh77RPRRQX6f4R1YDQFwKkzN6xBDnhjlPleBo5y8C1BfSsTUJmRam8AVSc3F9Cn0oS45uMFFi4mxpC08QgIgtoG8HkjvsZW01lFbZG5HhNendkUqOnAl8xMrRF4BZpvldqHx-9B-j3g7ivg9JALbVGfzCdV-HcX9kr30CcnAFmNKuuFnWl-OuLrzKwUf0g5ccx7CcDwPZdwPNs"
  ];

  useEffect(() => {
    fetchSpaces();
  }, []);

  const fetchSpaces = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const token = localStorage.getItem("resernur_token");
      const headers = token ? { "Authorization": `Bearer ${token}` } : {};

      const response = await fetch("http://localhost:5000/api/places", { headers });
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("resernur_token");
        if (onAuthError) onAuthError();
        throw new Error("Tu sesion vencio. Inicia sesion nuevamente.");
      }

      if (!response.ok) {
        throw new Error("No se pudieron cargar los espacios. Verifica que la API este encendida.");
      }

      const resData = await response.json();
      const content = resData.data?.content || resData.content || [];

      const mappedSpaces = content.map((sp, idx) => ({
        ...sp,
        image: DEFAULT_IMAGES[idx % DEFAULT_IMAGES.length]
      }));

      setSpaces(mappedSpaces);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Error cargando espacios.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSpaces = spaces.filter(s => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return s.name.toLowerCase().includes(term) || (s.description && s.description.toLowerCase().includes(term));
  });

  return (
    <main className="pt-24 pb-16 px-6 md:px-12 max-w-[1440px] mx-auto text-on-surface">
      {/* Category Landing Section */}
      <header className="mb-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="font-label text-xs font-bold tracking-[0.1em] text-on-secondary-container uppercase mb-2 block">Recursos Institucionales</span>
            <h1 className="font-headline text-4xl font-extrabold tracking-tight text-primary">Visualizador de Espacios</h1>
          </div>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Buscar..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="px-4 py-2 rounded-lg bg-surface-container-highest border-none focus:ring-2 focus:ring-primary"
            />
            <button className="p-3 bg-surface-container-highest rounded-lg hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined">tune</span>
            </button>
          </div>
        </div>

      </header>

      {/* Space Gallery Section */}
      <section className="mb-20">
        <div className="flex items-center gap-4 mb-8">
          <h2 className="font-headline text-2xl font-bold text-primary">Espacios Disponibles</h2>
          <div className="h-[1px] flex-1 bg-surface-container-highest"></div>
        </div>

        {isLoading ? (
          <div className="text-center p-8">Cargando espacios del catálogo...</div>
        ) : errorMsg ? (
          <div className="text-center p-8 rounded-xl bg-red-50 border border-red-200 text-red-700">
            {errorMsg}
          </div>
        ) : filteredSpaces.length === 0 ? (
          <div className="text-center p-8 rounded-xl bg-surface-container-low border border-surface-container-high text-on-surface-variant">
            No hay espacios para mostrar en este momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredSpaces.map((space, index) => (
              <div 
                key={space.id} 
                className={`bg-surface-container-lowest rounded-xl overflow-hidden hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer ${selectedSpace?.id === space.id ? 'ring-2 ring-primary border-l-4 border-tertiary' : ''}`}
                onClick={() => setSelectedSpace(space)}
              >
                <div className="relative h-48">
                  <img alt={space.name} className="w-full h-full object-cover" src={space.image}/>
                  <div className="absolute top-4 left-4">
                    <span className="glass-card px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase text-primary border border-white/20">{space.capacity} Pax</span>
                  </div>
                </div>
                <div className="p-5">
                  <h4 className="font-headline text-lg font-bold text-primary mb-1">{space.name}</h4>
                  <p className="text-on-surface-variant text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    {space.description?.substring(0, 35) || "Bloque Académico"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Room Fact Sheet (Selected Space Detail) */}
      {selectedSpace && (
        <section className="bg-surface-container rounded-3xl overflow-hidden shadow-2xl shadow-primary/10 transition-all">
          <div className="flex flex-col lg:flex-row">
            {/* Hero Image Area */}
            <div className="lg:w-3/5 relative min-h-[400px]">
              <img alt={selectedSpace.name} className="absolute inset-0 w-full h-full object-cover" src={selectedSpace.image}/>
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent"></div>
              <div className="absolute bottom-10 left-10 text-white">
                <div className="flex gap-2 mb-4">
                  <span className="bg-primary px-3 py-1 rounded text-[10px] font-bold tracking-widest uppercase">Espacio Verificado</span>
                  <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded text-[10px] font-bold tracking-widest uppercase">Uso Académico</span>
                </div>
                <h2 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight mb-2 drop-shadow-md">{selectedSpace.name}</h2>
                <p className="text-lg opacity-90">{selectedSpace.description || "Ficha técnica institucional en detalle."}</p>
              </div>
            </div>

            {/* Room Details Area */}
            <div className="lg:w-2/5 p-12 flex flex-col justify-between bg-surface-container-lowest border-l border-surface-container-highest">
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center text-white">
                      <span className="material-symbols-outlined">groups</span>
                    </span>
                    <div>
                      <p className="font-label text-xs uppercase tracking-tighter text-on-surface-variant">Capacidad</p>
                      <p className="font-bold text-primary">{selectedSpace.capacity} Pax</p>
                    </div>
                  </div>
                  <div className="h-10 w-[1px] bg-surface-container-highest"></div>
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 bg-secondary-container rounded-lg flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">square_foot</span>
                    </span>
                    <div>
                      <p className="font-label text-xs uppercase tracking-tighter text-on-surface-variant">Modalidad</p>
                      <p className="font-bold text-primary">Presencial</p>
                    </div>
                  </div>
                </div>

                <div className="mb-10">
                  <h5 className="font-headline text-sm font-bold text-primary uppercase tracking-widest mb-6 border-b border-surface-container-high pb-2">Equipamiento e Instalaciones</h5>
                  <div className="grid grid-cols-2 gap-y-6">
                    <div className="flex items-center gap-4 text-on-surface-variant">
                      <span className="material-symbols-outlined text-primary-container">videocam</span>
                      <span className="text-sm font-medium">Proyector</span>
                    </div>
                    <div className="flex items-center gap-4 text-on-surface-variant">
                      <span className="material-symbols-outlined text-primary-container">wifi</span>
                      <span className="text-sm font-medium">Conexión Wi-Fi</span>
                    </div>
                    <div className="flex items-center gap-4 text-on-surface-variant">
                      <span className="material-symbols-outlined text-primary-container">ac_unit</span>
                      <span className="text-sm font-medium">Climatización</span>
                    </div>
                    <div className="flex items-center gap-4 text-on-surface-variant">
                      <span className="material-symbols-outlined text-primary-container">co2</span>
                      <span className="text-sm font-medium">Ventilación</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-surface-container">
                <button 
                  onClick={() => onReserve(selectedSpace)}
                  className="w-full bg-primary-container text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary-container/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 group"
                >
                  Continuar Reserva
                  <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Bottom Mobile Nav (Shell Integration) */}
      <div className="md:hidden fixed bottom-0 w-full bg-slate-50/90 backdrop-blur-lg border-t border-slate-200 z-50">
        <div className="flex justify-around items-center py-3">
          <button className="flex flex-col items-center gap-1 text-slate-400">
            <span className="material-symbols-outlined">dashboard</span>
            <span className="text-[10px] font-medium">Home</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-blue-900 font-bold">
            <span className="material-symbols-outlined">meeting_room</span>
            <span className="text-[10px]">Espacios</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-slate-400">
            <span className="material-symbols-outlined">calendar_month</span>
            <span className="text-[10px] font-medium">Reservas</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-slate-400">
            <span className="material-symbols-outlined">person</span>
            <span className="text-[10px] font-medium">Perfil</span>
          </button>
        </div>
      </div>
    </main>
  );
}
