"""
Resetea la contraseña de Cristina al default isp2026.
Al entrar, el sistema le pedirá cambiarla.
Uso: python reset_cristina.py
"""
from datetime import datetime
from database import get_cursor
from security import hash_password

NUMERO_EMPLEADO = "202001"
PASSWORD_DEFAULT = "isp2026"

with get_cursor() as cur:
    cur.execute("""
        UPDATE auth_users
        SET password_hash = %s,
            must_change_password = TRUE,
            password_changed_at = %s
        WHERE numero_empleado = %s
        RETURNING nombre
    """, (hash_password(PASSWORD_DEFAULT), datetime.utcnow(), NUMERO_EMPLEADO))
    row = cur.fetchone()

if row:
    print(f"✅ Contraseña de {row['nombre']} reseteada a '{PASSWORD_DEFAULT}'")
    print(f"   Al entrar se le pedirá cambiarla.")
else:
    print(f"❌ No se encontró al usuario {NUMERO_EMPLEADO}")