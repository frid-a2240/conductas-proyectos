import { useState } from "react";
import { Eye, EyeOff, AlertCircle, Loader2, ShieldCheck, CheckCircle2, ArrowLeft } from "lucide-react";
import { auth } from "../auth.js";
import isplogo from "../imports/isplogo.png";

export function ChangePassword({ user, onChanged, onCancel }) {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw]         = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);

  const firstTime = user?.must_change_password;

  const rules = [
    { ok: newPw.length >= 8,                                 text: "Al menos 8 caracteres" },
    { ok: /[0-9]/.test(newPw),                               text: "Al menos un número" },
    { ok: /[a-zA-Z]/.test(newPw),                            text: "Al menos una letra" },
    { ok: newPw && newPw.toLowerCase() !== "isp2026",        text: "Distinta a la genérica (isp2026)" },
    { ok: newPw && newPw === confirmPw,                      text: "Las contraseñas coinciden" },
  ];

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    setError("");

    if (!currentPw || !newPw || !confirmPw) {
      setError("Completa todos los campos.");
      return;
    }
    if (newPw !== confirmPw) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }
    if (newPw === currentPw) {
      setError("La nueva contraseña debe ser distinta a la actual.");
      return;
    }

    setLoading(true);
    try {
      await auth.changePassword(currentPw, newPw);
      const updated = { ...user, must_change_password: false };
      auth.setUser(updated);
      onChanged(updated);
    } catch (err) {
      setError(err.message || "No se pudo cambiar la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  // ━━━ En primer login: "Volver al inicio" CIERRA SESIÓN ━━━
  // ━━━ En cambio voluntario: "Cancelar" solo vuelve atrás   ━━━
  const handleSecondary = async () => {
    if (loading) return;
    if (firstTime) {
      try { await auth.logout(); } catch (_) {}
      onChanged(null);     // App.jsx interpreta null como "cerrar sesión y volver al login"
    } else {
      onCancel?.();
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 px-6 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <img src={isplogo} alt="ISP" className="h-14 w-auto object-contain" />
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
            <ShieldCheck size={14} />
            {firstTime ? "Primer inicio de sesión" : "Cambiar contraseña"}
          </div>
          <h1 className="mt-3 text-2xl font-bold text-slate-900">
            {firstTime ? "Establece tu nueva contraseña" : "Cambiar contraseña"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Hola, <span className="font-medium text-slate-700">{user?.nombre}</span>.{" "}
            {firstTime
              ? "Por seguridad, debes cambiar la contraseña genérica antes de continuar."
              : "Ingresa tu contraseña actual y la nueva."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-800">
              Contraseña actual {firstTime && <span className="text-xs font-normal text-slate-500">(isp2026 si es tu primer ingreso)</span>}
            </label>
            <input
              type={showPw ? "text" : "password"}
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              placeholder="••••••••"
              autoFocus
              disabled={loading}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[var(--primary)] focus:bg-white focus:ring-4 focus:ring-[var(--primary)]/10 disabled:opacity-50"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-800">Nueva contraseña</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 pr-11 text-sm text-slate-900 outline-none transition focus:border-[var(--primary)] focus:bg-white focus:ring-4 focus:ring-[var(--primary)]/10 disabled:opacity-50"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-800">Confirmar nueva contraseña</label>
            <input
              type={showPw ? "text" : "password"}
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[var(--primary)] focus:bg-white focus:ring-4 focus:ring-[var(--primary)]/10 disabled:opacity-50"
            />
          </div>

          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Requisitos</div>
            <ul className="flex flex-col gap-1">
              {rules.map((r, i) => (
                <li key={i} className={`flex items-center gap-2 text-xs ${r.ok ? "text-emerald-700" : "text-slate-500"}`}>
                  <CheckCircle2 size={13} className={r.ok ? "text-emerald-600" : "text-slate-300"} />
                  {r.text}
                </li>
              ))}
            </ul>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-2">
            {/* ★ Botón secundario: SIEMPRE visible (logout en first-time, cancel en cambio voluntario) */}
            <button
              type="button"
              onClick={handleSecondary}
              disabled={loading}
              className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <ArrowLeft size={14} />
              {firstTime ? "Volver al inicio" : "Cancelar"}
            </button>
            <button
              type="submit"
              disabled={loading || !rules.every(r => r.ok)}
              className="flex-1 rounded-lg bg-[#1e293b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0f172a] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Guardando…" : "Guardar contraseña"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}