"""Read-only catalog; metadata checks do not download models or run inference."""
import argparse
import json
from datetime import datetime, timezone

MODELS = {
    "nofo_extraction": {"repo_id": "Qwen/Qwen3.8-27B", "license_expected": "apache-2.0",
                        "capability": "Proposed funding fields with exact quote/page validation",
                        "enabled_by_default": False},
    "scanned_documents": {"repo_id": "google/gemma-4-31B-it", "license_expected": "apache-2.0",
                          "capability": "Optional multimodal extraction from scanned pages",
                          "enabled_by_default": False},
    "embedding": {"repo_id": "Qwen/Qwen3-Embedding-8B", "license_expected": "apache-2.0",
                  "capability": "Optional 4096-dimensional semantic search embeddings",
                  "enabled_by_default": False},
}

def verify_model_cards(api=None):
    """Verify official model SHA and license metadata; allow mock API in tests."""
    if api is None:
        from huggingface_hub import HfApi
        api = HfApi()
    checks = []
    for purpose, spec in MODELS.items():
        rid = spec["repo_id"]
        try:
            info = api.model_info(rid)
            card = getattr(info, "card_data", None)
            license_value = (card.get("license") if isinstance(card, dict)
                             else getattr(card, "license", None))
            ok = bool(getattr(info, "sha", None)) and license_value == spec["license_expected"]
            checks.append({"purpose": purpose, "repo_id": rid,
                           "resolved_sha": getattr(info, "sha", None),
                           "license": license_value,
                           "verified_at": datetime.now(timezone.utc).isoformat(),
                           "state": "METADATA_VERIFIED" if ok else "REVIEW_REQUIRED",
                           "model_weights_downloaded": False, "inference_running": False})
        except Exception as exc:
            checks.append({"purpose": purpose, "repo_id": rid, "state": "UNAVAILABLE",
                           "error_type": type(exc).__name__,
                           "model_weights_downloaded": False, "inference_running": False})
    return checks

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--verify", action="store_true")
    args = parser.parse_args()
    print(json.dumps({"models": verify_model_cards() if args.verify else MODELS,
                      "inference_running": False}, indent=2))

if __name__ == "__main__":
    main()
