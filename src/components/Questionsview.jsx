import { useState, useEffect, useMemo, useRef } from "react";
import {
  Plus, Trash2, Tag, Edit2, Check, X,
  ClipboardList, ListChecks, Save
} from "lucide-react";
import { api } from "../api.js";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Escala 0-5 (0 = sin referencia, NO cuenta para el promedio)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const LIKERT_OPTIONS = [
  { value: 0, label: "Sin referencia para evaluar a esta persona" },
  { value: 1, label: "Nunca presenta esta conducta" },
  { value: 2, label: "Casi nunca presenta esta conducta" },
  { value: 3, label: "A veces presenta esta conducta" },
  { value: 4, label: "Casi siempre presenta esta conducta" },
  { value: 5, label: "Siempre presenta esta conducta" },
];

// Rangos de interpretación del promedio
export function getRangoInfo(promedio) {
  if (promedio == null || isNaN(promedio) || promedio <= 0) {
    return { label: "—", cellBg: "" };
  }
  if (promedio >= 4.25) return { label: "Fortaleza",            cellBg: "bg-emerald-500 text-white" };
  if (promedio >= 3.70) return { label: "En equilibrio",        cellBg: "bg-lime-400 text-white" };
  if (promedio >= 3.10) return { label: "Área débil",           cellBg: "bg-amber-400 text-black" };
  return                       { label: "Área de oportunidad", cellBg: "bg-red-500 text-white" };
}

// Promedio que IGNORA 0 (sin referencia) y null/undefined
export function promedioValido(valores) {
  const validos = valores.filter((v) => v != null && v > 0);
  if (validos.length === 0) return 0;
  return validos.reduce((a, b) => a + b, 0) / validos.length;
}

export function QuestionsView({ questions, valores, usuarios, respuestas, onReload, rol }) {
  const [tab, setTab] = useState(rol === "supervisor" ? "evaluar" : "gestionar");

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex gap-1 border-b border-[var(--border)]">
        {[
          { id: "gestionar", label: "Gestionar preguntas", icon: <ListChecks size={14} />,    roles: ["admin"] },
          { id: "evaluar",   label: "Evaluar empleados",   icon: <ClipboardList size={14} />, roles: ["admin", "supervisor"] },
        ]
          .filter((t) => t.roles.includes(rol))
          .map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm border-b-2 -mb-px transition-colors ${
                tab === t.id
                  ? "border-[var(--primary)] text-[var(--primary)] font-medium"
                  : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
      </div>

      {tab === "gestionar" ? (
        <Gestionar questions={questions} valores={valores} onReload={onReload} />
      ) : (
        <EvaluarMatriz questions={questions} usuarios={usuarios} onReload={onReload} rol={rol} />
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ Gestionar (igual que antes) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function Gestionar({ questions, valores, onReload }) {
  const [newText, setNewText] = useState("");
  const [newValorId, setNewValorId] = useState(valores[0]?.id ?? null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [filtroValor, setFiltroValor] = useState("todos");

  const filtered = filtroValor === "todos"
    ? questions
    : questions.filter((q) => q.valor_id === Number(filtroValor));

  const add = async () => {
    if (!newText.trim() || !newValorId) return;
    await api.crearPregunta(newText.trim(), newValorId);
    setNewText("");
    onReload();
  };
  const remove = async (id) => {
    if (!confirm("¿Eliminar esta pregunta? Se borrarán también sus respuestas.")) return;
    await api.borrarPregunta(id);
    onReload();
  };
  const save = async (id) => {
    if (!editText.trim()) return;
    await api.editarPregunta(id, { texto: editText.trim() });
    setEditingId(null);
    onReload();
  };

  return (
    <div className="flex flex-col gap-4 flex-1 overflow-hidden">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-[var(--muted-foreground)]">Filtrar por valor:</span>
        <select
          value={filtroValor}
          onChange={(e) => setFiltroValor(e.target.value)}
          className="bg-[var(--input-background)] border border-[var(--border)] rounded-md px-2 py-1 text-xs outline-none focus:border-[var(--primary)]"
        >
          <option value="todos">Todos los valores</option>
          {valores.map((v) => (<option key={v.id} value={v.id}>{v.nombre}</option>))}
        </select>
        <span className="text-xs text-[var(--muted-foreground)] ml-2">
          Mostrando {filtered.length} de {questions.length}
        </span>
      </div>

      <div className="flex gap-2 p-4 rounded-lg bg-[var(--card)] border border-[var(--border)]">
        <div className="flex-1 flex flex-col gap-2">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Escribe una nueva conducta…"
            className="w-full bg-[var(--input-background)] border border-[var(--border)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
          />
          <div className="flex items-center gap-2">
            <label className="text-xs text-[var(--muted-foreground)]">Valor:</label>
            <select
              value={newValorId ?? ""}
              onChange={(e) => setNewValorId(Number(e.target.value))}
              className="bg-[var(--input-background)] border border-[var(--border)] rounded-md px-2 py-1 text-xs outline-none focus:border-[var(--primary)]"
            >
              {valores.map((v) => (<option key={v.id} value={v.id}>{v.nombre}</option>))}
            </select>
          </div>
        </div>
        <button
          onClick={add}
          disabled={!newText.trim()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-[var(--primary)] text-white text-sm hover:opacity-90 disabled:opacity-40 self-start"
        >
          <Plus size={14} /> Agregar
        </button>
      </div>

      <div className="flex-1 overflow-auto flex flex-col gap-2">
        {filtered.map((q, idx) => (
          <div key={q.id} className="group flex items-center gap-3 px-4 py-3 rounded-lg bg-[var(--card)] border border-[var(--border)] hover:border-[var(--primary)]/30">
            <span className="text-[var(--muted-foreground)] text-xs font-mono w-8 shrink-0">P{q.orden ?? idx + 1}</span>
            {editingId === q.id ? (
              <input
                autoFocus
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") save(q.id);
                  if (e.key === "Escape") setEditingId(null);
                }}
                className="flex-1 bg-[var(--input-background)] border border-[var(--primary)] rounded-md px-2 py-1 text-sm outline-none"
              />
            ) : (
              <span className="flex-1 text-sm">{q.texto}</span>
            )}
            <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-white" style={{ backgroundColor: q.valor_color }}>
              <Tag size={9} /> {q.valor_nombre}
            </span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
              {editingId === q.id ? (
                <>
                  <button onClick={() => save(q.id)} className="p-1 rounded text-emerald-500 hover:bg-emerald-500/10"><Check size={14} /></button>
                  <button onClick={() => setEditingId(null)} className="p-1 rounded text-[var(--muted-foreground)] hover:bg-[var(--muted)]"><X size={14} /></button>
                </>
              ) : (
                <>
                  <button onClick={() => { setEditingId(q.id); setEditText(q.texto); }} className="p-1 rounded text-[var(--muted-foreground)] hover:text-[var(--primary)]"><Edit2 size={13} /></button>
                  <button onClick={() => remove(q.id)} className="p-1 rounded text-[var(--muted-foreground)] hover:text-red-500"><Trash2 size={13} /></button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ Evaluar matriz ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function EvaluarMatriz({ questions = [], usuarios = [], onReload, rol }) {
  const [edicion, setEdicion] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState(false);
  const [estado, setEstado] = useState(null);
  const [cargandoEstado, setCargandoEstado] = useState(true);
  const [reiniciando, setReiniciando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const s = await api.estadoEvaluacion();
        setEstado(s);
      } catch (err) {
        console.error(err);
      } finally {
        setCargandoEstado(false);
      }
    })();
  }, []);

  const bloqueado = estado?.evaluacion_completada === true;

  const getCelda = (uId, qId) => {
    const key = `${uId}-${qId}`;
    return key in edicion ? edicion[key] : undefined;
  };

  const setCelda = (uId, qId, valor) => {
    if (bloqueado) return;
    setEdicion((prev) => ({ ...prev, [`${uId}-${qId}`]: valor }));
    if (mensajeExito) setMensajeExito(false);
    if (errorValidacion) setErrorValidacion("");
  };

  const promPorPregunta = (qId) => promedioValido(usuarios.map((u) => getCelda(u.id, qId)));
  const promPorUsuario  = (uId) => promedioValido(questions.map((q) => getCelda(uId, q.id)));
  const promGeneral     = () => {
    const all = [];
    usuarios.forEach((u) => questions.forEach((q) => all.push(getCelda(u.id, q.id))));
    return promedioValido(all);
  };

  const enviarEvaluacion = async () => {
    const totalCeldas  = usuarios.length * questions.length;
    const celdasLlenas = Object.values(edicion).filter((v) => v != null).length;
    if (celdasLlenas < totalCeldas) {
      setErrorValidacion(
        `Debes calificar TODAS las celdas antes de enviar. Faltan ${totalCeldas - celdasLlenas} de ${totalCeldas}.`
      );
      return;
    }
    if (!confirm("Al enviar tu evaluación ya NO podrás modificarla. ¿Continuar?")) return;

    setGuardando(true);
    setMensajeExito(false);
    setErrorValidacion("");
    try {
      for (const [key, valor] of Object.entries(edicion)) {
        if (valor == null) continue;
        const [uId, qId] = key.split("-").map(Number);
        await api.guardarRespuesta(uId, qId, valor);
      }
      await api.completarEvaluacion();

      setEdicion({});
      setMensajeExito(true);
      const s = await api.estadoEvaluacion();
      setEstado(s);
      onReload();
    } catch (err) {
      console.error(err);
      alert(`Error al enviar la evaluación:\n\n${err.message}`);
    } finally {
      setGuardando(false);
    }
  };

  const reiniciarTodo = async () => {
    if (!confirm("⚠️ Esto BORRARÁ todas las respuestas y liberará a TODOS los supervisores para evaluar de nuevo.\n\n¿Estás completamente seguro?")) return;
    if (!confirm("Última confirmación: se perderán TODAS las evaluaciones actuales. ¿Continuar?")) return;

    setReiniciando(true);
    try {
      await api.reiniciarEvaluaciones();
      setEdicion({});
      setMensajeExito(false);
      const s = await api.estadoEvaluacion();
      setEstado(s);
      onReload();
      alert("Evaluaciones reiniciadas. Ya puedes volver a calificar.");
    } catch (err) {
      console.error(err);
      alert(`Error al reiniciar: ${err.message}`);
    } finally {
      setReiniciando(false);
    }
  };

  // ━━━ GUARDAS PRIMERO (antes de cualquier cálculo con .length en el render) ━━━
  if (cargandoEstado) {
    return <div className="p-6 text-center text-sm text-[var(--muted-foreground)]">Cargando…</div>;
  }
  if (!Array.isArray(usuarios) || usuarios.length === 0) {
    return <div className="p-6 rounded-lg bg-[var(--card)] border border-[var(--border)] text-center text-sm text-[var(--muted-foreground)]">Agrega colaboradores desde el módulo Matriz.</div>;
  }
  if (!Array.isArray(questions) || questions.length === 0) {
    return <div className="p-6 rounded-lg bg-[var(--card)] border border-[var(--border)] text-center text-sm text-[var(--muted-foreground)]">Agrega preguntas en la pestaña "Gestionar".</div>;
  }

  // Estos cálculos SOLO se ejecutan si pasamos las guardas
  const totalCeldas  = usuarios.length * questions.length;
  const celdasLlenas = Object.values(edicion).filter((v) => v != null).length;
  const todasLlenas  = celdasLlenas === totalCeldas;

  return (
    <div className="flex flex-col gap-3 flex-1 overflow-hidden">
      {bloqueado && (
        <div className="flex items-start gap-3 px-4 py-4 rounded-lg bg-slate-100 border-2 border-slate-300 text-slate-800">
          <Check size={20} className="shrink-0 mt-0.5 text-emerald-600" />
          <div className="flex-1">
            <div className="font-semibold text-sm">Ya enviaste tu evaluación</div>
            <div className="text-xs text-slate-600 mt-1">
              Enviada el{" "}
              {estado?.evaluacion_completada_at
                ? new Date(estado.evaluacion_completada_at).toLocaleString("es-MX")
                : "—"}
              . No puedes modificarla. Si necesitas volver a evaluar, contacta a un administrador para que reinicie las evaluaciones.
            </div>
          </div>
        </div>
      )}

      {mensajeExito && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
          <Check size={16} className="shrink-0" />
          <span><strong>Evaluación enviada correctamente.</strong></span>
        </div>
      )}

      {errorValidacion && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
          <X size={16} className="shrink-0" />
          <span>{errorValidacion}</span>
        </div>
      )}

      {rol === "admin" && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200">
          <div className="text-xs text-amber-900">
            <strong>Controles de administrador:</strong> Al reiniciar se borrarán TODAS las respuestas y los supervisores podrán evaluar de nuevo.
          </div>
          <button
            onClick={reiniciarTodo}
            disabled={reiniciando}
            className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-600 text-white text-xs font-medium hover:bg-amber-700 disabled:opacity-40"
          >
            <Trash2 size={13} />
            {reiniciando ? "Reiniciando..." : "Reiniciar evaluación"}
          </button>
        </div>
      )}

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="text-xs text-[var(--muted-foreground)] leading-relaxed max-w-3xl">
          <span className="font-semibold text-[var(--foreground)]">Conteste considerando la siguiente escala:</span>{" "}
          {LIKERT_OPTIONS.map((o, i) => (
            <span key={o.value}>
              <strong>{o.value}</strong> = {o.label}{i < LIKERT_OPTIONS.length - 1 ? "; " : "."}
            </span>
          ))}
        </div>
        {!bloqueado && (
          <div className="flex items-center gap-3 shrink-0">
            <span className={`text-xs font-medium ${todasLlenas ? "text-emerald-600" : "text-amber-600"}`}>
              {celdasLlenas} / {totalCeldas} celdas llenas
            </span>
            <button
              onClick={enviarEvaluacion}
              disabled={guardando}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-[var(--primary)] text-white text-sm hover:opacity-90 disabled:opacity-40 shadow-sm"
            >
              <Save size={14} />
              {guardando ? "Enviando..." : "Enviar evaluación"}
            </button>
          </div>
        )}
      </div>

      <MatrizEvaluacion
        questions={questions}
        usuarios={usuarios}
        getCelda={getCelda}
        setCelda={setCelda}
        promPorPregunta={promPorPregunta}
        promPorUsuario={promPorUsuario}
        promGeneral={promGeneral}
        editable={!bloqueado}
      />

      <RangosLeyenda />
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ Matriz reutilizable ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function MatrizEvaluacion({
  questions, usuarios, getCelda, setCelda,
  promPorPregunta, promPorUsuario, promGeneral, editable
}) {
  // matriz de refs [filaPregunta][colUsuario] para navegación con flechas
  const inputsRef = useRef([]);

  const focusCelda = (qIdx, uIdx) => {
    const fila = inputsRef.current[qIdx];
    if (!fila) return;
    const input = fila[uIdx];
    if (input) {
      input.focus();
      input.select?.();
    }
  };

  const handleKey = (e, qIdx, uIdx) => {
    const totalQ = questions.length;
    const totalU = usuarios.length;
    let nq = qIdx, nu = uIdx;
    switch (e.key) {
      case "ArrowRight": nu = uIdx + 1; if (nu >= totalU) { nu = 0; nq = qIdx + 1; } break;
      case "ArrowLeft":  nu = uIdx - 1; if (nu < 0)       { nu = totalU - 1; nq = qIdx - 1; } break;
      case "ArrowDown":
      case "Enter":      nq = qIdx + 1; break;
      case "ArrowUp":    nq = qIdx - 1; break;
      case "Tab":        return;
      default: return;
    }
    if (nq < 0 || nq >= totalQ) return;
    e.preventDefault();
    focusCelda(nq, nu);
  };

  return (
    <div className="overflow-auto rounded-lg border border-slate-300 bg-white shadow-sm">
      <table className="border-collapse text-sm" style={{ minWidth: "100%" }}>
        <thead>
          <tr>
            <th
              rowSpan={2}
              className="sticky left-0 top-0 z-30 bg-slate-700 text-white text-left px-3 border border-slate-600 align-middle"
              style={{ minWidth: 320, maxWidth: 320 }}
            >
              <div className="text-sm font-semibold leading-tight">Compromiso con las conductas deseadas</div>
            </th>
            <th
              colSpan={usuarios.length}
              className="text-center px-2 bg-slate-700 text-white border border-slate-600 sticky top-0 z-20 text-[11px] font-semibold uppercase tracking-wider"
              style={{ height: 22 }}
            >
              Nombres de los colaboradores a evaluar
            </th>
            <th
              rowSpan={2}
              className="bg-slate-800 text-white text-center border border-slate-600 sticky top-0 right-0 z-20 align-middle"
              style={{ minWidth: 48, maxWidth: 48 }}
            >
              <div className="[writing-mode:vertical-rl] rotate-180 font-semibold text-[10px] tracking-wider">
                PROM. TOTAL
              </div>
            </th>
          </tr>
          <tr>
            {usuarios.map((u) => (
              <th
                key={u.id}
                className="px-0 border border-slate-300 bg-slate-100 text-slate-800 align-bottom sticky z-10"
                style={{ minWidth: 34, maxWidth: 34, top: 22 }}
                title={u.nombre}
              >
                <div
                  className="[writing-mode:vertical-rl] rotate-180 text-[11px] font-medium mx-auto whitespace-nowrap capitalize py-1"
                  style={{ minHeight: 90 }}
                >
                  {u.nombre}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {questions.map((q, qIdx) => {
            const prom = promPorPregunta(q.id);
            const info = getRangoInfo(prom);
            if (!inputsRef.current[qIdx]) inputsRef.current[qIdx] = [];
            return (
              <tr key={q.id} className="hover:bg-slate-50">
                <td
                  className="sticky left-0 bg-white px-2 py-1 border border-slate-300 align-middle"
                  style={{ minWidth: 320, maxWidth: 320 }}
                >
                  <div className="flex gap-1.5 items-start">
                    <span className="text-[11px] text-slate-400 font-mono shrink-0 leading-tight">{qIdx + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] leading-tight text-slate-800 block">{q.texto}</span>
                      <span className="text-[9px] uppercase tracking-wider font-semibold inline-block" style={{ color: q.valor_color }}>
                        {q.valor_nombre}
                      </span>
                    </div>
                  </div>
                </td>
                {usuarios.map((u, uIdx) => {
                  const val = getCelda(u.id, q.id);
                  return (
                    <td key={u.id} className="border border-slate-300 p-0 text-center" style={{ minWidth: 34, maxWidth: 34 }}>
                      {editable ? (
                        <CeldaEditable
                          valor={val}
                          onChange={(nv) => setCelda(u.id, q.id, nv)}
                          inputRef={(el) => { inputsRef.current[qIdx][uIdx] = el; }}
                          onKeyDown={(e) => handleKey(e, qIdx, uIdx)}
                        />
                     ) : (
  <div className="px-1 py-1 text-xs">
    {val == null
      ? <span className="text-slate-300">–</span>
      : (typeof val === "number" ? val.toFixed(2) : val)}
  </div>
)}
                    </td>
                  );
                })}
                <td className={`border border-slate-300 text-center font-semibold text-xs px-1 py-1 ${info.cellBg}`}>
                  {prom > 0 ? prom.toFixed(2) : "–"}
                </td>
              </tr>
            );
          })}

          <tr>
            <td className="sticky left-0 bg-slate-100 px-2 py-1 border border-slate-300 text-right text-[11px] font-bold uppercase tracking-wider text-slate-700">
              Prom. Total
            </td>
            {usuarios.map((u) => {
              const prom = promPorUsuario(u.id);
              const info = getRangoInfo(prom);
              return (
                <td key={u.id} className={`border border-slate-300 text-center text-xs font-semibold px-1 py-1 ${info.cellBg}`}>
                  {prom > 0 ? prom.toFixed(2) : "–"}
                </td>
              );
            })}
            {(() => {
              const prom = promGeneral();
              const info = getRangoInfo(prom);
              return (
                <td className={`border border-slate-300 text-center text-xs font-bold px-1 py-1 ${info.cellBg}`}>
                  {prom > 0 ? prom.toFixed(2) : "–"}
                </td>
              );
            })()}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function CeldaEditable({ valor, onChange, inputRef, onKeyDown }) {
  const handleChange = (e) => {
    const raw = e.target.value;
    if (raw === "") { onChange(null); return; }
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 0 || n > 5) return;
    onChange(n);
  };
  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      maxLength={1}
      value={valor ?? ""}
      onChange={handleChange}
      onKeyDown={onKeyDown}
      onFocus={(e) => e.target.select()}
      className="w-full h-7 text-center text-xs font-medium bg-transparent border-0 outline-none focus:bg-[var(--primary)]/10 focus:ring-2 focus:ring-inset focus:ring-[var(--primary)]"
    />
  );
}

export function RangosLeyenda() {
  const rangos = [
    { label: "5.00 – 4.25 = Fortaleza",           cls: "bg-emerald-500 text-white" },
    { label: "4.24 – 3.70 = En equilibrio",       cls: "bg-lime-400 text-white" },
    { label: "3.69 – 3.10 = Área débil",          cls: "bg-amber-400 text-black" },
    { label: "3.09 – 1.00 = Área de oportunidad", cls: "bg-red-500 text-white" },
  ];
  return (
    <div className="rounded-lg border border-[var(--border)] overflow-hidden shrink-0">
      <div className="bg-[var(--secondary)] text-center text-xs font-semibold py-1.5 border-b border-[var(--border)]">
        Rangos de interpretación de resultados
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4">
        {rangos.map((r) => (
          <div key={r.label} className={`text-center text-xs font-semibold py-2 px-3 ${r.cls}`}>
            {r.label}
          </div>
        ))}
      </div>
    </div>
  );
}