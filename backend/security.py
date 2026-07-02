"""
Utilidades de autenticación: hash de contraseñas y JWT en cookie httpOnly.
"""
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
import bcrypt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, Request, Response
from jose import JWTError, jwt


load_dotenv(Path(__file__).parent / ".env")

JWT_SECRET       = os.getenv("JWT_SECRET")
JWT_ALGORITHM    = "HS256"
JWT_EXPIRE_HOURS = int(os.getenv("JWT_EXPIRE_HOURS", "8"))

if not JWT_SECRET or len(JWT_SECRET) < 32:
    raise RuntimeError("JWT_SECRET no configurado o muy corto (mínimo 32 chars). Revisa backend/.env")

# Nombre y configuración de la cookie
COOKIE_NAME      = "isp_cuestionario_session"
COOKIE_PATH      = "/cuestionario"
COOKIE_SAMESITE  = "lax"      # Lax + same-origin en producción es suficiente para red interna
COOKIE_SECURE    = False      # Producción es HTTP interno (gacenssv03). Cambiar a True si migran a HTTPS.
COOKIE_HTTPONLY  = True       # JS no puede leerla — protege contra XSS


# ───────────────────── Contraseñas ─────────────────────
# bcrypt tiene un límite de 72 bytes — recortamos por seguridad
def _to_bytes(password: str) -> bytes:
    return password.encode("utf-8")[:72]

def hash_password(plain: str) -> str:
    return bcrypt.hashpw(_to_bytes(plain), bcrypt.gensalt(rounds=12)).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(_to_bytes(plain), hashed.encode("utf-8"))
    except Exception:
        return False

def validate_password_strength(password: str) -> str | None:
    """Devuelve mensaje de error si la contraseña no cumple, o None si está bien."""
    if len(password) < 8:
        return "La contraseña debe tener al menos 8 caracteres."
    if password.lower() == "isp2026":
        return "No puedes reutilizar la contraseña genérica. Elige una nueva."
    if not any(c.isdigit() for c in password):
        return "La contraseña debe incluir al menos un número."
    if not any(c.isalpha() for c in password):
        return "La contraseña debe incluir al menos una letra."
    return None


# ───────────────────── JWT ─────────────────────
def create_access_token(numero_empleado: str, rol: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS)
    payload = {
        "sub": numero_empleado,
        "rol": rol,
        "exp": expire,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


# ───────────────────── Cookie helpers ─────────────────────
def set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        max_age=JWT_EXPIRE_HOURS * 3600,
        httponly=COOKIE_HTTPONLY,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        path=COOKIE_PATH,
    )

def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(
        key=COOKIE_NAME,
        path=COOKIE_PATH,
        samesite=COOKIE_SAMESITE,
    )


# ───────────────────── Dependencias FastAPI ─────────────────────
def _decode_token(token: str | None) -> dict:
    if not token:
        raise HTTPException(status_code=401, detail="No autenticado")
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Sesión inválida o expirada")

def require_user(request: Request) -> dict:
    """Cualquier usuario autenticado. Lee el token desde la cookie."""
    token = request.cookies.get(COOKIE_NAME)
    data = _decode_token(token)
    return {"numero_empleado": data["sub"], "rol": data["rol"]}

def require_admin(user: dict = Depends(require_user)) -> dict:
    if user["rol"] != "admin":
        raise HTTPException(status_code=403, detail="Se requiere rol de administrador")
    return user