"""Backend-only ingestion: snapshots and official opportunity discovery, not silent rule rewriting."""
import hashlib
import json
import os
import time
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse
import httpx
from .storage import connect, BASE
from .bootstrap import seed, setup

GRANTS_ENDPOINT="https://api.grants.gov/v1/api/search2"
KEYWORDS=("flood mitigation","water infrastructure","community facilities","rural broadband")
# This is an explicit, local allowlist, not a user-supplied URL proxy.
APPROVED_HOSTS={
    "www.grants.gov","grants.gov","simpler.grants.gov","sam.gov","www.sam.gov",
    "www.hudexchange.info","www.poseycountyin.gov","gibsoncounty-in.gov",
    "evansville.granicus.com","warrickcountymeetings.vivabove.com",
}
MAX_BYTES=8*1024*1024
AGENT="TriStateGrantMatrix/1.0 (public funding source monitor; contact repository owner)"

def safe_url(url):
    parsed=urlparse(url)
    if parsed.scheme!="https" or not parsed.hostname or parsed.username or parsed.password:
        return False
    host=parsed.hostname.lower().rstrip(".")
    return (host.endswith(".gov") or host.endswith(".mil") or host in APPROVED_HOSTS)

def status_for(code):
    if code in (200,206): return "REACHABLE"
    if code in (301,302,303,307,308): return "REDIRECT"
    if code in (401,403,429): return "BLOCKED"
    if code in (404,410): return "MISSING"
    return "UNAVAILABLE"

def parse_date(text):
    if not text:return None
    for fmt in ("%m/%d/%Y","%Y-%m-%d"):
        try:return datetime.strptime(text.strip(),fmt).date()
        except (ValueError,AttributeError):pass
    return None

def start_run(db,origin):
    return db.execute("INSERT INTO sync_runs(origin) VALUES(%s) RETURNING id",(origin,)).fetchone()["id"]

def finish_run(db,run_id,scanned,accepted,errors):
    db.execute("""UPDATE sync_runs SET completed_at=now(),status=%s,scanned=%s,accepted=%s,errors=%s
                WHERE id=%s""",("SUCCESS" if not errors else ("PARTIAL" if accepted else "FAILED"),
                                scanned,accepted,errors,run_id))

def monitor_sources(client,db,run_id):
    catalog=json.loads((BASE/"site/data/catalog.json").read_text(encoding="utf8"))
    archive=json.loads((BASE/"site/data/public-record-sources.json").read_text(encoding="utf8"))
    urls={u for p in catalog["programs"] for u in (p["official"],p["documents"],p.get("deadline_source"))
          if isinstance(u,str) and u.startswith("https://")}
    urls.update(r["url"] for r in catalog["resources"])
    urls.update(s["url"] for c in archive["counties"] for s in c.get("sources",[]))
    scanned=accepted=errors=0
    for url in sorted(urls):
        scanned+=1
        status=None; digest=None; body_type=None; etag=None; modified=None; changed=False; error=None
        if not safe_url(url):
            status="UNAVAILABLE"; error="Host not in approved source allowlist"; errors+=1
        else:
            try:
                with client.stream("GET",url,follow_redirects=False) as r:
                    status=status_for(r.status_code)
                    body_type=r.headers.get("content-type","")[:120]
                    etag=r.headers.get("etag","")[:240]
                    modified=r.headers.get("last-modified","")[:120]
                    if status=="REACHABLE":
                        sha=hashlib.sha256();total=0
                        for chunk in r.iter_bytes():
                            total+=len(chunk)
                            if total>MAX_BYTES:
                                status="PARTIAL"
                                break
                            sha.update(chunk)
                        if status=="REACHABLE":
                            digest=sha.hexdigest()
                            prev=db.execute("""SELECT content_sha256 FROM source_checks
                                WHERE url=%s AND content_sha256 IS NOT NULL
                                ORDER BY id DESC LIMIT 1""",(url,)).fetchone()
                            changed=bool(prev and prev["content_sha256"]!=digest)
                            if changed:status="CHANGED"
                            accepted+=1
                    else:
                        errors+=1
            except (httpx.HTTPError,ValueError) as e:
                status="UNAVAILABLE";error=type(e).__name__+": "+str(e)[:220];errors+=1
        db.execute("""INSERT INTO source_checks(run_id,url,http_status,state,content_sha256,
                   content_type,etag,last_modified,changed,error)
                   VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                   (run_id,url,r.status_code if 'r' in locals() and status not in
                    ("UNAVAILABLE",) else None,status,digest,body_type,etag,modified,changed,error))
        db.commit()
    return scanned,accepted,errors

def sync_grants(client,db,run_id):
    scanned=accepted=errors=0
    for keyword in KEYWORDS:
        scanned+=1
        try:
            response=client.post(GRANTS_ENDPOINT,json={"rows":50,"keyword":keyword,
                                 "oppStatuses":"posted"},follow_redirects=False)
            response.raise_for_status()
            payload=response.json()
            if payload.get("errorcode")!=0 or not isinstance(payload.get("data",{}).get("oppHits"),list):
                raise ValueError("Unexpected Grants.gov search2 response")
            for h in payload["data"]["oppHits"]:
                identifier=str(h.get("id",""))
                if not identifier.isdigit() or not isinstance(h.get("title"),str):continue
                url="https://www.grants.gov/search-results-detail/"+identifier
                db.execute("""INSERT INTO opportunities
                   (id,opportunity_number,title,agency,status,posted_at,closes_at,
                    source_url,source_system,raw)
                   VALUES(%s,%s,%s,%s,%s,%s,%s,%s,'Grants.gov search2',%s::jsonb)
                   ON CONFLICT(id) DO UPDATE SET
                    opportunity_number=EXCLUDED.opportunity_number,title=EXCLUDED.title,
                    agency=EXCLUDED.agency,status=EXCLUDED.status,posted_at=EXCLUDED.posted_at,
                    closes_at=EXCLUDED.closes_at,raw=EXCLUDED.raw,last_seen_at=now()""",
                    ("grantsgov:"+identifier,h.get("number"),h["title"],h.get("agencyName"),
                     h.get("oppStatus"),parse_date(h.get("openDate")),
                     parse_date(h.get("closeDate")),url,json.dumps(h)))
                accepted+=1
            db.commit()
        except (httpx.HTTPError,ValueError,TypeError) as e:
            db.rollback()
            errors+=1
            print("Grants.gov keyword sync unavailable:",keyword,type(e).__name__,str(e)[:150])
    return scanned,accepted,errors

def once():
    setup()
    with connect() as db:
        seed(db)
    with httpx.Client(timeout=httpx.Timeout(18.0,connect=7.0),headers={"User-Agent":AGENT},
                      limits=httpx.Limits(max_connections=4)) as client:
        for origin,operation in (("Grants.gov search2",sync_grants),("Approved source monitor",monitor_sources)):
            with connect() as db:
                run=start_run(db,origin)
                db.commit()
                scanned=accepted=errors=0
                try:
                    scanned,accepted,errors=operation(client,db,run)
                except Exception as ex:
                    db.rollback()
                    errors+=1
                    print("Sync failed",origin,type(ex).__name__,str(ex)[:150])
                finish_run(db,run,scanned,accepted,errors)
                db.commit()
                print(origin,"scanned",scanned,"accepted",accepted,"errors",errors)

def main():
    period=max(3600,int(os.getenv("SYNC_INTERVAL_SECONDS","21600")))
    if "--once" in __import__("sys").argv:
        once();return
    while True:
        try:once()
        except Exception as ex:print("Worker failure",type(ex).__name__,str(ex)[:200])
        time.sleep(period)

if __name__=="__main__":
    main()
