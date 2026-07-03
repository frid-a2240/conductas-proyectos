"""
seed_valores_preguntas.py

Semilla inicial de valores y preguntas para el Sistema de Conductas
Proyectos ISP.

Uso:
    cd backend
    venv312\Scripts\activate     (Windows)
    python seed_valores_preguntas.py

Es idempotente: se puede correr varias veces sin duplicar registros.
- Los valores se insertan con ON CONFLICT (nombre) DO UPDATE.
- Las preguntas se buscan por texto exacto y se actualizan si ya existen.
"""
from database import get_cursor


# ═══════════════════ Valores ═══════════════════
# Este fork usa una sola categoría. Si más adelante se subdivide,
# basta con agregar más renglones aquí y reasignar valor_id en PREGUNTAS.
VALORES = [
    # (nombre, color hex, orden)
    ("Compromiso con las conductas deseadas", "#0891b2", 1),
]


# ═══════════════════ Preguntas ═══════════════════
# Todas van al primer valor (índice 0 de VALORES).
# El orden de esta lista define el número P1, P2, ... que aparece en la Matriz.
PREGUNTAS = [
    "Atiende las solicitudes del cliente en tiempo y forma, dando seguimiento puntual hasta su cierre.",
    "Cuida la calidad y presentación de los entregables antes de enviarlos al cliente.",
    "Cumple con los reportes y compromisos en las fechas establecidas.",
    "Busca constantemente mejorar la calidad de sus entregables y resultados del proyecto.",
    "Promueve la eficiencia en sus actividades mediante una mejor planeación y organización del trabajo.",
    "Comprende y aplica las normas de seguridad, priorizando siempre la integridad de las personas.",
    "Mantiene ordenados y limpios sus espacios de trabajo y las áreas comunes.",
    "Propone mejoras e iniciativas que generen valor para la empresa, los clientes y la sociedad.",
    "Actúa con honestidad, responsabilidad y transparencia en todas sus actividades.",
    "Comparte información, herramientas y apoyo con sus compañeros para facilitar el trabajo en equipo.",
    "Mantiene seriedad y profesionalismo en temas importantes de la organización.",
    "Trata a sus compañeros con respeto en todo momento, independientemente de la confianza personal.",
    "Conserva una conducta profesional, evitando rumores, chismes o comentarios inapropiados dentro del trabajo.",
    "Se comunica de manera directa y respetuosa, evitando hablar negativamente de sus compañeros a sus espaldas.",
    "Se percibe una persona que no comparte que una tarea no pueda hacerla un hombre o una mujer.",
    "Se percibe que no es una persona hostigosa.",
    "Respeta la privacidad y vida personal de sus compañeros, manteniendo límites profesionales adecuados.",
]


def main():
    with get_cursor() as cur:
        # ───── 1) Valores ─────
        print("Insertando valores…")
        valor_id_principal = None
        for nombre, color, orden in VALORES:
            cur.execute("""
                INSERT INTO valores (nombre, color, orden)
                VALUES (%s, %s, %s)
                ON CONFLICT (nombre) DO UPDATE
                    SET color = EXCLUDED.color,
                        orden = EXCLUDED.orden
                RETURNING id
            """, (nombre, color, orden))
            vid = cur.fetchone()["id"]
            if valor_id_principal is None:
                valor_id_principal = vid
            print(f"  ✓ {nombre} (id={vid}, color={color})")

        # ───── 2) Preguntas ─────
        print(f"\nInsertando {len(PREGUNTAS)} preguntas…")
        for orden, texto in enumerate(PREGUNTAS, start=1):
            cur.execute("SELECT id FROM preguntas WHERE texto = %s", (texto,))
            existente = cur.fetchone()

            if existente:
                cur.execute("""
                    UPDATE preguntas
                       SET valor_id = %s,
                           orden    = %s,
                           activa   = TRUE
                     WHERE id = %s
                """, (valor_id_principal, orden, existente["id"]))
                marca = "↻"
            else:
                cur.execute("""
                    INSERT INTO preguntas (texto, valor_id, orden, activa)
                    VALUES (%s, %s, %s, TRUE)
                """, (texto, valor_id_principal, orden))
                marca = "✓"

            resumen = texto if len(texto) <= 70 else texto[:67] + "…"
            print(f"  {marca} P{orden:>2}: {resumen}")

    print(f"\nListo. {len(PREGUNTAS)} preguntas activas bajo el valor principal.")


if __name__ == "__main__":
    main()