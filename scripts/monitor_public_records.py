#!/usr/bin/env python3
"""Evidence-only monitoring of explicitly approved county meeting archive indexes.

No AI interpretation, document mirroring, award inference, or automated changes to
grant eligibility, amounts, or deadlines. Python standard library only.
"""
from __future__ import annotations

import concurrent.futures
import hashlib
import html
from html.parser import HTMLParser
import json
from datetime import datetime, timezone
from pathlib import Path
import re
import urllib.error
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / "site/data/public-record-sources.json"
OUTPUT = ROOT / "site/data/public-records-audit.json"
MAX_BYTES = 2_000_000
MAX_LINKS = 500
USER_AGENT = "TriStateGrantMatrix-RecordsMonitor/1.0 (+https://github.com/ATphobia22/Tri-State-Grant-Matrix)"
DOCUMENT_TYPES = (".pdf", ".doc", ".docx", ".odt", ".txt", ".xlsx", ".xls", ".rtf")
MEETING_TERMS = ("agenda", "minute", "meeting", "commission", "council", "fiscal court",
                 "resolution", "ordinance", "board", "packet", "budget", "public hearing")
DELEGATED_HOSTS = {
    "evansville.granicus.com", "warrickcountymeetings.vivabove.com",
    "irp.cdn-website.com", "www.unioncountyky.org", "unioncountyky.org",
    "www.cityofmtcarmel.com", "cityofmtcarmel.com",
}
SAFE_SCHEMES = {"https"}


def url_allowed(url: str, extra_hosts: set[str] | None = None) -> bool:
    """Reject internal endpoints and unlisted HTTP redirects. Allow listed delegates only."""
    try:
        p = urllib.parse.urlsplit(url)
        host = (p.hostname or "").lower()
        return (p.scheme == "https" and bool(host)
                and not p.username and not p.password and p.port is None
                and not host.endswith(".local")
                and (host.endswith((".gov", ".mil"))
                     or host in DELEGATED_HOSTS
                     or host in (extra_hosts or set())))
    except (ValueError, TypeError):
        return False


class BoundedRedirects(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if not url_allowed(newurl):
            raise urllib.error.HTTPError(newurl, 460, "Redirect outside approved hosts", headers, fp)
        return super().redirect_request(req, fp, code, msg, headers, newurl)


OPENER = urllib.request.build_opener(BoundedRedirects())


class Anchors(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.current = None
        self.found = []

    def handle_starttag(self, tag, attrs):
        if tag == "a":
            href = dict(attrs).get("href")
            if href:
                self.current = [href, []]

    def handle_data(self, data):
        if self.current is not None:
            self.current[1].append(data)

    def handle_endtag(self, tag):
        if tag == "a" and self.current is not None:
            self.found.append((self.current[0], " ".join(self.current[1])))
            self.current = None


def extract_document_links(markup: str, base_url: str) -> tuple[list[dict], bool]:
    """Identify meeting links on a verified source *index*, never assert PDF contents."""
    parser = Anchors()
    parser.feed(markup)
    found = {}
    for raw_href, raw_text in parser.found:
        target = urllib.parse.urljoin(base_url, html.unescape(raw_href).strip())
        if not url_allowed(target) or len(target) > 1800:
            continue
        p = urllib.parse.urlsplit(target)
        stable_url = urllib.parse.urlunsplit((p.scheme, p.netloc, p.path, p.query, ""))
        title = re.sub(r"\s+", " ", raw_text).strip()[:160]
        context = (title + " " + p.path).lower()
        if not (p.path.lower().endswith(DOCUMENT_TYPES)
                or any(term in context for term in MEETING_TERMS)):
            continue
        if stable_url == base_url:
            continue
        found[stable_url] = {"url": stable_url, "label": title or p.path.rsplit("/", 1)[-1][:160]}
    records = [found[u] for u in sorted(found)]
    return records[:MAX_LINKS], len(records) > MAX_LINKS


def content_digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def link_digest(rows: list[dict]) -> str:
    urls = "\n".join(sorted(x["url"] for x in rows))
    return content_digest(urls.encode("utf-8"))


def carry_prior(now: str, url: str, previous: dict, status: str, http_status=None, error_type=None) -> dict:
    row = {
        "url": url, "checked_at": now, "status": status, "http_status": http_status,
        "content_sha256": previous.get("content_sha256"),
        "document_links_sha256": previous.get("document_links_sha256"),
        "documents": previous.get("documents", []),
        "document_index_truncated": previous.get("document_index_truncated", False),
        "last_success_at": previous.get("last_success_at"),
        "cached_evidence_only": True,
    }
    if error_type:
        row["error_type"] = error_type
    return row


def fetch_archive(source: dict, previous: dict, now: str) -> dict:
    url = source["url"]
    if not url_allowed(url):
        return carry_prior(now, url, previous, "INVALID_SOURCE")
    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,text/plain,*/*;q=0.2",
    }
    if previous.get("etag"):
        headers["If-None-Match"] = previous["etag"]
    if previous.get("last_modified"):
        headers["If-Modified-Since"] = previous["last_modified"]
    request = urllib.request.Request(url, headers=headers)
    try:
        with OPENER.open(request, timeout=16) as response:
            payload = response.read(MAX_BYTES + 1)
            truncated = len(payload) > MAX_BYTES
            payload = payload[:MAX_BYTES]
            mimetype = response.headers.get("Content-Type", "").lower()
            html_page = "html" in mimetype or payload[:150].lower().lstrip().startswith(b"<!doctype html")
            documents, clipped = extract_document_links(
                payload.decode("utf-8", "replace"), response.geturl()
            ) if html_page else ([], False)
            return {
                "url": url, "checked_at": now, "status": "REACHABLE",
                "http_status": response.status,
                "final_url": response.geturl(), "content_type": mimetype.split(";", 1)[0],
                "content_sha256": content_digest(payload),
                "content_hash_scope": "first_2mb_of_response" if truncated else "complete_response",
                "content_truncated": truncated,
                "document_links_sha256": link_digest(documents),
                "documents": documents,
                "document_index_truncated": clipped,
                "last_success_at": now,
                "cached_evidence_only": False,
                "etag": response.headers.get("ETag"),
                "last_modified": response.headers.get("Last-Modified"),
            }
    except urllib.error.HTTPError as exc:
        if exc.code == 304 and previous.get("content_sha256"):
            row = carry_prior(now, url, previous, "REACHABLE", http_status=304)
            row["etag"] = previous.get("etag")
            row["last_modified"] = previous.get("last_modified")
            row["observation"] = "NOT_MODIFIED"
            return row
        status = ("NOT_FOUND" if exc.code in (404, 410) else
                  "ACCESS_RESTRICTED" if exc.code in (401, 403, 429, 460) else "HTTP_ERROR")
        return carry_prior(now, url, previous, status, http_status=exc.code)
    except Exception as exc:
        return carry_prior(now, url, previous, "UNAVAILABLE", error_type=type(exc).__name__)


def compare_source(source_id: str, old: dict, new: dict, now: str) -> list[dict]:
    """Status checks are separate from claims about what a governmental body decided."""
    if not old:
        return []
    events = []
    def emit(kind, details):
        key = content_digest(json.dumps([source_id, kind, details], sort_keys=True).encode())
        events.append({"id": key[:24], "source_id": source_id, "type": kind,
                       "detected_at": now, "details": details,
                       "requires_human_review": True})
    if old.get("status") == "REACHABLE" and new["status"] != "REACHABLE":
        emit("SOURCE_ACCESS_CHANGED", {"previous": old.get("status"), "current": new["status"],
                                       "not_proof_of_missing_records": True})
    if new["status"] != "REACHABLE" or old.get("status") != "REACHABLE":
        return events
    if old.get("content_sha256") and new.get("content_sha256") and old["content_sha256"] != new["content_sha256"]:
        emit("INDEX_CONTENT_CHANGED", {"previous_sha256": old["content_sha256"],
                                       "current_sha256": new["content_sha256"],
                                       "note": "Page content changed; no individual document or grant facts verified."})
    if (old.get("document_index_truncated") or new.get("document_index_truncated")
            or old.get("content_truncated") or new.get("content_truncated")):
        return events
    before = {x["url"] for x in old.get("documents", [])}
    after = {x["url"] for x in new.get("documents", [])}
    for url in sorted(after - before)[:35]:
        emit("NEW_DOCUMENT_LINK_REVIEW", {"url": url, "note": "Linked from indexed public source; contents not downloaded."})
    for url in sorted(before - after)[:35]:
        emit("DOCUMENT_LINK_NO_LONGER_LISTED", {"url": url, "note": "Not in current index; may still be online."})
    return events


def validate_registry(registry: dict) -> None:
    expected = {"18129", "18163", "18051", "18173", "17193", "17185", "17059", "21101", "21225"}
    counties = registry.get("counties", [])
    ids = [c.get("fips") for c in counties]
    if len(ids) != 9 or set(ids) != expected:
        raise ValueError("Exact nine-county FIPS coverage is mandatory.")
    seen = set()
    for county in counties:
        primary_count = 0
        for src in county.get("sources", []):
            if src["id"] in seen:
                raise ValueError("Duplicate source ID: " + src["id"])
            seen.add(src["id"])
            if not url_allowed(src["url"]):
                raise ValueError("Unsafe source: " + src["url"])
            if src["authority"] in {"official_county", "official_delegated"}:
                primary_count += 1
            if src.get("monitor") and src["authority"] not in {"official_county", "official_delegated"}:
                raise ValueError("Do not monitor non-county substitute as a county archive.")
        if county["archive_status"] == "county_archive_not_located" and primary_count:
            raise ValueError("Gap county must not have a supposedly verified county archive.")
        if county["archive_status"] == "official_archive_identified" and not primary_count:
            raise ValueError("Verified county lacks an official archive.")


def run() -> dict:
    registry = json.loads(REGISTRY.read_text(encoding="utf-8"))
    validate_registry(registry)
    old = json.loads(OUTPUT.read_text(encoding="utf-8")) if OUTPUT.exists() else {}
    stamp = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    pairs = [(c["fips"], s) for c in registry["counties"] for s in c["sources"] if s["monitor"]]
    old_rows = old.get("sources", {})
    def task(pair):
        fips, src = pair
        row = fetch_archive(src, old_rows.get(src["id"], {}), stamp)
        row.update({"source_id": src["id"], "county_fips": fips, "title": src["title"],
                    "authority": src["authority"]})
        return src["id"], row
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        observations = dict(pool.map(task, pairs))
    new_events = []
    for source_id, row in observations.items():
        new_events += compare_source(source_id, old_rows.get(source_id, {}), row, stamp)
    prior_events = old.get("events", [])
    event_ids = {e["id"] for e in prior_events}
    events = ([e for e in new_events if e["id"] not in event_ids] + prior_events)[:150]
    result = {
        "schema": "tristate.public-records-audit.v1",
        "last_run": stamp,
        "registry_reviewed_on": registry["reviewed_on"],
        "covered_counties": len(registry["counties"]),
        "counties_with_official_archives": sum(c["archive_status"] == "official_archive_identified" for c in registry["counties"]),
        "sources_monitored": len(pairs),
        "sources": observations,
        "changes": new_events,
        "events": events,
        "policy": "Source-index HTTP and SHA-256 observation only; not verification of grant eligibility, amounts, meeting actions, or document contents. Failed requests preserve previous evidence as stale.",
    }
    OUTPUT.write_text(json.dumps(result, indent=2, ensure_ascii=False, sort_keys=True) + "\n", encoding="utf-8")
    summary = {
        "checked": len(pairs),
        "reachable": sum(x["status"] == "REACHABLE" for x in observations.values()),
        "blocked_or_unavailable": sum(x["status"] != "REACHABLE" for x in observations.values()),
        "review_events": len(new_events),
    }
    print(json.dumps(summary))
    return result


if __name__ == "__main__":
    run()
