"""Idempotent, deterministic import of the nine-county verified-source catalog."""
import hashlib
import json
from pathlib import Path
from .storage import BASE, connect, setup

EXPECTED_FIPS = {"18129","18163","18051","18173","17193","17185","17059","21101","21225"}

def seed(db):
    catalog = json.loads((BASE / "site/data/catalog.json").read_text(encoding="utf-8"))
    records = json.loads((BASE / "site/data/public-record-sources.json").read_text(encoding="utf-8"))
    counties = catalog["counties"]
    if {c["fips"] for c in counties} != EXPECTED_FIPS:
        raise ValueError("Seed must contain the exact nine approved FIPS codes")
    if {c["fips"] for c in records["counties"]} != EXPECTED_FIPS:
        raise ValueError("Archive source registry FIPS mismatch")
    for c in counties:
        db.execute("""INSERT INTO counties(fips,name,state,communities)
            VALUES(%s,%s,%s,%s) ON CONFLICT(fips) DO UPDATE SET
            name=EXCLUDED.name,state=EXCLUDED.state,communities=EXCLUDED.communities""",
            (c["fips"],c["name"],c["state"],c.get("communities","")))
    for p in catalog["programs"]:
        encoded = json.dumps(p, sort_keys=True, separators=(",",":"),ensure_ascii=False)
        digest = hashlib.sha256(encoded.encode()).hexdigest()
        db.execute("""INSERT INTO programs
           (id,name,scope,sector,status,funding_type,deadline,source_url,documents_url,record,import_sha256)
           VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s::jsonb,%s)
           ON CONFLICT(id) DO UPDATE SET
             name=EXCLUDED.name,scope=EXCLUDED.scope,sector=EXCLUDED.sector,status=EXCLUDED.status,
             funding_type=EXCLUDED.funding_type,deadline=EXCLUDED.deadline,
             source_url=EXCLUDED.source_url,documents_url=EXCLUDED.documents_url,
             record=EXCLUDED.record,import_sha256=EXCLUDED.import_sha256,updated_at=now()
           WHERE programs.curator_locked=false
             AND programs.import_sha256 IS DISTINCT FROM EXCLUDED.import_sha256""",
           (p["id"],p["name"],p["scope"],p["sector"],p["status"],p["funding_type"],
            p.get("deadline") or None,p["official"],p["documents"],encoded,digest))
    for c in records["counties"]:
        for s in c.get("sources", []):
            db.execute("""INSERT INTO county_sources(source_id,county_fips,title,source_url,authority,record)
              VALUES(%s,%s,%s,%s,%s,%s::jsonb)
              ON CONFLICT(source_id) DO UPDATE SET
               county_fips=EXCLUDED.county_fips,title=EXCLUDED.title,
               source_url=EXCLUDED.source_url,authority=EXCLUDED.authority,record=EXCLUDED.record""",
                (s["id"],c["fips"],s["title"],s["url"],s["authority"],json.dumps(s)))
    return len(counties),len(catalog["programs"])

def main():
    setup()
    with connect() as db:
        counts=seed(db)
    print(f"Seed complete: {counts[0]} counties, {counts[1]} programs; no eligibility assertions")

if __name__=="__main__":
    main()
