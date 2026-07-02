import { useState, useEffect } from "react";
import { Loader2, Search, User, UserCheck, AlertCircle, Lock } from "lucide-react";
import { api } from "../api.js";

const LIKERT_TXT = {
  1: "Nunca presenta esta conducta",
  2: "Casi nunca presenta esta conducta",
  3: "A veces presenta esta conducta",
  4: "Casi siempre presenta esta conducta",
  5: "Siempre presenta esta conducta",
};

const LIKERT_COLORS = {
  1: { bg: "bg-red-100",    text: "text-red-800",    border: "border-red-300"    },
  2: { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-300" },
  3: { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-300" },
  4: { bg: "bg-emerald-100",text: "text-emerald-800",border: "border-emerald-300"},
  5: { bg: "bg-green-100",  text: "text-green-800",  border: "border-green-300"  },
};

export function DetalleEvaluaciones({ user }) {
  const [evaluadores, setEvaluadores] = useState([]);
  const [evaluados, setEvaluados]     = useState([]);
  const [selEvaluador, setSelEvaluador] = useState("");
  const [selEvaluado,  setSelEvaluado]  = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Guard duro en UI (el backend también valida)
  const autorizado = user?.numero_empleado === "204726";

  useEffect(() => {
    if (!autorizado) return;
    (async () => {
      try {
        const [evs, us] = await Promise.all([
          api.listEvaluadores(),
          api.usuarios(),
        ]);
        setEvaluadores(evs);
        setEvaluados(us);
      } catch (e) {
        setError(e.message);
      }
    })();
  }, [autorizado]);

  if (!autorizado) {
    return (
      <div className="max-w-md mx-auto mt-16 p-8 bg-white border border-red-200 rounded-2xl text-center shadow-sm">
        <Lock className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Acceso restringido</h2>
        <p className="text-gray-600">
          Este módulo es exclusivo para el administrador principal.
        </p>
      </div>
    );
  }

  const handleConsultar = async () => {
    if (!selEvaluador || !selEvaluado) {
      setError("Selecciona un evaluador y un evaluado.");
      return;
    }
    setError("");
    setLoading(true);
    setData(null);
    try {
      const res = await api.respuestasDetalle(selEvaluador, parseInt(selEvaluado));
      setData(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Agrupar por Valor para pintado
  const porValor = {};
  if (data?.calificaciones) {
    for (const c of data.calificaciones) {
      if (!porValor[c.valor_id]) {
        porValor[c.valor_id] = {
          nombre: c.valor_nombre,
          color: c.valor_color,
          preguntas: [],
        };
      }
      porValor[c.valor_id].preguntas.push(c);
    }
  }

  // Stats
  const respondidas = data?.calificaciones?.filter(c => c.respuesta != null) ?? [];
  const conVoto    = respondidas.filter(c => c.respuesta > 0);
  const promedio   = conVoto.length
    ? (conVoto.reduce((s, c) => s + c.respuesta, 0) / conVoto.length).toFixed(2)
    : null;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Search className="w-6 h-6 text-indigo-600" />
          Detalle de evaluaciones
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Consulta las calificaciones individuales que un evaluador le puso a un evaluado.
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
          <div>
            <label className="text-xs font-semibold text-gray-700 flex items-center gap-1 mb-2">
              <UserCheck className="w-3.5 h-3.5" /> Evaluador
            </label>
            <select
              value={selEvaluador}
              onChange={(e) => setSelEvaluador(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            >
              <option value="">-- Selecciona quién evaluó --</option>
              {evaluadores.map((e) => (
                <option key={e.numero_empleado} value={e.numero_empleado}>
                  {e.nombre} ({e.numero_empleado})
                  {e.evaluacion_completada ? " ✓" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 flex items-center gap-1 mb-2">
              <User className="w-3.5 h-3.5" /> Evaluado
            </label>
            <select
              value={selEvaluado}
              onChange={(e) => setSelEvaluado(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            >
              <option value="">-- Selecciona a quién calificó --</option>
              {evaluados.map((u) => (
                <option key={u.id} value={u.id}>{u.nombre}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleConsultar}
            disabled={loading || !selEvaluador || !selEvaluado}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Consultar
          </button>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* Resultados */}
      {data && (
        <div className="space-y-6">
          {/* Header con contexto */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-indigo-700 font-semibold">
                  Calificaciones de
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {data.evaluador.nombre} → {data.evaluado.nombre}
                </p>
              </div>
              <div className="flex gap-4 text-sm">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Respondidas</p>
                  <p className="text-xl font-bold text-gray-900">
                    {respondidas.length} / {data.calificaciones.length}
                  </p>
                </div>
                {promedio && (
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Promedio</p>
                    <p className="text-xl font-bold text-indigo-700">{promedio} / 5</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Por valor */}
          {Object.entries(porValor).map(([vid, v]) => (
            <div key={vid} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div
                className="px-5 py-3 text-white font-bold"
                style={{ backgroundColor: v.color }}
              >
                {v.nombre}
              </div>
              <div className="divide-y divide-gray-100">
                {v.preguntas.map((p) => {
                  const r = p.respuesta;
                  const nivel = r > 0 ? Math.max(1, Math.min(5, Math.round(r))) : null;
                  const c = nivel ? LIKERT_COLORS[nivel] : null;
                  return (
                    <div key={p.pregunta_id} className="px-5 py-3 flex items-start gap-4">
                      <div className="flex-1">
                        <p className="text-sm text-gray-800">{p.pregunta_texto}</p>
                      </div>
                      <div className="shrink-0 w-64 text-right">
                        {r == null && (
                          <span className="text-xs text-gray-400 italic">Sin responder</span>
                        )}
                        {r === 0 && (
                          <span className="text-xs text-gray-500 italic">Sin referencia</span>
                        )}
                        {r > 0 && (
                          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${c.bg} ${c.text} ${c.border}`}>
                            <span className="font-bold text-base">{r}</span>
                            <span className="text-xs">{LIKERT_TXT[nivel]}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}