# Tri-State River Valley Grant Matrix

**Nine-county, public-access grant research and application-preparation portal** for local governments, municipalities, townships, utilities, special districts, and public-service departments near the Ohio–Wabash confluence.

Coverage is **exactly nine counties**, not eight:

| State | Counties |
| --- | --- |
| Indiana | Posey, Vanderburgh, Gibson, Warrick |
| Illinois | White, Wabash, Gallatin |
| Kentucky | Henderson, Union |

The catalog currently contains **101 funding pathways** (grants, loans, subsidies, and other potential funding routes). Inclusion does **not** confirm an open opportunity, local eligibility, a funded project, or an awarded amount.

## Open the site

This repository publishes the folder `site/` using GitHub Pages. The published address (verified after a successful GitHub Actions deployment) is:

**https://atphobia22.github.io/Tri-State-Grant-Matrix/**

**Deployment:** Pages has been enabled. Updates to the static site are tested and deployed by [Deploy nine-county grant portal](https://github.com/ATphobia22/Tri-State-Grant-Matrix/actions/workflows/pages.yml). Always verify the latest workflow and open the public URL after making changes; a commit alone does not prove deployment.

For local testing, use an HTTP server rather than opening `site/index.html` directly with `file://`:

```bash
python -m http.server 8000 --directory site
```

Then open **http://localhost:8000/**. The public site requires no account or external JavaScript framework. A separate PostgreSQL/FastAPI backend now exists as deployable code; the live site continues using the static fallback until a real HTTPS backend is hosted and configured.

## Using the buttons and pages

| Page or control | Function |
| --- | --- |
| **Find grants** | Browse the official-source program catalog and view source-check state and review date. |
| **Funding jurisdiction filter** | Narrow the catalog to federal, Indiana, Illinois or Kentucky programs, alongside county and department filters. |
| **Track for a county** | Open the local pipeline with a chosen grant; selecting a county is mandatory before tracking. |
| **My pipeline** | Track program/county pairs through Prospects, Pre-Qualification, Drafting & Engineering and Submitted. These are personal labels, not official statuses. |
| **Application checklist** | Mark possible documents as personally reviewed. The list is **not** an agency-approved or universally mandatory submission packet. |
| **Export my pipeline (JSON)** | Download your browser-local records for a private backup. No applicant data is sent to the public repository. |
| **Source directory** | Search and filter the existing official resource links by jurisdiction or evidence type; source HTTP status is not grant verification. |
| **Cost-share model** | Enter total project cost and federal/state percentages to calculate an illustrative remainder for local/other contributions. Unverified preset program rates are intentionally not offered. |
| **Nine county buttons** | Filter by the chosen county's state and federal pathways. This is a geographic filter, **not an eligibility ruling**. |
| **Search / County / Department / Funding stage** | Narrow the results. **Clear filters** resets all four filters. |
| **Show more grants** | Loads the next group of catalog cards, 24 at a time. |
| **Official program / Forms & guidance** | Navigates to the source in the same tab; use the browser Back button. The actual notice and instructions control eligibility and required documents. |
| **Prepare application packet** | Opens the document generator and selects that program. |
| **Forms & resources** | Lists official application, compliance, and evidence portals. |
| **Generate / update draft** | Creates an editable project narrative, budget summary, and possible-document checklist. It does **not** file or submit an application. |
| **Save draft / Load saved draft / Clear form** | Stores and retrieves the draft in the current browser's local storage; clearing the form does not delete exported copies. |
| **Word-compatible .doc / HTML / Markdown / JSON** | Downloads the draft in the selected format. The `.doc` export contains HTML, **not a native `.docx` package**. |
| **Print / Save as PDF** | Opens the browser print dialog for PDF output. |
| **Export filtered grant matrix (CSV)** | Exports exactly the currently filtered program list. |
| **Source updates / Reload published results** | Shows or refreshes the last committed link-audit snapshot. |
| **Export link audit JSON** | Downloads the audit snapshot for independent review. |
| **View and run update workflow** | Opens GitHub Actions for the source audit; running it may require repository permissions. |

The document generator uses generic **planning** checklists. The daylight interface is responsive for phones, tablets and desktops without a client-side framework. The pipeline is independent of the official grant catalog: its stage and checklist selections are local personal data, not statements of application acceptance. A single program can be tracked separately for more than one county. Local storage may be cleared by the browser and is not synchronized across devices.

**Cost-share model:** The initial $1 million / 75% federal / 0% state / 25% remainder is an **example**. Enter the actual approved percentages from the current NOFO and verify match source eligibility, ceilings, direct/in-kind rules and board commitments. Rounding uses whole cents and the three calculated amounts always reconcile to the total. An invalid combined percentage produces an explicit warning rather than an invented result.

Always obtain program-specific forms, certifications, applicant registration instructions, deadlines, matching requirements, and environmental/engineering approvals from the current official solicitation.

On each visit, Source updates searches the public Grants.gov Search2 API for posted opportunities across four topics. Results are session-local. Offline use or an API error shows the unavailable topics. The daily server-side audit checks catalog URLs and fingerprints PDFs for changes. Agency eligibility and state deadlines require review of the governing notice.

## Testing buttons, links, and exports

The frontend is intentionally a static HTML/CSS/JavaScript site, so no application build is required.

```bash
# Verify interactive controls, filters, draft storage, downloads,
# source URLs, service-worker cache paths and offline audit reload.
node --test tests/test_frontend.mjs

# Verify program IDs, required URLs, county coverage and known deadlines.
python -m unittest discover -s tests -v
```

The deploy workflow runs both test commands before attempting Pages deployment. Passing tests establish **local logic correctness**, not universal compatibility with every browser or proof that external sites remain reachable. In particular, an HTTP `403` or network timeout from a government site can reflect automation blocking rather than a broken user-facing link.

[Source-audit workflow](https://github.com/ATphobia22/Tri-State-Grant-Matrix/actions/workflows/monitor.yml) runs daily at 13:15 UTC and can also be started manually. It monitors source URLs, response status, and page-content fingerprints, writing `site/data/audit.json`. The app can read cached catalog and audit data offline **after successful service-worker installation while hosted on HTTPS**. The audit reload uses the same URL as the offline cache. The command center CSS and JavaScript are also precached. Direct `file://` use is not supported as a full offline application.

**Reachable ≠ verified eligible.** A successful link check confirms a technical HTTP result only. Deadlines, forms, local/state preapplication windows, eligibility, cost shares, and award amounts must be reviewed against the actual agency NOFO. The monitor does not silently rewrite those fields.

## Project files

```text
site/
  index.html             # Public app, navigation, filters, document exports
  command-center.css     # Daylight responsive styles, badges, desktop/mobile layout
  command-center.js      # Local pipeline, source directory and match model
  service-worker.js      # Offline snapshot cache on HTTPS
  data/
    catalog.json         # Nine counties, funding pathways, official links
    audit.json           # Most recent link-audit observations
scripts/
  monitor.py             # Scheduled official-source URL audit
tests/
  test_catalog.py        # Catalog and link policy checks
  test_frontend.mjs      # Functional smoke tests for UI controls
.github/workflows/
  pages.yml              # Tests and GitHub Pages deployment
  monitor.yml            # Twice-weekly URL monitoring
```

## Privacy and boundaries

- Public browsing has no login or paywall.
- Drafts are stored in **your own browser**. Browser cache clearing or private mode can discard them; use **export** for backups.
- Do not commit private applicant records, banking data, grant applications, or confidential attachments to this public repository.
- Service-worker caching is useful for reviewing saved data without connectivity, but **does not guarantee live grant information** when offline.
- This platform is informational grant decision-support, not grant approval, regulatory certification, agency authorization, or a guarantee of funding.

Official source directories include [Grants.gov](https://www.grants.gov/), [SAM.gov](https://sam.gov/), [Indiana grant opportunities](https://www.in.gov/sba/grants/state-agency-grant-opportunities/), [Illinois GATA](https://gata.illinois.gov/grants/csfa.html), and [Kentucky DLG](https://dlg.ky.gov/grants/federal/Pages/default.aspx).

## Independent public meeting archives

The **Public meeting records** tab now lists each of the **nine** county source directories, shows public-record source check results and document index link candidates, and labels Wabash County, Illinois as an unresolved county-board archive gap. Eight county archive sources were identified independently; this is not a guarantee of complete meeting coverage. The monitoring workflow runs Monday and Thursday at 13:45 UTC and supports manual execution. It does **not** infer grants, awards or eligibility from an agenda or an AI summary.

- [Official record source inventory](site/data/public-record-sources.json)
- [Latest observed records audit](site/data/public-records-audit.json)
- [Research, security and repository recommendations](docs/public-records.md)
- [County meeting records workflow](.github/workflows/public-records.yml)

The check stores SHA-256 hashes of observed **archive index pages** and discovered document link lists, not of attached PDF/DOCX files. On blocked/unavailable requests, the previous good snapshot is retained and explicitly marked stale. Public site visitors cannot trigger remote crawls just by opening GitHub Pages. CitizenPortal content is not ingested, mirrored or reproduced.

## Initial official meeting-archive monitoring baseline (November 23, 2026)

The first [public records audit](site/data/public-records-audit.json) ran at **2026-11-23 12:52:26 UTC**. It observed **12** official county or delegated meeting-index URLs covering **eight counties with archives identified**, while retaining **nine** county FIPS IDs in the source registry.

| Source-check outcome | Sources | Interpretation |
| --- | ---: | --- |
| HTTP reachable | 10 | Index responded; individual meeting attachment content was not verified. |
| Automation blocked (HTTP 403) | 1 — Union County, KY | May be bot/access protection; do not classify records as unavailable. |
| Network unavailable | 1 — Gallatin County, IL | Scanner could not read that index, although the official county board page is publicly accessible by other means. |
| County-board archive not yet located | Wabash County, IL | Not silently replaced by Mount Carmel city or Wabash County, Indiana records. |

**Baseline limitation:** The first scan establishes reference hashes and should not claim that any new document was published. Future changes are *review leads*, never automatic conclusions that a meeting occurred or a grant was awarded. The index monitor hashes downloaded page bytes (at most 2 MB), tracks observed document URLs, and suppresses link-removal claims when HTML or link discovery was truncated. It does not fetch or hash attachment bodies.

To examine the results, open the **Public meeting records** tab of the live site, select a county archive, and review its last successful check and direct official source links. The new audit runs **daily at 13:45 UTC**, or by manual [GitHub Actions dispatch](https://github.com/ATphobia22/Tri-State-Grant-Matrix/actions/workflows/public-records.yml). No personal applicant data is collected. For acquisition, model selection, metadata, security and remaining source gaps, see [the audit implementation notes](docs/public-records.md).


## External official links on iOS, Android, tablets and in-app browsers

**Navigation repair (November 23, 2026):** Official grant, form, source directory and county meeting archive links now navigate in the **same browser tab**, instead of requesting a new popup tab. Use your browser's **Back** button to return to the Grant Matrix. This is intended to avoid in-app mobile-browser new-tab restrictions; every device must still be tested independently. The source directory and all county archives display complete, selectable source addresses. Each grant card also has **Link not opening? Show and copy addresses**. Touch and hold the address, copy it, and open in Safari or Chrome when an embedded browser blocks a third-party site.

For classic Grants.gov search problems, the directory offers the separate official [Simpler.Grants.gov search](https://simpler.grants.gov/search). Some government pages require JavaScript, authentication, cookies or third-party security checks. An automated HTTP 403 is not necessarily a broken public website. This fix does not bypass source restrictions, and independently verified web links may still fail in some in-app browsers.


## Database backend, daily audit schedules and optional AI

The repository now includes an actual PostgreSQL / FastAPI backend, a server-side official Grants.gov search worker, a Caddy HTTPS reverse proxy option, and a browser API adapter that falls back to the source-controlled catalog when no backend is online. Review backend/README.md for Docker Compose startup, API endpoints, database backup/restore and publishing steps. The API URL in site/data/backend.json remains intentionally empty because no public server has been verified. GitHub Pages itself cannot run a SQL server.

Daily automation (UTC):
- 13:15 — .github/workflows/monitor.yml checks official grant resource URLs and refreshes the static source and discovery snapshots; all changes are evidence leads, not verified eligibility updates.
- 13:45 — .github/workflows/public-records.yml checks official nine-county meeting archive indexes and preserves access errors and partial index evidence. Wabash County, Illinois remains a documented official county-board archive gap.
- When separately deployed, backend/worker.py runs source checks and Grants.gov discovery every six hours by default. It stores historical receipts and discovered opportunities in PostgreSQL without overwriting curated deadlines or awards.

The model/tooling implementation in backend/model_registry.py identifies official Qwen3.8-27B, Google Gemma 4 31B instruction-tuned, and Qwen3-Embedding-8B model-card identities, licenses and revisions on demand. Install backend/requirements-optional-ai.txt only when operating the optional model metadata and public dataset tools; large model weights are not installed in the default API container. Public audit exports to JSONL/Parquet live in backend/export_audit.py, excluding private applicant drafts. Review docs/ai-tooling-evaluation.md for the evaluated GitHub repository list and decisions. Neither model output nor source HTTP status can certify grant eligibility, funding rates or governmental actions.

A successful GitHub Actions database test is not a live deployment; it proves the API can seed and query a temporary PostgreSQL service in CI.

## Cloudflare agent development setup (2026-11-23)

Following [Cloudflare's official agent-setup instructions](https://developers.cloudflare.com/agent-setup/prompt.md), this repository includes an OAuth-based MCP endpoint configuration for **VS Code/GitHub Copilot** (`.mcp.json` and `.vscode/mcp.json`) and **Cursor** (`.cursor/mcp.json`). See [Cloudflare agent setup](docs/cloudflare-agent-setup.md) for the official Codex CLI/skills commands, supported agents, permissions and free-tier deployment boundaries. No cloud account, D1 database, Worker, model server, credential, or external MCP authorization was created as part of the repository setup. Cloudflare's optional beta `cf` CLI is not installed. The live static website and its no-login fallback are unchanged.
