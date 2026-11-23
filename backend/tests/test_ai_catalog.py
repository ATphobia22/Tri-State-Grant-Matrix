"""Offline model metadata and public export safety checks."""
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock
from backend import model_registry, export_audit

class OptionalAITests(unittest.TestCase):
    def test_models_are_valid_named_repositories_but_disabled(self):
        catalog = model_registry.MODELS
        self.assertEqual(catalog["nofo_extraction"]["repo_id"], "Qwen/Qwen3.8-27B")
        self.assertEqual(catalog["scanned_documents"]["repo_id"], "google/gemma-4-31B-it")
        self.assertEqual(catalog["embedding"]["repo_id"], "Qwen/Qwen3-Embedding-8B")
        self.assertTrue(all(not v["enabled_by_default"] for v in catalog.values()))

    def test_remote_model_revision_receipts_are_data_only(self):
        hub = MagicMock()
        hub.model_info.return_value = SimpleNamespace(sha="a"*40,card_data={"license":"apache-2.0"})
        result = model_registry.verify_model_cards(hub)
        self.assertEqual(len(result), 3)
        self.assertTrue(all(x["state"] == "METADATA_VERIFIED" for x in result))
        self.assertTrue(all(not x["model_weights_downloaded"] for x in result))
        hub.model_info.assert_any_call("Qwen/Qwen3.8-27B")

    def test_license_or_hub_failure_is_not_verified(self):
        hub = MagicMock()
        hub.model_info.return_value = SimpleNamespace(sha="a"*40,card_data={"license":"other"})
        self.assertTrue(all(x["state"]=="REVIEW_REQUIRED"
                            for x in model_registry.verify_model_cards(hub)))
        hub.model_info.side_effect = RuntimeError("temporary error")
        self.assertTrue(all(x["state"]=="UNAVAILABLE"
                            for x in model_registry.verify_model_cards(hub)))

    def test_export_excludes_private_data_and_has_hard_limit(self):
        with self.assertRaises(ValueError):
            export_audit.fetch_export_rows(None,"applicant_drafts",100)
        with self.assertRaises(ValueError):
            export_audit.export_jsonl("applicant_drafts",Path("/tmp/should-not-exist"))
        with self.assertRaises(ValueError):
            export_audit.export_jsonl("checks",Path("/tmp/should-not-exist"),100001)
        self.assertEqual(export_audit.normalize({"id":1,"s":None}),{"id":1,"s":None})

if __name__ == "__main__":
    unittest.main()
