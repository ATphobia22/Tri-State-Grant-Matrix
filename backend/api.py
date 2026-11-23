"""Public, read-only FastAPI and strictly authenticated evidence-staging endpoints."""
import hashlib
import hmac
import json
import os
from datetime import date, datetime, timezone
from fastapi import FastAPI, HTTPException, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, HttpUrl
from .storage import connect

app = FastAPI(title="Tri-State Grant Matrix API", version="1.0.0",
    description="Read-only public grant discovery, provenance and nine-county coverage. Discoveries are not eligibility determinations.")
ORIGINS = [v.strip().rstrip("/") for v in os.getenv("PUBLIC_ORIGINS","https://atphobia22.github.io").split(",") if v.strip()]
app.add_middleware(CORSMiddleware, allow_origins=ORIGINS, allow_methods=["GET"], allow_headers=["Content-Type"])

def require_admin(token):
    expected = os.getenv("SYNC_ADMIN_TOKEN", "")
    if not expected or not token or not hmac.compare_digest(expected, token):
        raise HTTPException(status_code=403, detail="Administrative authorization required")

def typed_date(v):
    if isinstance(v, (date,datetime)):
        return v.isoformat()
    return v

@app.get("/healthz")
def health():
    return {"status":"alive","service":"tristate-grant-matrix"}

@app.get("/readyz")
def ready():
    try:
        with connect() as db:
            n=db.execute("SELECT count(*) AS n FROM counties").fetchone()["n"]
            p=db.execute("SELECT count(*) AS n FROM programs").fetchone()["n"]
        if n!=9 or p<100:
            raise HTTPException(503, detail="Nine-county catalog is not seeded")
        return {"status":"ready","counties":n,"programs":p}
    except HTTPException: raise
    except Exception:
        raise HTTPException(503, detail="Database unavailable")

@app.get("/v1/counties")
def counties():
    with connect() as db:
        return {"counties":list(db.execute("SELECT fips,name,state,communities FROM counties ORDER BY fips").fetchall()),
                "eligibility_verified":False}

@app.get("/v1/catalog")
def catalog():
    """Legacy-compatible catalog with each public program's curated source record."""
    with connect() as db:
        programs=[r["record"] for r in db.execute("SELECT record FROM programs ORDER BY id").fetchall()]
        counties=list(db.execute("SELECT fips,name,state,communities FROM counties ORDER BY fips").fetchall())
    # Public resource directory remains the source-controlled approved list.
    from pathlib import Path
    from .storage import BASE
    original=json.loads((BASE/"site/data/catalog.json").read_text(encoding="utf-8"))
    return {"schema":original["schema"],"as_of":original["as_of"],
            "counties":counties,"programs":programs,"resources":original["resources"],
            "readme":original.get("readme",""),
            "metadata":{"backend":"postgresql","retrieved_at":datetime.now(timezone.utc).isoformat(),
                        "eligibility_verified":False}}

@app.get("/v1/programs")
def programs(q: str = Query("", max_length=140), county: str = Query("", pattern=r"^$|^[0-9]{5}$"),
             sector: str = Query("",max_length=100), scope: str = Query("",pattern=r"^$|^(FED|IN|IL|KY)$"),
             limit: int = Query(30,ge=1,le=100), offset: int = Query(0,ge=0,le=5000)):
    q=q.strip()
    with connect() as db:
        if county and not db.execute("SELECT 1 FROM counties WHERE fips=%s",(county,)).fetchone():
            raise HTTPException(404,"County not in nine-county coverage")
        sql="""FROM programs p WHERE
             (%s='' OR p.scope=%s)
             AND (%s='' OR p.sector=%s)
             AND (%s='' OR p.scope='FED' OR EXISTS (
                SELECT 1 FROM counties c WHERE c.fips=%s AND c.state=p.scope))
             AND (%s='' OR to_tsvector('english',coalesce(p.name,'')||' '||
                  coalesce(p.sector,'')||' '||coalesce(p.status,'')) @@ plainto_tsquery('english',%s))"""
        params=(scope,scope,sector,sector,county,county,q,q)
        count=db.execute("SELECT count(*) AS n "+sql,params).fetchone()["n"]
        rows=db.execute("SELECT p.record "+sql+" ORDER BY p.name LIMIT %s OFFSET %s",
                        (*params,limit,offset)).fetchall()
    return {"total":count,"items":[r["record"] for r in rows],
            "county_filter_is_eligibility_decision":False}

@app.get("/v1/programs/{program_id}")
def program_detail(program_id: str):
    with connect() as db:
        p=db.execute("SELECT record,curator_locked,updated_at FROM programs WHERE id=%s",(program_id,)).fetchone()
        if not p: raise HTTPException(404,"Program not found")
        checks=list(db.execute("""SELECT url,checked_at,http_status,state,content_sha256
            FROM source_checks WHERE url=%s OR url=%s
            ORDER BY checked_at DESC LIMIT 12""",(p["record"]["official"],p["record"]["documents"])).fetchall())
    return {"program":p["record"],"last_imported_at":p["updated_at"],
            "source_checks":checks,"eligible":None}

@app.get("/v1/records")
def county_records(fips: str = Query("", pattern=r"^$|^[0-9]{5}$")):
    with connect() as db:
        rows=db.execute("""SELECT s.county_fips,s.source_id,s.title,s.source_url,s.authority,s.record
            FROM county_sources s
            WHERE (%s='' OR s.county_fips=%s) ORDER BY s.county_fips,s.source_id""",
            (fips,fips)).fetchall()
    return {"records":list(rows),"nine_counties_only":True}

@app.get("/v1/opportunities")
def opportunities(q: str=Query("",max_length=120),limit:int=Query(40,ge=1,le=100),
                  offset:int=Query(0,ge=0,le=10000)):
    with connect() as db:
        rows=db.execute("""SELECT id,opportunity_number,title,agency,status,posted_at,closes_at,
                   source_url,source_system,discovered_at,last_seen_at,review_state
                   FROM opportunities WHERE (%s='' OR to_tsvector('english',
                   coalesce(title,'')||' '||coalesce(agency,'')) @@ plainto_tsquery('english',%s))
                   ORDER BY closes_at NULLS LAST,title LIMIT %s OFFSET %s""",
                   (q,q,limit,offset)).fetchall()
    return {"items":list(rows),"source":"Official Grants.gov search2; cached at sync time",
            "review_notice":"Discovered opportunities require agency eligibility review"}

@app.get("/v1/discover")
def discover(limit:int=Query(100,ge=1,le=200)):
    with connect() as db:
        rows=db.execute("""SELECT id,title,opportunity_number,agency,status,closes_at,
                             source_url,last_seen_at FROM opportunities
                             ORDER BY last_seen_at DESC,id LIMIT %s""",(limit,)).fetchall()
    return {"items":list(rows),"source":"api.grants.gov/v1/api/search2","cache_only":True,
            "eligibility_verified":False}

@app.get("/v1/audits/latest")
def audit_latest(limit:int=Query(100,ge=1,le=250)):
    with connect() as db:
        runs=db.execute("SELECT * FROM sync_runs ORDER BY id DESC LIMIT 1").fetchone()
        checks=db.execute("""SELECT id,run_id,url,checked_at,http_status,state,changed,
                    content_sha256,error FROM source_checks ORDER BY checked_at DESC LIMIT %s""",
                    (limit,)).fetchall()
    return {"last_run":dict(runs) if runs else None,"checks":list(checks),
            "notice":"HTTP status and checksums do not prove grant eligibility or deadline accuracy"}

class ProposedClaim(BaseModel):
    field_name: str = Field(min_length=1,max_length=100)
    extracted_value: str | int | float | None
    verbatim_quote: str = Field(min_length=1,max_length=1600)
    page_locator: str = Field(min_length=1,max_length=100)

class EvidenceBatch(BaseModel):
    program_id: str | None = None
    source_url: HttpUrl
    source_text: str = Field(min_length=1,max_length=600000)
    model_name: str = Field(min_length=1,max_length=120)
    claims: list[ProposedClaim] = Field(min_length=1,max_length=100)

@app.post("/v1/admin/evidence",include_in_schema=True)
def submit_evidence(payload: EvidenceBatch, x_admin_token: str | None = Header(default=None)):
    """Do not confuse verbatim match with a fact-check or professional eligibility review."""
    require_admin(x_admin_token)
    from .extraction import verify_quote
    digest=hashlib.sha256(payload.source_text.encode()).hexdigest()
    results=[]
    with connect() as db:
        if payload.program_id and not db.execute("SELECT 1 FROM programs WHERE id=%s",
                                                    (payload.program_id,)).fetchone():
            raise HTTPException(404,"Unknown program_id")
        for c in payload.claims:
            quote_found,locator_found=verify_quote(payload.source_text,c.verbatim_quote,c.page_locator)
            state="EVIDENCE_MATCHED" if quote_found and locator_found else "UNVERIFIED"
            row=db.execute("""INSERT INTO evidence_claims
                 (program_id,source_url,source_sha256,field_name,extracted_value,
                  verbatim_quote,page_locator,quote_found,locator_found,review_state,model_name)
                  VALUES(%s,%s,%s,%s,%s::jsonb,%s,%s,%s,%s,%s,%s) RETURNING id""",
                  (payload.program_id,str(payload.source_url),digest,c.field_name,
                   json.dumps(c.extracted_value),c.verbatim_quote,c.page_locator,
                   quote_found,locator_found,state,payload.model_name)).fetchone()
            results.append({"id":row["id"],"field":c.field_name,"quote_found":quote_found,
                            "locator_found":locator_found,"review_state":state})
    return {"source_sha256":digest,"results":results,"notice":"No claim was human approved"}

@app.get("/v1/evidence/{program_id}")
def evidence(program_id:str):
    with connect() as db:
        rows=db.execute("""SELECT field_name,extracted_value,verbatim_quote,page_locator,
           quote_found,locator_found,review_state,source_url,source_sha256,model_name,created_at
           FROM evidence_claims WHERE program_id=%s ORDER BY created_at DESC LIMIT 100""",
           (program_id,)).fetchall()
    return {"items":list(rows),"notice":"Exact quote matching is not an eligibility determination"}
