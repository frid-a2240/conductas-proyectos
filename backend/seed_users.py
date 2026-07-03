from database import get_cursor
from security import hash_password

DEFAULT_PASSWORD = "isp2026"

USERS = [
    # numero    nombre                 rol
    ("203715", "Roger Aguilar",       "supervisor"),
    ("204401", "Victor Rivera",       "supervisor"),
    ("204827", "Estefania Mendoza",   "supervisor"),
    ("202001", "Cristina Clemente",   "admin"),
   
]

def main():
    pwd_hash = hash_password(DEFAULT_PASSWORD)
    print(f"Hash generado para '{DEFAULT_PASSWORD}'\n")

    with get_cursor() as cur:
        for numero, nombre, rol in USERS:
            nombre_norm = nombre.strip().title()

            # 1) Login (auth_users) — sí tiene UNIQUE en numero_empleado
            cur.execute("""
                INSERT INTO auth_users (numero_empleado, nombre, password_hash, rol)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (numero_empleado) DO UPDATE
                    SET nombre = EXCLUDED.nombre,
                        rol    = EXCLUDED.rol
            """, (numero, nombre_norm, pwd_hash, rol))

            # Sofía (204862) es admin de PRUEBAS — no se evalúa a sí misma
            if numero == "204862":
                print(f"  ✓ {numero} {nombre_norm} ({rol}) — solo login")
                continue

            # 2) Evaluado en la matriz (usuarios) — insertar solo si no existe
            cur.execute("""
                INSERT INTO usuarios (nombre, activo)
                SELECT %s, TRUE
                WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE nombre = %s)
            """, (nombre_norm, nombre_norm))

            # Asegurar que quede activo aunque ya existiera
            cur.execute("""
                UPDATE usuarios SET activo = TRUE WHERE nombre = %s
            """, (nombre_norm,))

            print(f"  ✓ {numero} {nombre_norm} ({rol})")

    print(f"\nListo. Todos pueden entrar con contraseña: {DEFAULT_PASSWORD}")
    print("Se les pedirá cambiarla al iniciar sesión.")

if __name__ == "__main__":
    main()