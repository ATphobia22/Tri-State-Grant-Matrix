"""Database utilities; no client or model ever supplies SQL fragments."""
import os
from pathlib import Path
import psycopg
from psycopg.rows import dict_row

BASE = Path(__file__).resolve().parent.parent

def connect():
    dsn = os.getenv("DATABASE_URL")
    if dsn:
        return psycopg.connect(dsn, row_factory=dict_row, connect_timeout=10)
    return psycopg.connect(
        host=os.getenv("PGHOST", "localhost"),
        port=int(os.getenv("PGPORT", "5432")),
        user=os.getenv("PGUSER", "grantmatrix"),
        password=os.environ.get("PGPASSWORD", ""),
        dbname=os.getenv("PGDATABASE", "grantmatrix"),
        row_factory=dict_row,
        connect_timeout=10,
    )

def setup():
    with connect() as db:
        db.execute((BASE / "backend" / "schema.sql").read_text(encoding="utf-8"))

def jsonify(rows):
    return [dict(r) for r in rows]
