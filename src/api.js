// Siempre relativo: en dev el proxy de Vite redirige; en prod FastAPI lo sirve.
const BASE = "/conductas-proyectos/api";

// Endpoints donde un 401 NO significa "sesión expirada", sino "credenciales inválidas"
const AUTH_ENDPOINTS = ["/auth/login", "/auth/change-password"];

async function req(path, options = {}) {
  const r = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...options,
  });


  if (r.status === 401) {
    const esEndpointAuth = AUTH_ENDPOINTS.some((ep) => path.startsWith(ep));
    if (!esEndpointAuth) {
      window.dispatchEvent(new CustomEvent("auth:expired"));
      throw new Error("No autenticado");
    }
    // Cae al manejo de error normal de abajo para que el mensaje llegue al UI
  }

  if (!r.ok) {
    const text = await r.text();
    let detail = text;
    try { detail = JSON.parse(text).detail || text; } catch { /* texto plano */ }
    throw new Error(detail);
  }
  return r.status === 204 ? null : r.json();
}

export const api = {
 // ━━━ Estatus (solo Cristina 202001) ━━━
cristinaEstatus: () => req("/cristina/estatus"),
  // ━━━ Auth ━━━
  login: (numero_empleado, password) =>
    req("/auth/login", { method: "POST", body: JSON.stringify({ numero_empleado, password }) }),
  logout:  ()         => req("/auth/logout", { method: "POST" }),
  me:      ()         => req("/auth/me"),
  changePassword: (current_password, new_password) =>
    req("/auth/change-password", { method: "POST", body: JSON.stringify({ current_password, new_password }) }),

  // ━━━ Estado de evaluación ━━━
  estadoEvaluacion:      ()  => req("/evaluacion/estado"),
  completarEvaluacion:   ()  => req("/evaluacion/completar",  { method: "POST" }),
  reiniciarEvaluaciones: ()  => req("/evaluacion/reiniciar",  { method: "POST" }),
  
  // ━━━ Preguntas / Valores ━━━
  valores:        ()                => req("/valores"),
  preguntas:      ()                => req("/preguntas"),
  crearPregunta:  (texto, valor_id) => req("/preguntas",       { method: "POST",   body: JSON.stringify({ texto, valor_id }) }),
  editarPregunta: (id, data)        => req(`/preguntas/${id}`, { method: "PUT",    body: JSON.stringify(data) }),
  borrarPregunta: (id)              => req(`/preguntas/${id}`, { method: "DELETE" }),

  // ━━━ Usuarios (empleados de la matriz) ━━━
  usuarios:       ()         => req("/usuarios"),
  crearUsuario:   (nombre)   => req("/usuarios",       { method: "POST",   body: JSON.stringify({ nombre }) }),
  borrarUsuario:  (id)       => req(`/usuarios/${id}`, { method: "DELETE" }),

  // ━━━ Respuestas ━━━
respuestas:        ()       => req("/respuestas"),
guardarRespuesta:  (usuario_id, pregunta_id, respuesta) =>
  req("/respuestas", { method: "POST", body: JSON.stringify({ usuario_id, pregunta_id, respuesta }) }),
guardarRespuestasBatch: (respuestas) =>
  req("/respuestas/batch", { method: "POST", body: JSON.stringify({ respuestas }) }),

  // ━━━ Excel ━━━
  exportarExcel: async () => {
    const r = await fetch(`${BASE}/exportar/excel`, { credentials: "include" });
    if (!r.ok) throw new Error("Error al descargar el Excel");
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const disp = r.headers.get("Content-Disposition") || "";
    const match = disp.match(/filename="([^"]+)"/);
    a.download = match ? match[1] : "conductas.xlsx";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};