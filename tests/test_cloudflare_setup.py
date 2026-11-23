"""Config consistency checks for Cloudflare MCP, without network or credentials."""
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
ENDPOINT = "https://mcp.cloudflare.com/mcp"

class CloudflareAgentSetupTests(unittest.TestCase):
    def test_mcp_uses_official_oauth_endpoint(self):
        vscode = json.loads((ROOT / ".vscode/mcp.json").read_text())
        cursor = json.loads((ROOT / ".cursor/mcp.json").read_text())
        self.assertEqual(vscode["servers"]["cloudflare"]["url"], ENDPOINT)
        self.assertEqual(vscode["servers"]["cloudflare"]["type"], "http")
        self.assertEqual(cursor["mcpServers"]["cloudflare"]["url"], ENDPOINT)
        for cfg in (vscode, cursor):
            self.assertNotIn("token", json.dumps(cfg).lower())
            self.assertNotIn("api_key", json.dumps(cfg).lower())
            self.assertNotIn("authorization", json.dumps(cfg).lower())

    def test_backend_url_not_prematurely_enabled(self):
        backend = json.loads((ROOT / "site/data/backend.json").read_text())
        self.assertEqual(backend["api_base_url"], "")
        notes = (ROOT / "docs/cloudflare-agent-setup.md").read_text()
        self.assertIn("https://developers.cloudflare.com/agent-setup/prompt.md", notes)
        self.assertIn("codex mcp login cloudflare", notes)

if __name__ == "__main__":
    unittest.main()
