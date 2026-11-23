# Cloudflare development-agent setup for Tri-State Grant Matrix

**Official source:** https://developers.cloudflare.com/agent-setup/prompt.md (read November 23, 2026). This document prepares MCP configuration for Cloudflare development; **it does not create a Cloudflare account, provision a Worker/D1 database, or authorize paid usage**.

The Cloudflare-authored guide specifies installing the [Cloudflare skills](https://github.com/cloudflare/skills) and connecting its **official remote OAuth MCP server** at `https://mcp.cloudflare.com/mcp`. The repository includes client configuration for Cursor and VS Code/GitHub Copilot. **No credentials, tokens, API keys, or OAuth authorization were committed.**

## Pick the development agent you actually use

### VS Code / GitHub Copilot

The repository's `.vscode/mcp.json` includes the official MCP remote URL. Open this repository in VS Code with a compatible GitHub Copilot agent/MCP-capable extension. Use its MCP discovery and authorization UI to connect to Cloudflare. Complete OAuth yourself in the Cloudflare browser flow.

### Cursor

The repository's `.cursor/mcp.json` includes the official MCP remote URL. Open the repository in Cursor, enable the named `cloudflare` MCP server and complete Cloudflare OAuth in the browser when prompted.

### Codex CLI (Windows or macOS/Linux)

Cloudflare's source specifies the following **user-environment** commands. They must be run on the computer/agent where Codex is actually installed; running them in a temporary CI shell cannot set up your personal Codex account:

```sh
npx -y skills add cloudflare/skills --skill '*' --yes --global
codex mcp add cloudflare --url https://mcp.cloudflare.com/mcp
codex mcp login cloudflare
```

These are the official Cloudflare commands, but the ChatGPT project-editing environment cannot run an authenticated Codex CLI for your computer. On local Windows PowerShell, Node/npm and the Codex CLI must already be installed.

### Other supported development agents

The [official setup page](https://developers.cloudflare.com/agent-setup/prompt.md) also specifies exact setup paths for Claude Code, Droid, Pi, OpenCode, Devin, and Vibe. Choose the matching section; do not combine competing agent formats. If your IDE needs the skills installed in its own environment, Cloudflare specifies:

```sh
npx -y skills add cloudflare/skills --skill '*' --yes --global
```

The MCP server connection uses OAuth, not a token checked into GitHub. Approve only the Cloudflare scopes necessary for your project. Do not paste account tokens in a public issue, HTML file, Actions logs, or ChatGPT messages.

## ChatGPT limitation

The official page **does not provide an in-chat ChatGPT plugin installation sequence**. This ChatGPT session currently has no directly connected Cloudflare Workers/D1 administration tool. Committing MCP configuration to GitHub prepares compatible IDEs but **does not make this ChatGPT conversation authorized to deploy Workers or create D1 databases**.

## What to do before migrating the grant system

- Keep current [GitHub Pages](https://atphobia22.github.io/Tri-State-Grant-Matrix/) running during migration; it remains a free, no-login source of the 101 curated funding pathways.
- For a permanent $0-cost hosted API/database, evaluate Cloudflare Workers + D1 within actual free quotas. D1 is SQLite-compatible, **not PostgreSQL**. The existing `backend/` FastAPI/psycopg SQL cannot run unchanged on Workers; a carefully tested Worker/D1 adapter or a separately hosted PostgreSQL server is needed.
- Keep all 9 FIPS counties and evidence records separate from any local personal grant pipeline data.
- Create and deploy a Worker or D1 resource only from an authenticated account and after reviewing Cloudflare's current Free-plan quotas. Never enable paid usage automatically. The optional `cf` CLI is beta; the official setup page says to **ask before installing it**. It has not been installed as part of this setup.
- After deploying and independently checking an actual HTTPS API, configure `site/data/backend.json`. Until then it must remain blank and use the static fallback.
- Do not send existing applicant drafts, SAM credentials, grant submission secrets, or personal data into a public D1 database. Preserve human verification of government NOFOs.

## Checks and limits

The repository includes declarative MCP client configurations and offline tests that confirm the endpoint. **Cloudflare skills and OAuth are not installed/authorized by a GitHub commit.** Incompatible clients or older versions may require their own MCP syntax. Successful access must be confirmed in the respective agent's MCP status UI.

**Follow the authoritative Cloudflare instructions if this document and the provider's setup guide ever diverge.**
