import { useState } from "react";
import {
  BarChart2, TrendingUp, HelpCircle,
  Download, Award, User, Users, Hash
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import { api } from "../api.js";
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Constantes
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const LIKERT_LABELS = {
  1: "Nunca presenta esta conducta",
  2: "Casi nunca presenta esta conducta",
  3: "A veces presenta esta conducta",
  4: "Casi siempre presenta esta conducta",
  5: "Siempre presenta esta conducta",
};
const LIKERT_COLORS = {
  1: "#ef4444", // red
  2: "#f97316", // orange
  3: "#f59e0b", // amber
  4: "#84cc16", // lime
  5: "#10b981", // emerald
};
const tooltipStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  fontSize: 12,
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  color: "#1f2937",
};
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Helpers
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function getColorForScore(score) {
  if (score >= 4) return "text-emerald-600";
  if (score >= 3) return "text-amber-600";
  return "text-red-600";
}
function getBadgeForScore(pct) {
  if (pct >= 80) return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (pct >= 50) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-red-100 text-red-700 border-red-200";
}
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Componente principal
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function StatisticsView({ questions, usuarios, respuestas }) {
  const [usuarioId, setUsuarioId] = useState(null);
  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-60 text-[var(--muted-foreground)]">
        <BarChart2 size={36} className="mb-2 opacity-30" />
        <p className="text-sm">No hay preguntas para mostrar estadísticas.</p>
      </div>
    );
  }
  const esIndividual = usuarioId !== null;
  const empleado = esIndividual ? usuarios.find((u) => u.id === usuarioId) : null;
  // ── Mapa de respuestas ──
  const respMap = {};
  respuestas.forEach((r) => {
    respMap[`${r.usuario_id}-${r.pregunta_id}`] = r.respuesta;
  });
  const usuariosFiltrados = esIndividual ? [empleado].filter(Boolean) : usuarios;
  // ── Métricas globales ──
  let sumaTotal = 0, respondidasTotal = 0, pendientesTotal = 0;
  const distribucion = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  questions.forEach((q) => {
  usuariosFiltrados.forEach((u) => {
    const r = respMap[`${u.id}-${q.id}`];
    if (r != null) {
      sumaTotal += r;
      respondidasTotal++;
      const nivel = Math.max(1, Math.min(5, Math.round(r)));  
      distribucion[nivel]++;
    } else {
      pendientesTotal++;
    }
  });
});
  const promedioGeneral = respondidasTotal > 0 ? (sumaTotal / respondidasTotal) : 0;
  const porcentajeGeneral = respondidasTotal > 0 ? ((promedioGeneral / 5) * 100) : 0;
  const totalPosibles = questions.length * usuariosFiltrados.length;
  const tasaCompletitud = totalPosibles > 0 ? Math.round((respondidasTotal / totalPosibles) * 100) : 0;
  // ── Datos para gráfica de distribución (Pie) ──
  const pieData = Object.entries(distribucion)
    .map(([key, value]) => ({
      name: `${key} - ${LIKERT_LABELS[key]}`,
      value,
      color: LIKERT_COLORS[key],
    }))
    .filter((d) => d.value > 0);
  // ── Conteos por valor ──
  const porValor = {};
  questions.forEach((q) => {
    if (!porValor[q.valor_nombre]) {
      porValor[q.valor_nombre] = {
        nombre: q.valor_nombre,
        color: q.valor_color,
        suma: 0,
        respondidas: 0,
        pendientes: 0,
        total: 0,
      };
    }
    usuariosFiltrados.forEach((u) => {
      const r = respMap[`${u.id}-${q.id}`];
      porValor[q.valor_nombre].total++;
      if (r != null) {
        porValor[q.valor_nombre].suma += r;
        porValor[q.valor_nombre].respondidas++;
      } else {
        porValor[q.valor_nombre].pendientes++;
      }
    });
  });
  const valoresData = Object.values(porValor).map((v) => {
    const prom = v.respondidas > 0 ? (v.suma / v.respondidas) : 0;
    return {
      name: v.nombre.length > 18 ? v.nombre.slice(0, 16) + "…" : v.nombre,
      fullName: v.nombre,
      color: v.color,
      Promedio: parseFloat(prom.toFixed(2)),
      Respondidas: v.respondidas,
      Pendientes: v.pendientes,
      pct: v.respondidas > 0 ? Math.round((prom / 5) * 100) : 0,
    };
  });
  // ── Datos para Radar por valor ──
  const radarData = valoresData.map((v) => ({
    subject: v.name,
    score: v.Promedio,
    fullMark: 5,
  }));
  // ── Conteos por pregunta ──
  const preguntasData = questions.map((q, idx) => {
    let suma = 0, count = 0;
    usuariosFiltrados.forEach((u) => {
      const r = respMap[`${u.id}-${q.id}`];
      if (r != null) { suma += r; count++; }
    });
    const prom = count > 0 ? (suma / count) : 0;
    return {
      id: q.id,
      label: `P${idx + 1}`,
      texto: q.texto,
      valor_nombre: q.valor_nombre,
      valor_color: q.valor_color,
      promedio: prom,
      respondidas: count,
      pendientes: usuariosFiltrados.length - count,
      pct: count > 0 ? Math.round((prom / 5) * 100) : 0,
    };
  });
  
  return (
    <div className="flex flex-col gap-6 h-full overflow-auto">
      {/* ━━━━━━━━━━━━━━ HEADER ━━━━━━━━━━━━━━ */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
         
          <p className="text-[var(--muted-foreground)] text-sm mt-0.5">
            {esIndividual ? (
              <>
                Evaluación individual de{" "}
                <span className="font-medium text-[var(--foreground)]">{empleado?.nombre}</span> 
              </>
            ) : (
              <>Vista general · {usuarios.length} usuarios · {questions.length} preguntas </>
            )}
          </p>
        </div>
        <button
          onClick={() => api.exportarExcel()}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-600 text-white text-sm hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Download size={15} /> Descargar Excel
        </button>
      </div>
      {/* ━━━━━━━━━━━━━━ SELECTOR DE EMPLEADO ━━━━━━━━━━━━━━ */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--card)] border border-[var(--border)]">
        {esIndividual ? (
          <User size={18} className="text-[var(--primary)]" />
        ) : (
          <Users size={18} className="text-[var(--primary)]" />
        )}
        <label className="text-sm text-[var(--muted-foreground)] shrink-0">Ver estadísticas de:</label>
        <select
          value={usuarioId ?? "todos"}
          onChange={(e) => setUsuarioId(e.target.value === "todos" ? null : Number(e.target.value))}
          className="flex-1 bg-[var(--input-background)] border border-[var(--border)] rounded-md px-3 py-1.5 text-sm outline-none focus:border-[var(--primary)]"
        >
          <option value="todos">📊 Todos los empleados (vista general)</option>
          {usuarios.map((u) => (
            <option key={u.id} value={u.id}>
              👤 {u.nombre}
            </option>
          ))}
        </select>
      </div>
      {/* ━━━━━━━━━━━━━━ TARJETAS RESUMEN ━━━━━━━━━━━━━━ */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Promedio General",
            value: promedioGeneral.toFixed(2),
            sub: "/ 5.00",
            icon: Award,
            color: getColorForScore(promedioGeneral),
            bg: "bg-[var(--primary)]/10",
          },
          {
            label: "Cumplimiento",
            value: `${porcentajeGeneral.toFixed(0)}%`,
            sub: null,
            icon: TrendingUp,
            color: getColorForScore(promedioGeneral),
            bg: porcentajeGeneral >= 80 ? "bg-emerald-100" : porcentajeGeneral >= 50 ? "bg-amber-100" : "bg-red-100",
          },
          {
            label: "Respondidas",
            value: respondidasTotal,
            sub: `/ ${totalPosibles}`,
            icon: Hash,
            color: "text-blue-600",
            bg: "bg-blue-100",
          },
          {
            label: "Completitud",
            value: `${tasaCompletitud}%`,
            sub: `${pendientesTotal} pend.`,
            icon: HelpCircle,
            color: "text-gray-600",
            bg: "bg-gray-100",
          },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="flex items-center gap-3 p-4 rounded-lg bg-[var(--card)] border border-[var(--border)] shadow-sm">
            <div className={`p-2 rounded-lg ${bg}`}>
              <Icon size={16} className={color} />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className={`text-xl font-semibold ${color}`}>{value}</span>
                {sub && <span className="text-xs text-[var(--muted-foreground)]">{sub}</span>}
              </div>
              <div className="text-xs text-[var(--muted-foreground)]">{label}</div>
            </div>
          </div>
        ))}
      </div>
      {/* ━━━━━━━━━━━━━━ Proporción Porcentual (Pie) ━━━━━━━━━━━━━━ */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
  <div className="p-4 rounded-lg bg-[var(--card)] border border-[var(--border)] shadow-sm">
    <h3 className="flex items-center gap-2 text-sm mb-4 text-[var(--foreground)]">
      Proporción Porcentual
      {esIndividual && <span className="text-xs font-normal text-[var(--muted-foreground)]">— {empleado?.nombre}</span>}
    </h3>
    {pieData.length > 0 ? (
      <ResponsiveContainer width="100%" height={360}>
      <PieChart margin={{ top: 10, right: 24, bottom: 5, left: 20 }}>
    <Pie
      data={pieData}
      cx="50%"
      cy="45%"
      innerRadius={70}
      outerRadius={110}
      paddingAngle={3}
      dataKey="value"
      labelLine={{ stroke: "#9ca3af", strokeWidth: 1 }}
      label={({ name, percent }) => `${name.split(" - ")[0]} (${(percent * 100).toFixed(0)}%)`}
    >
      {pieData.map((entry, i) => (
        <Cell key={i} fill={entry.color} />
      ))}
    </Pie>
    <Tooltip contentStyle={tooltipStyle} />
    <Legend
      verticalAlign="bottom"
      align="center"
      layout="horizontal"
      iconType="square"
      wrapperStyle={{ fontSize: 11, paddingTop: 4, lineHeight: "16px" }}
    />
  </PieChart>
</ResponsiveContainer>
    ) : (
      <div className="flex items-center justify-center h-60 text-sm text-[var(--muted-foreground)]">
        Sin respuestas aún
      </div>
    )}
  </div>
        {/* Radar por valor */}
        {radarData.length >= 3 && (
          <div className="p-4 rounded-lg bg-[var(--card)] border border-[var(--border)] shadow-sm">
            <h3 className="flex items-center gap-2 text-sm mb-4 text-[var(--foreground)]">
              Radar por Valor
              {esIndividual && <span className="text-xs font-normal text-[var(--muted-foreground)]">— {empleado?.nombre}</span>}
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(0,0,0,0.08)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#6b7280", fontSize: 10 }} />
                <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fill: "#9ca3af", fontSize: 10 }} />
                <Radar
                  name="Promedio"
                  dataKey="score"
                  stroke="var(--primary, #2563eb)"
                  fill="var(--primary, #2563eb)"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Tooltip contentStyle={tooltipStyle} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      {/* ━━━━━━━━━━━━━━ PROMEDIO POR VALOR (Barras) ━━━━━━━━━━━━━━ */}
      <div className="p-4 rounded-lg bg-[var(--card)] border border-[var(--border)] shadow-sm">
        <h3 className="flex items-center gap-2 text-sm mb-4 text-[var(--foreground)]">
          <Award size={15} className="text-[var(--primary)]" />
          Promedio por valor
          {esIndividual && <span className="text-xs font-normal text-[var(--muted-foreground)] ml-2">— {empleado?.nombre}</span>}
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={valoresData} barSize={36} margin={{ bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: "#6b7280", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              angle={-15}
              textAnchor="end"
              height={60}
            />
            <YAxis
              domain={[0, 5]}
              ticks={[1, 2, 3, 4, 5]}
              tick={{ fill: "#6b7280", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={{ color: "#1f2937", fontWeight: 500 }}
              cursor={{ fill: "rgba(37,99,235,0.06)" }}
              labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName ?? label}
              formatter={(value) => [`${value} / 5`, "Promedio"]}
            />
            <Bar dataKey="Promedio" radius={[4, 4, 0, 0]}>
              {valoresData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        {/* Tarjetitas de % por valor */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {valoresData.map((v) => {
            const badgeClass = getBadgeForScore(v.pct);
            return (
              <div key={v.fullName} className="flex items-center gap-2 p-2 rounded-lg border border-[var(--border)]">
                <span className="w-2 h-8 rounded-sm shrink-0" style={{ backgroundColor: v.color }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-[var(--foreground)] truncate" title={v.fullName}>
                    {v.fullName}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded border ${badgeClass}`}>
                      {v.pct}%
                    </span>
                    <span className="text-[10px] text-[var(--muted-foreground)]">
                      Prom: {v.Promedio}/5
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* ━━━━━━━━━━━━━━ DETALLE POR PREGUNTA ━━━━━━━━━━━━━━ */}
      <div className="p-4 rounded-lg bg-[var(--card)] border border-[var(--border)] shadow-sm">
        <h3 className="flex items-center gap-2 text-sm mb-4 text-[var(--foreground)]">
          <HelpCircle size={15} className="text-[var(--primary)]" />
          Detalle por pregunta
          {esIndividual && <span className="text-xs font-normal text-[var(--muted-foreground)] ml-2">— {empleado?.nombre}</span>}
        </h3>
        <div className="overflow-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[var(--secondary)]">
                <th className="text-left px-3 py-2 text-xs text-[var(--muted-foreground)] font-medium border-b border-[var(--border)]">#</th>
                <th className="text-left px-3 py-2 text-xs text-[var(--muted-foreground)] font-medium border-b border-[var(--border)]">Pregunta</th>
                <th className="text-left px-3 py-2 text-xs text-[var(--muted-foreground)] font-medium border-b border-[var(--border)]">Valor</th>
                <th className="text-center px-3 py-2 text-xs text-[var(--muted-foreground)] font-medium border-b border-[var(--border)]">Promedio</th>
                <th className="text-center px-3 py-2 text-xs text-[var(--muted-foreground)] font-medium border-b border-[var(--border)]">%</th>
                <th className="text-center px-3 py-2 text-xs text-[var(--muted-foreground)] font-medium border-b border-[var(--border)]">Resp.</th>
                <th className="text-center px-3 py-2 text-xs text-[var(--muted-foreground)] font-medium border-b border-[var(--border)]">Barra</th>
              </tr>
            </thead>
            <tbody>
              {preguntasData.map((p) => (
                <tr key={p.id} className="hover:bg-[var(--secondary)]/40">
                  <td className="px-3 py-2 border-b border-[var(--border)]">
                    <span className="font-mono font-semibold text-xs" style={{ color: p.valor_color }}>
                      {p.label}
                    </span>
                  </td>
                  <td className="px-3 py-2 border-b border-[var(--border)] max-w-xs">
                    <span className="text-xs leading-snug line-clamp-2">{p.texto}</span>
                  </td>
                  <td className="px-3 py-2 border-b border-[var(--border)]">
                    <span
                      className="inline-block px-2 py-0.5 rounded-full text-[10px] text-white"
                      style={{ backgroundColor: p.valor_color }}
                    >
                      {p.valor_nombre}
                    </span>
                  </td>
                  <td className="px-3 py-2 border-b border-[var(--border)] text-center">
                    <span className={`font-semibold ${getColorForScore(p.promedio)}`}>
                      {p.promedio.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-3 py-2 border-b border-[var(--border)] text-center">
                    <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded border ${getBadgeForScore(p.pct)}`}>
                      {p.pct}%
                    </span>
                  </td>
                  <td className="px-3 py-2 border-b border-[var(--border)] text-center text-xs text-[var(--muted-foreground)]">
                    {p.respondidas}
                    {p.pendientes > 0 && <span className="opacity-60">/{p.respondidas + p.pendientes}</span>}
                  </td>
                  <td className="px-3 py-2 border-b border-[var(--border)] min-w-[120px]">
                    <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${p.pct}%`,
                          backgroundColor: p.valor_color,
                          minWidth: p.pct > 0 ? "8px" : "0",
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
