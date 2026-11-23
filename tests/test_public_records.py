"""No-network regression tests for the official public-record source monitor."""
import copy
import importlib.util
import json
from pathlib import Path
import unittest
import urllib.error

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("public_record_monitor", ROOT / "scripts/monitor_public_records.py")
module = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(module)
REGISTRY = json.loads((ROOT / "site/data/public-record-sources.json").read_text(encoding="utf-8"))


class SourceRegistryTests(unittest.TestCase):
    def test_exact_nine_fips_and_verified_source_scope(self):
        module.validate_registry(REGISTRY)
        self.assertEqual(len(REGISTRY["counties"]), 9)
        self.assertEqual(
            {c["fips"] for c in REGISTRY["counties"]},
            {"18129", "18163", "18051", "18173", "17193", "17185", "17059", "21101", "21225"},
        )
        self.assertEqual(sum(c["archive_status"] == "official_archive_identified"
                             for c in REGISTRY["counties"]), 8)
        self.assertEqual(sum(s["monitor"] for c in REGISTRY["counties"]
                             for s in c["sources"]), 12)

    def test_wabash_illinois_is_an_explicit_coverage_gap(self):
        county = next(c for c in REGISTRY["counties"] if c["fips"] == "17185")
        self.assertEqual(county["state"], "IL")
        self.assertEqual(county["archive_status"], "county_archive_not_located")
        self.assertFalse(any(s["monitor"] for s in county["sources"]))
        self.assertTrue(all(s["authority"] not in ("official_county", "official_delegated")
                            for s in county["sources"]))

    def test_invalid_county_or_unverified_monitor_is_rejected(self):
        bad = copy.deepcopy(REGISTRY)
        bad["counties"][0]["fips"] = "18000"
        with self.assertRaises(ValueError):
            module.validate_registry(bad)
        bad = copy.deepcopy(REGISTRY)
        wabash = next(c for c in bad["counties"] if c["fips"] == "17185")
        wabash["sources"][0]["monitor"] = True
        with self.assertRaises(ValueError):
            module.validate_registry(bad)

    def test_urls_are_https_without_private_hosts(self):
        for bad in ("http://www.poseycountyin.gov/meetings/",
                    "https://127.0.0.1/index.html",
                    "https://localhost/index.html",
                    "https://bad.example.com/meetings/",
                    "https://evil.com@127.0.0.1/path",
                    "https://www.poseycountyin.gov:8443/meetings/",
                    "file:///etc/passwd",
                    "https://www.poseycountyin.gov@evil.com/meetings/"):
            self.assertFalse(module.url_allowed(bad), bad)
        self.assertTrue(module.url_allowed("https://www.poseycountyin.gov/meetings/"))
        self.assertTrue(module.url_allowed("https://evansville.granicus.com/ViewPublisher.php?view_id=1"))


class PublicRecordDiffTests(unittest.TestCase):
    def test_extract_documents_avoids_external_and_unsafe_links(self):
        html = """
        <main><a href="/wp-content/uploads/2026/11/county-board-minutes.pdf">Board Minutes Nov 2026</a>
        <a href="https://irp.cdn-website.com/test/meeting-packet.docx">Meeting Packet</a>
        <a href="http://localhost:9999/agenda.pdf">Local Agenda</a>
        <a href="https://nottrusted.example.org/minutes.pdf">Untrusted Link</a>
        <a href="javascript:alert(1)">Meeting alert</a>
        <a href="/about">About Us</a>
        <a href="#navigation">Meeting navigation</a></main>
        """
        rows, clipped = module.extract_document_links(
            html, "https://www.poseycountyin.gov/meetings/"
        )
        self.assertFalse(clipped)
        self.assertEqual(len(rows), 2)
        self.assertTrue(all(x["url"].startswith("https://") for x in rows))
        self.assertEqual(len({x["url"] for x in rows}), len(rows))
        self.assertEqual(module.link_digest(rows), module.link_digest(list(reversed(rows))))

    def test_content_hash_and_link_hash_are_distinct(self):
        rows = [{"url": "https://www.poseycountyin.gov/agenda.pdf", "label": "Agenda"}]
        self.assertEqual(len(module.content_digest(b"hello")), 64)
        self.assertNotEqual(module.content_digest(b"hello"), module.link_digest(rows))

    def test_new_and_delisted_document_links_are_review_only(self):
        a = "https://www.poseycountyin.gov/2025.pdf"
        b = "https://www.poseycountyin.gov/2026.pdf"
        old = {"status": "REACHABLE", "content_sha256": "old",
               "documents": [{"url": a, "label": "2025"}], "document_index_truncated": False}
        new = {"status": "REACHABLE", "content_sha256": "new",
               "documents": [{"url": b, "label": "2026"}], "document_index_truncated": False}
        events = module.compare_source("posey-meetings", old, new, "2026-11-23T12:00:00+00:00")
        self.assertEqual({e["type"] for e in events},
                         {"INDEX_CONTENT_CHANGED", "NEW_DOCUMENT_LINK_REVIEW", "DOCUMENT_LINK_NO_LONGER_LISTED"})
        self.assertTrue(all(e["requires_human_review"] for e in events))
        self.assertTrue(any("may still be online" in e["details"].get("note", "") for e in events))

    def test_access_failures_do_not_erase_previous_evidence(self):
        old = {"status": "REACHABLE", "content_sha256": "knownhash", "last_success_at": "yesterday",
               "documents": [{"url": "https://www.poseycountyin.gov/agenda.pdf", "label": "Agenda"}],
               "document_links_sha256": "linksha"}
        unavailable = module.carry_prior("now", "https://www.poseycountyin.gov/meetings/",
                                         old, "ACCESS_RESTRICTED", http_status=403)
        self.assertEqual(unavailable["content_sha256"], "knownhash")
        self.assertEqual(unavailable["last_success_at"], "yesterday")
        self.assertTrue(unavailable["cached_evidence_only"])
        self.assertEqual(unavailable["documents"], old["documents"])
        events = module.compare_source("posey-meetings", old, unavailable, "now")
        self.assertEqual([e["type"] for e in events], ["SOURCE_ACCESS_CHANGED"])
        self.assertNotIn("DOCUMENT_LINK_NO_LONGER_LISTED", [e["type"] for e in events])

    def test_first_baseline_does_not_claim_a_change(self):
        new = {"status": "REACHABLE", "content_sha256": "abcdef", "documents": []}
        self.assertEqual(module.compare_source("posey-meetings", {}, new, "today"), [])

    def test_truncated_indexes_suppress_link_removed_alerts(self):
        old = {"status": "REACHABLE", "content_sha256": "old",
               "documents": [{"url": "https://www.poseycountyin.gov/old.pdf"}],
               "document_index_truncated": True}
        new = {"status": "REACHABLE", "content_sha256": "new", "documents": [],
               "document_index_truncated": False}
        types = [e["type"] for e in module.compare_source("posey-meetings", old, new, "today")]
        self.assertEqual(types, ["INDEX_CONTENT_CHANGED"])

    def test_byte_truncated_pages_suppress_false_removed_link_flags(self):
        old = {"status": "REACHABLE", "content_sha256": "old", "content_truncated": False,
               "documents": [{"url": "https://www.poseycountyin.gov/2026-board-minutes.pdf"}]}
        new = {"status": "REACHABLE", "content_sha256": "new", "content_truncated": True,
               "documents": []}
        types = [e["type"] for e in module.compare_source("posey-meetings", old, new, "today")]
        self.assertEqual(types, ["INDEX_CONTENT_CHANGED"],
                         "A partial HTML response must not generate document removal claims.")

    def test_change_monitor_does_not_edit_catalog(self):
        source = (ROOT / "scripts/monitor_public_records.py").read_text()
        self.assertIn("MAX_BYTES = 2_000_000", source)
        self.assertIn("last_success_at", source)
        self.assertNotIn('catalog.json").write_text', source)
        self.assertNotIn("grant_award_confirmed", source)


if __name__ == "__main__":
    unittest.main()
