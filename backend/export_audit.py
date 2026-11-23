"""Optional export of public audit receipts and opportunity metadata as JSONL or Parquet."""
import argparse
import json
from datetime import date, datetime
from pathlib import Path
from .storage import connect

def normalize(v):
    if isinstance(v, (datetime, date)):
        return v.isoformat()
    if isinstance(v, dict):
        return {k: normalize(x) for k, x in v.items()}
    if isinstance(v, list):
        return [normalize(x) for x in v]
    return v

def fetch_export_rows(db, table, limit):
    if table == "checks":
        query = """SELECT url,checked_at,http_status,state,content_sha256,content_type,changed
                   FROM source_checks ORDER BY id DESC LIMIT %s"""
    elif table == "opportunities":
        query = """SELECT id,opportunity_number,title,agency,status,posted_at,closes_at,
                          source_url,source_system,discovered_at,last_seen_at,review_state
                   FROM opportunities ORDER BY id LIMIT %s"""
    else:
        raise ValueError("Only public government metadata may be exported")
    return [normalize(dict(r)) for r in db.execute(query, (limit,)).fetchall()]

def export_jsonl(table, output, limit=100000):
    if table not in {"checks", "opportunities"} or not 1 <= limit <= 100000:
        raise ValueError("Invalid public export request")
    with connect() as db:
        rows = fetch_export_rows(db, table, limit)
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("w", encoding="utf-8") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False, sort_keys=True) + "\n")
    return len(rows)

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--table", choices=["checks", "opportunities"], required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--limit", type=int, default=100000)
    p.add_argument("--parquet", action="store_true")
    args = p.parse_args()
    dest = Path(args.out)
    total = export_jsonl(args.table, dest, args.limit)
    print(json.dumps({"rows": total, "path": str(dest), "source": "public government metadata"}))
    if args.parquet and total:
        from datasets import load_dataset
        data = load_dataset("json", data_files=str(dest), split="train")
        data.to_parquet(str(dest.with_suffix(".parquet")))

if __name__ == "__main__":
    main()
