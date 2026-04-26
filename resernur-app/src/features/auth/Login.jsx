import React, { useState } from 'react';
import bgEdificio from '../../assets/EDIFICIO.jpg';
import logoNur from '../../assets/nur.png';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        throw new Error("Credenciales inválidas o falla de conexión.");
      }

      const data = await res.json();
      if (data.token) {
        localStorage.setItem("resernur_token", data.token);
        onLoginSuccess(data.token);
      } else {
        throw new Error("No se recibió token del servidor.");
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col selection:bg-primary-fixed relative">
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center" 
        style={{ backgroundImage: `url(${bgEdificio})`, filter: 'brightness(0.35)' }}
      ></div>

      <header className="bg-[#116db6]/95 backdrop-blur-md fixed top-0 left-0 right-0 z-50">
        <nav className="flex justify-between items-center w-full px-8 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 cursor-pointer">
            <img src={logoNur} alt="NUR Logo" className="h-10 drop-shadow-md" />
            <span className="text-3xl font-headline font-black tracking-tight text-white italic truncate drop-shadow-md">
              ReserNur
            </span>
          </div>
          <div className="flex items-center">
            <button className="bg-white/20 text-white border border-white/30 px-6 py-2 rounded-lg font-label text-sm uppercase tracking-wider shadow-sm hover:bg-white/30 transition-colors" type="button">
              Plataforma Institucional
            </button>
          </div>
        </nav>
        <div className="bg-white/20 h-px w-full"></div>
      </header>

      <main className="flex-grow flex items-center justify-center pt-24 pb-12 px-6 z-10 w-full">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center text-white">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface-container-highest/20 backdrop-blur-sm mb-4 border border-white/20">
              <span className="material-symbols-outlined text-white text-3xl">menu_book</span>
            </div>
            <h1 className="font-headline text-4xl font-bold leading-tight drop-shadow-lg text-white">Acceso Institucional</h1>
            <p className="font-body opacity-90 mt-2">Ingresa tus credenciales para continuar.</p>
          </div>

          <div className="bg-surface-container-lowest rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.15)] p-10 border border-outline-variant/15 relative overflow-hidden">
            {errorMsg && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-center text-sm font-bold border border-red-200">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="block font-label text-xs uppercase tracking-widest text-secondary font-semibold" htmlFor="email">Correo Electrónico</label>
                <div className="relative">
                  <input 
                    className="w-full bg-white border border-outline-variant/30 rounded-lg px-4 py-3 font-body text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
                    id="email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="usuario@nur.edu" 
                    required 
                    type="email" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block font-label text-xs uppercase tracking-widest text-secondary font-semibold" htmlFor="password">Contraseña</label>
                  <a className="font-label text-[10px] uppercase tracking-tighter text-primary hover:underline decoration-primary/30" href="#">¿Olvidaste tu contraseña?</a>
                </div>
                <div className="relative">
                  <input 
                    className="w-full bg-white border border-outline-variant/30 rounded-lg px-4 py-3 font-body text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
                    id="password" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" 
                    required 
                    type="password" 
                  />
                </div>
              </div>

              <div className="pt-2">
                <button 
                  className="w-full py-4 rounded-lg bg-gradient-to-r from-primary-container to-primary text-on-primary font-label text-sm uppercase tracking-widest font-bold hover:shadow-lg hover:translate-y-[-1px] transition-all" 
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? "Validando..." : "Ingresar"}
                </button>
              </div>
            </form>

            <div className="mt-8 pt-8 border-t border-outline-variant/10 text-center">
              <p className="font-body text-sm text-on-surface-variant">
                ¿No tienes cuenta institucional?
                <a className="text-primary font-semibold hover:underline decoration-primary/30 ml-1" href="#">Regístrate aquí</a>
              </p>
            </div>
          </div>

          <div className="mt-8 flex justify-center items-center gap-6 opacity-80 text-white transition-all duration-500">
            <div className="flex items-center gap-2 drop-shadow-md">
              <span className="material-symbols-outlined text-sm">verified_user</span>
              <span className="font-label text-[10px] uppercase tracking-widest">Acceso Seguro</span>
            </div>
            <div className="w-px h-3 bg-white/50"></div>
            <div className="flex items-center gap-2 drop-shadow-md">
              <span className="material-symbols-outlined text-sm">account_balance</span>
              <span className="font-label text-[10px] uppercase tracking-widest">SSO Institucional</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="z-10 mt-auto border-t border-white/20 bg-black/40 backdrop-blur-sm">
        <div className="w-full py-6 px-8 flex flex-col md:flex-row justify-between items-center gap-4 max-w-7xl mx-auto">
          <div className="font-serif italic text-sm text-white/80">ReserNur - Gestión Académica</div>
          <div className="font-sans text-[10px] uppercase tracking-widest text-white/50">© 2026 Universidad Nur. Todos los derechos reservados.</div>
        </div>
      </footer>
    </div>
  );
}
