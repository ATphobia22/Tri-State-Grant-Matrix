#!/usr/bin/env python3
"""Agency URL checks and content changes only; NEVER update eligibility or deadlines."""
import concurrent.futures, hashlib, json, re, urllib.request, urllib.error, urllib.parse
from pathlib import Path
from datetime import datetime,timezone
root=Path(__file__).resolve().parents[1]
data=root/"site/data"
def allowed(url):
    try:
        x=urllib.parse.urlsplit(url);h=(x.hostname or "").lower()
        return x.scheme=="https" and not x.username and not x.password and not x.port and (h.endswith((".gov",".us",".org",".mil")) or h in ("indianareadi.com","www.indianareadi.com"))
    except (ValueError,TypeError): return False
class SafeRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,req,fp,code,msg,headers,newurl):
        if not allowed(newurl):raise urllib.error.HTTPError(newurl,460,"Untrusted redirect",headers,fp)
        return super().redirect_request(req,fp,code,msg,headers,newurl)
opener=urllib.request.build_opener(SafeRedirect())
def check(pair):
    url,when=pair
    row={"status":"UNKNOWN","http_status":None,"final_url":url,"checked_at":when,"fingerprint":None}
    if not allowed(url):
        row["status"]="UNTRUSTED";return url,row
    try:
        request=urllib.request.Request(url,headers={"User-Agent":"TriStateGrantMatrix/1.0 public evidence monitor","Accept":"text/html,application/json,application/pdf,*/*"})
        with opener.open(request,timeout=14) as res:
            row["http_status"]=res.status;row["final_url"]=res.geturl()
            content=res.read(250000)
            ctype=res.headers.get("Content-Type","").lower()
            if "text/" in ctype or "json" in ctype or "xml" in ctype:
                cleaned=re.sub(r"(?is)<(script|style|noscript)\b[^>]*>.*?</\1>"," ",content.decode("utf-8","replace"))
                cleaned=" ".join(cleaned.split())
                row["fingerprint"]=hashlib.sha256(cleaned.encode()).hexdigest()
            row["status"]="REACHABLE" if 200<=res.status<400 else "HTTP_ERROR"
    except urllib.error.HTTPError as e:
        row["http_status"]=e.code
        row["status"]="MISSING" if e.code in (404,410) else ("BLOCKED" if e.code in (401,403,429,460) else "HTTP_ERROR")
    except Exception as e:row["status"]="UNAVAILABLE";row["error_type"]=type(e).__name__
    return url,row
def run():
    catalog=json.loads((data/"catalog.json").read_text())
    assert len(catalog["counties"])==9
    urls=sorted({url for p in catalog["programs"] for url in (p["official"],p["documents"])}|{r["url"] for r in catalog["resources"]})
    path=data/"audit.json"; old=json.loads(path.read_text()) if path.exists() else {}
    stamp=datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        links=dict(pool.map(check,((u,stamp) for u in urls)))
    changes=[]
    for u,new in links.items():
        prior=old.get("links",{}).get(u,{})
        former=prior.get("fingerprint") or prior.get("last_known_fingerprint")
        if former and new.get("fingerprint") and former!=new["fingerprint"]:
            changes.append({"type":"CONTENT_CHANGED_REVIEW_REQUIRED","url":u,"note":"Source text changed. No grant fields auto-modified."})
        elif new["status"] in ("UNTRUSTED","MISSING"):
            changes.append({"type":"LINK_PROBLEM","url":u,"note":new["status"]+"; verify manually"})
        elif prior.get("status")=="REACHABLE" and new["status"]!="REACHABLE":
            changes.append({"type":"REACHABILITY_CHANGED","url":u,"note":new["status"]+" (may be anti-bot blocking)"})
        if not new.get("fingerprint") and former:new["last_known_fingerprint"]=former
    snapshot={"schema":"tristate.grants.link-audit.v1","last_run":stamp,"links":links,"changes":changes,
              "note":"HTTP and page-fingerprint monitoring only. No claim of grant eligibility or currently open funding."}
    path.write_text(json.dumps(snapshot,indent=2,sort_keys=True)+"\n")
    from collections import Counter
    print(json.dumps({"urls":len(urls),"outcomes":dict(Counter(x["status"] for x in links.values())),"review_flags":len(changes)}))
if __name__=="__main__":run()
