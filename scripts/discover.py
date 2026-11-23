"""Publish the most recent successful Grants.gov search for each portal topic."""
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen

path = Path(__file__).resolve().parents[1] / "site/data/discovery.json"
snapshot = json.loads(path.read_text()) if path.exists() else {}
for topic in ("flood mitigation", "water infrastructure", "community facilities", "rural broadband"):
    query = json.dumps({"keyword": topic, "rows": 25, "oppStatuses": "posted"}).encode()
    request = Request("https://api.grants.gov/v1/api/search2", data=query,
                      headers={"Content-Type": "application/json"})
    try:
        with urlopen(request, timeout=20) as response:
            payload = json.load(response)
        if str(payload.get("errorcode")) != "0":
            raise ValueError("unsuccessful agency response")
        hits = payload["data"]["oppHits"]
        if not isinstance(hits, list):
            raise ValueError("missing listings")
        records = [{key: hit.get(key) for key in ("id", "title", "agency", "closeDate")}
                   for hit in hits if str(hit.get("id", "")).isdigit() and hit.get("title")]
        snapshot[topic] = {"checked": datetime.now(timezone.utc).isoformat(), "hits": records}
    except (OSError, ValueError, KeyError) as error:
        print(f"{topic}: {error}", file=sys.stderr)
if not snapshot:
    sys.exit("No successful searches and no prior snapshot")
path.write_text(json.dumps(snapshot, indent=2, ensure_ascii=False) + "\n")
