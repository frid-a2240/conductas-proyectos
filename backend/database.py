import os
from contextlib import contextmanager
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2 import pool

load_dotenv()

_pool = pool.SimpleConnectionPool(
    1, 10,
    host=os.getenv("DB_HOST", "localhost"),
    port=os.getenv("DB_PORT", 5432),
    dbname=os.getenv("DB_NAME", "cuestionario"),
    user=os.getenv("DB_USER", "postgres"),
    password=os.getenv("DB_PASSWORD", ""),
)

@contextmanager
def get_conn():
    conn = _pool.getconn()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        _pool.putconn(conn)

@contextmanager
def get_cursor():
    with get_conn() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            yield cur