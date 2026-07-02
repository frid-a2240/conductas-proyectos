import { useState } from "react";
import { Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { auth } from "../auth.js";
import isplogo from "../imports/isplogo.png";
import conductas from "../imports/conductas.jpg";

export function Login({ onLogin }) {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
  e?.preventDefault?.();
  setError("");
  if (!id.trim() || !password) {
    setError("Ingresa tu ID y contraseña para continuar.");
    return;
  }
  setLoading(true);
  try {
    const user = await auth.login(id.trim(), password);
    onLogin(user);
  } catch (err) {
    setError(err.message || "ID o contraseña incorrectos.");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-white">
      {/* ━━━━━━━━━ Izquierda: imagen ━━━━━━━━━ */}
      <div className="relative hidden lg:block overflow-hidden">
        <img src={conductas} alt="" className="h-full w-full object-cover" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-5 left-6 text-xs text-white/90">
          © {new Date().getFullYear()} ISP · Evaluación de Conductas
        </div>
      </div>

      {/* ━━━━━━━━━ Derecha: formulario ━━━━━━━━━ */}
      <div className="flex items-center justify-center px-6 py-10 sm:px-12 lg:px-16">
        <div className="w-full max-w-md">
          {/* Marca */}
          <div className="mb-8 flex flex-col items-center text-center">
            <img src={isplogo} alt="ISP" className="h-16 w-auto object-contain" />
            <p className="mt-4 text-sm font-semibold" style={{ color: "var(--isp-azul)" }}>
              Infraestructura y Servicios Portuarios
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight" style={{ color: "var(--isp-turquesa)" }}>
              Evaluación de Conductas
            </h1>
          </div>

          <div className="mb-8 h-px w-full bg-slate-200" />

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Iniciar sesión</h2>
            <p className="mt-1 text-sm text-slate-500">
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* ID */}
            <div className="flex flex-col gap-2">
              <label htmlFor="login-id" className="text-sm font-semibold text-slate-800">
                ID de empleado
              </label>
              <input
                id="login-id"
                type="text"
                inputMode="numeric"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="Ej. 204726"
                autoFocus
                disabled={loading}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--primary)] focus:bg-white focus:ring-4 focus:ring-[var(--primary)]/10 disabled:opacity-50"
              />
            </div>

            {/* Contraseña */}
            <div className="flex flex-col gap-2">
              <label htmlFor="login-pw" className="text-sm font-semibold text-slate-800">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="login-pw"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--primary)] focus:bg-white focus:ring-4 focus:ring-[var(--primary)]/10 disabled:opacity-50"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Botón */}
            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full rounded-lg bg-[#1e293b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0f172a] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Ingresando…" : "Ingresar"}
            </button>
          </form>

          <div className="mt-10 text-center text-[11px] text-slate-400 lg:hidden">
            © {new Date().getFullYear()} ISP · Evaluación de Conductas
          </div>
        </div>
      </div>
    </div>
  );
}