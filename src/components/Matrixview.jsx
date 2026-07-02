import { useState, useMemo } from "react";
import { Users, Plus, Trash2 } from "lucide-react";
import { api } from "../api.js";
import {
  MatrizEvaluacion,
  RangosLeyenda,
  promedioValido,
} from "./Questionsview.jsx";

export function MatrixView({ questions, usuarios, respuestas, onReload }) {
  const [newUserName, setNewUserName] = useState("");
  const [showAddUser, setShowAddUser] = useState(false);

  const mapa = useMemo(() => {
    const m = {};
    respuestas.forEach((r) => { m[`${r.usuario_id}-${r.pregunta_id}`] = r.respuesta; });
    return m;
  }, [respuestas]);

  const getCelda = (uId, qId) => mapa[`${uId}-${qId}`];

  const promPorPregunta = (qId) => promedioValido(usuarios.map((u) => getCelda(u.id, qId)));
  const promPorUsuario  = (uId) => promedioValido(questions.map((q) => getCelda(uId, q.id)));
  const promGeneral     = () => {
    const all = [];
    usuarios.forEach((u) => questions.forEach((q) => all.push(getCelda(u.id, q.id))));
    return promedioValido(all);
  };

  const addUser = async () => {
    if (!newUserName.trim()) return;
    await api.crearUsuario(newUserName.trim().toLowerCase());
    setNewUserName("");
    setShowAddUser(false);
    onReload();
  };
  const removeUser = async (id) => {
    if (!confirm("¿Eliminar este colaborador?")) return;
    await api.borrarUsuario(id);
    onReload();
  };

  const completadas = respuestas.length;
  const total = usuarios.length * questions.length;

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="flex items-center gap-2">
            <Users size={20} className="text-[var(--primary)]" />
            Matriz de Respuestas
          </h2>
          <p className="text-[var(--muted-foreground)] text-sm mt-0.5">
            {usuarios.length} colaboradores · {questions.length} conductas · {completadas}/{total} respondidas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => removeUserPrompt(usuarios, removeUser)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--muted)] text-[var(--muted-foreground)] text-sm hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 size={14} /> Eliminar colaborador
          </button>
          <button
            onClick={() => setShowAddUser(!showAddUser)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--primary)] text-white text-sm hover:opacity-90"
          >
            <Plus size={14} /> Agregar colaborador
          </button>
        </div>
      </div>

      {showAddUser && (
        <div className="flex gap-2 p-3 rounded-lg bg-[var(--secondary)] border border-[var(--border)]">
          <input
            type="text"
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addUser()}
            placeholder="Nombre del colaborador..."
            className="flex-1 bg-[var(--input-background)] border border-[var(--border)] rounded-md px-3 py-1.5 text-sm outline-none focus:border-[var(--primary)]"
          />
          <button onClick={addUser} className="px-3 py-1.5 bg-[var(--primary)] text-white rounded-md text-sm">Agregar</button>
          <button onClick={() => setShowAddUser(false)} className="px-3 py-1.5 bg-[var(--muted)] text-[var(--muted-foreground)] rounded-md text-sm">Cancelar</button>
        </div>
      )}

      <MatrizEvaluacion
        questions={questions}
        usuarios={usuarios}
        getCelda={getCelda}
        setCelda={() => {}}
        promPorPregunta={promPorPregunta}
        promPorUsuario={promPorUsuario}
        promGeneral={promGeneral}
        editable={false}
      />

      <RangosLeyenda />
    </div>
  );
}

// Helper para elegir qué usuario eliminar (prompt simple)
function removeUserPrompt(usuarios, removeUser) {
  if (usuarios.length === 0) { alert("No hay colaboradores."); return; }
  const lista = usuarios.map((u, i) => `${i + 1}. ${u.nombre}`).join("\n");
  const idx = prompt(`¿Qué colaborador eliminar? Escribe el número:\n${lista}`);
  const n = Number(idx);
  if (!Number.isInteger(n) || n < 1 || n > usuarios.length) return;
  removeUser(usuarios[n - 1].id);
}