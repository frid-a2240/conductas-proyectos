import { useEffect, useState } from "react";
import { LayoutGrid, HelpCircle, BarChart2, ChevronRight, LogOut, ShieldCheck, PanelLeftClose, PanelLeft, Search } from "lucide-react";
import { MatrixView } from "../components/Matrixview.jsx";
import { QuestionsView } from "../components/Questionsview.jsx";
import { StatisticsView } from "../components/Statisticsview.jsx";
import { Login } from "../components/Login.jsx";
import { ChangePassword } from "../components/ChangePassword.jsx";
import { api } from "../api.js";
import { auth } from "../auth.js";
import logocompleto from "../imports/logocompleto.jpg";
import { DetalleEvaluaciones } from "../components/DetalleEvaluaciones.jsx";

const NAV_ITEMS = [
  { id: "matriz",       label: "Matriz",       icon: <LayoutGrid size={16} />, description: "Respuestas por usuario", roles: ["admin"] },
  { id: "preguntas",    label: "Preguntas",    icon: <HelpCircle size={16} />, description: "Gestionar y evaluar",    roles: ["admin", "supervisor"] },
  { id: "estadisticas", label: "Estadísticas", icon: <BarChart2  size={16} />, description: "Análisis de respuestas", roles: ["admin"] },
  { id: "detalle",      label: "Detalle",      icon: <Search size={16} />,     description: "Detalle por evaluador",  roles: ["admin"], numeroEmpleado: "204726" },
];

export default function App() {
  const [session, setSession]                 = useState(auth.current());
  const [authChecked, setAuthChecked]         = useState(false);
  const [activeModule, setActiveModule]       = useState("preguntas");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [questions, setQuestions]             = useState([]);
  const [valores, setValores]                 = useState([]);
  const [usuarios, setUsuarios]               = useState([]);
  const [respuestas, setRespuestas]           = useState([]);
  const [loading, setLoading]                 = useState(false);

  const reload = async () => {
    const [q, v, u, r] = await Promise.all([
      api.preguntas(), api.valores(), api.usuarios(), api.respuestas(),
    ]);
    setQuestions(q); setValores(v); setUsuarios(u); setRespuestas(r);
  };

  useEffect(() => {
    auth.refresh().then(user => {
      setSession(user);
      if (user) setActiveModule(user.rol === "admin" ? "matriz" : "preguntas");
      setAuthChecked(true);
    });
  }, []);

  useEffect(() => {
    const handler = () => {
      setSession(null);
      setQuestions([]); setValores([]); setUsuarios([]); setRespuestas([]);
    };
    window.addEventListener("auth:expired", handler);
    return () => window.removeEventListener("auth:expired", handler);
  }, []);

  useEffect(() => {
    if (!session || session.must_change_password) return;
    setLoading(true);
    reload()
      .catch(err => console.error("Error cargando datos:", err))
      .finally(() => setLoading(false));
  }, [session?.numero_empleado, session?.must_change_password]);

  if (!authChecked) {
    return (
      <div className="size-full flex items-center justify-center bg-[var(--background)] text-[var(--muted-foreground)]">
        Verificando sesión…
      </div>
    );
  }

  if (!session) {
    return <Login onLogin={(user) => {
      setSession(user);
      setActiveModule(user.rol === "admin" ? "matriz" : "preguntas");
    }} />;
  }

  if (session.must_change_password) {
    return (
      <ChangePassword
        user={session}
        onChanged={(user) => {
          if (user === null) {
            setSession(null);
            setActiveModule("preguntas");
          } else {
            setSession(user);
          }
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="size-full flex items-center justify-center bg-[var(--background)] text-[var(--muted-foreground)]">
        Cargando…
      </div>
    );
  }

  const visibleNavItems = NAV_ITEMS.filter(item =>
  item.roles.includes(session.rol) &&
  (!item.numeroEmpleado || item.numeroEmpleado === session.numero_empleado)
);
  const currentItem = visibleNavItems.find(n => n.id === activeModule) ?? visibleNavItems[0];
  const safeModule = currentItem?.id;

  const handleLogout = async () => {
    await auth.logout();
    setSession(null);
    setActiveModule("preguntas");
  };

  return (
    <div className="size-full flex bg-[var(--background)] text-[var(--foreground)] font-sans overflow-hidden">
      {/* ━━━━━━━━━ SIDEBAR colapsable ━━━━━━━━━ */}
      <aside
        className={`flex flex-col shrink-0 border-r border-[var(--border)] bg-[var(--card)] transition-all duration-200 ${
          sidebarCollapsed ? "w-14" : "w-64"
        }`}
      >
        {/* Cabecera con logo + botón colapso */}
        <div className="flex items-center justify-between gap-2 px-3 py-4 border-b border-[var(--border)] min-h-[80px]">
          {!sidebarCollapsed && (
            <img
              src={logocompleto}
              alt="ISP"
              className="h-12 w-auto object-contain"
            />
          )}
          <button
            onClick={() => setSidebarCollapsed((v) => !v)}
            title={sidebarCollapsed ? "Expandir menú" : "Colapsar menú"}
            className="p-1.5 rounded-md text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)] transition-colors ml-auto"
          >
            {sidebarCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex flex-col gap-1 p-2 pt-3 flex-1 overflow-y-auto">
          {!sidebarCollapsed && (
            <div className="text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-widest px-2 mb-1">
              Módulos
            </div>
          )}
          {visibleNavItems.map((item) => {
            const isActive = safeModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveModule(item.id)}
                title={sidebarCollapsed ? item.label : ""}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-all ${
                  isActive
                    ? "bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/25"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)] border border-transparent"
                } ${sidebarCollapsed ? "justify-center" : ""}`}
              >
                <span className={isActive ? "text-[var(--primary)]" : ""}>{item.icon}</span>
                {!sidebarCollapsed && (
                  <>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{item.label}</div>
                      <div className="text-[10px] opacity-70 truncate">{item.description}</div>
                    </div>
                    <ChevronRight size={12} className={`shrink-0 transition-transform ${isActive ? "rotate-90 opacity-100" : "opacity-0 group-hover:opacity-40"}`} />
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sesión + Logout */}
        <div className="border-t border-[var(--border)] p-2">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-md bg-[var(--secondary)]/60 mb-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
                <ShieldCheck size={15} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-[var(--foreground)] truncate capitalize">{session.nombre}</div>
                <div className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider">
                  ID: {session.numero_empleado} · {session.rol}
                </div>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            title={sidebarCollapsed ? "Cerrar sesión" : ""}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-[var(--muted-foreground)] hover:bg-red-50 hover:text-red-600 transition-colors text-sm ${
              sidebarCollapsed ? "justify-center" : ""
            }`}
          >
            <LogOut size={14} />
            {!sidebarCollapsed && "Cerrar sesión"}
          </button>
        </div>
      </aside>

      {/* ━━━━━━━━━ MAIN ━━━━━━━━━ */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[var(--background)]">
        <header className="flex items-center gap-3 px-6 py-3 border-b border-[var(--border)] shrink-0 bg-[var(--card)]">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
            {currentItem?.icon}
          </span>
          <div className="min-w-0">
            <h1 className="text-base font-semibold leading-tight truncate">{currentItem?.label}</h1>
            <p className="text-xs text-[var(--muted-foreground)] truncate">{currentItem?.description}</p>
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            Sistema activo
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4">
          {safeModule === "matriz" && (
            <MatrixView questions={questions} usuarios={usuarios} respuestas={respuestas} onReload={reload} />
          )}
          {safeModule === "preguntas" && (
            <QuestionsView
              questions={questions}
              valores={valores}
              usuarios={usuarios}
              respuestas={respuestas}
              onReload={reload}
              rol={session.rol}
            />
          )}
          {safeModule === "estadisticas" && (
            <StatisticsView questions={questions} usuarios={usuarios} respuestas={respuestas} />
          )}
          {safeModule === "detalle" && (
            <DetalleEvaluaciones user={session} />
          )}
        </div>
      </main>
    </div>
  );
}