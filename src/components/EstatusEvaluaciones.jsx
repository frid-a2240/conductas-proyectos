import { useEffect, useState } from "react";
import { CheckCircle2, Clock, RefreshCw } from "lucide-react";
import { api } from "../api.js";

export function EstatusEvaluaciones() {
  const [evaluadores, setEvaluadores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = async () => {
    setCargando(true);
    setError("");
    try {
      const data = await api.cristinaEstatus();
      setEvaluadores(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  if (cargando) {
    return <div className="p-6 text-center text-sm text-[var(--muted-foreground)]">Cargando…</div>;
  }

  if (error) {
    return <div className="p-6 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">{error}</div>;
  }

  const completados = evaluadores.filter(e => e.evaluacion_completada);
  const pendientes  = evaluadores.filter(e => !e.evaluacion_completada);

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="text-xs text-[var(--muted-foreground)]">
          {completados.length} de {evaluadores.length} evaluadores han completado
        </div>
        <button
          onClick={cargar}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs bg-[var(--secondary)] hover:bg-[var(--secondary)]/70 text-[var(--foreground)]"
        >
          <RefreshCw size={12} /> Actualizar
        </button>
      </div>

      {/* Completados */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border-b border-emerald-200">
          <CheckCircle2 size={15} className="text-emerald-600" />
          <span className="text-sm font-semibold text-emerald-800">
            Completada ({completados.length})
          </span>
        </div>
        {completados.length === 0 ? (
          <div className="px-4 py-6 text-center text-xs text-[var(--muted-foreground)]">
            Nadie ha completado su evaluación aún.
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {completados.map(e => (
              <li key={e.numero_empleado} className="flex items-center justify-between px-4 py-2.5">
                <div>
                  <div className="text-sm font-medium capitalize">{e.nombre}</div>
                  <div className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider font-mono">
                    ID: {e.numero_empleado} · {e.rol}
                  </div>
                </div>
                <div className="text-[10px] text-[var(--muted-foreground)]">
                  {e.evaluacion_completada_at
                    ? new Date(e.evaluacion_completada_at).toLocaleString("es-MX")
                    : ""}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pendientes */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border-b border-amber-200">
          <Clock size={15} className="text-amber-600" />
          <span className="text-sm font-semibold text-amber-800">
            Pendiente ({pendientes.length})
          </span>
        </div>
        {pendientes.length === 0 ? (
          <div className="px-4 py-6 text-center text-xs text-[var(--muted-foreground)]">
            Todos ya completaron.
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {pendientes.map(e => (
              <li key={e.numero_empleado} className="flex items-center justify-between px-4 py-2.5">
                <div>
                  <div className="text-sm font-medium capitalize">{e.nombre}</div>
                  <div className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider font-mono">
                    ID: {e.numero_empleado} · {e.rol}
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
                  Sin enviar
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}