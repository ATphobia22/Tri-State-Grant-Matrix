# Cloudflare Free deployment — iPhone steps

**Status:** Source code and CI for Cloudflare Workers and SQLite-based D1 exist in the GitHub repository. No account-owned D1 database or publicly hosted Worker has yet been verified. GitHub permission is not proof of a running Cloudflare service.

Official instructions:
- https://developers.cloudflare.com/workers/ci-cd/builds/
- https://developers.cloudflare.com/workers/ci-cd/builds/configuration/
- https://developers.cloudflare.com/d1/get-started/
- https://developers.cloudflare.com/d1/platform/pricing/

## 1. Create the actual D1 database

1. On your iPhone open https://dash.cloudflare.com/ and sign in.
2. In Workers & Pages, open D1 SQL database and choose Create database.
3. Enter the name **tri-state-grant-matrix**. Keep the account on Workers Free; do not choose a paid plan.
4. Copy the database's **Database ID / UUID**. This is a nonsecret resource ID, not an API token.
5. In GitHub, edit **cloudflare/wrangler.jsonc**, replacing REPLACE_WITH_REAL_D1_UUID with the actual UUID. Keep the Worker name **tri-state-grants-api** and binding **GRANTS_DB** unchanged.

The database starts empty. Its schema and 101 curated pathways will be loaded by the deploy command.

## 2. Import this GitHub repository into Cloudflare

1. Open Workers & Pages → Create application → Import a repository (GitHub).
2. Choose **ATphobia22/Tri-State-Grant-Matrix** from your already-authorized GitHub account.
3. Worker name: **tri-state-grants-api**.
4. Production branch: **main**.
5. Root directory: **cloudflare**.
6. Build command: **npm install --no-audit --no-fund** (or leave blank if the platform automatically installs project dependencies).
7. **Deploy command: npm run deploy**. This is necessary: the default Wrangler deploy command does not create the SQL schema or seed the catalog.
8. Save and deploy. Check the Cloudflare build logs.

Cloudflare Workers Builds uses an automatically generated deployment API token by default. If the D1 schema or seed step reports insufficient permissions, check the **build-token permissions in the Cloudflare dashboard**. The token may need D1 edit rights in addition to Worker deployment permissions. Do not paste a token in chat or GitHub public files.

## 3. Verify before connecting the public website

Open the actual Worker URL shown by Cloudflare, rather than a guessed address. Confirm these HTTPS paths:

- /healthz → status alive.
- /readyz → HTTP 200, status ready, counties 9, programs at least 101.
- /v1/catalog → nine FIPS counties and 101 curated funding pathways.
- /v1/records → source registry with county and authority.
- /v1/programs?county=18129 → Indiana/federal pathways only, not a legal eligibility ruling.
- /v1/audits/latest → dated audit receipts after the scheduled Cloudflare import.
- Verify browser CORS access from https://atphobia22.github.io .

**Only after these checks pass**, enter the real Worker HTTPS base URL as api_base_url in **site/data/backend.json**, commit it, and verify the GitHub Pages website says Live verified database catalog connected. If Cloudflare goes down, the site still uses the static daily-reviewed snapshots.

## Daily audit and data safety

GitHub Actions already audits grant sources daily at 13:15 UTC and county archives daily at 13:45 UTC. The Worker Cron Trigger is configured for 15:30 UTC and imports those two published audit JSON snapshots into D1, bounded and deduplicated. It does not scrape citizen data or publish AI-written grant eligibility. Check Cloudflare Cron logs after deployment because the free tier's 10 ms CPU limit may make a large import impractical in a single invocation.

Free-tier limits (checked Nov. 23, 2026): Workers Free 100,000 requests/day, 10 ms CPU per invocation. D1 Free 5 GB total storage, 5 million rows read/day, 100,000 rows written/day. If exceeded, requests can fail. Do not enable Workers Paid, Workers AI, or paid inference to make the portal work. Keep an independent export/restore backup before considering D1 the sole authoritative database.

## Repository proof and limits

- cloudflare/migrations/0001_init.sql — D1 SQLite migration.
- cloudflare/scripts/generate-seed.mjs — source-validated nine-county/101-program SQL generator.
- cloudflare/src/index.mjs — anonymous GET API and scheduled receipt import.
- cloudflare/tests/api.test.mjs — regression tests using a real SQLite engine.
- .github/workflows/cloudflare.yml — test and Wrangler dry-run without deployment secrets.
- backend/ — existing FastAPI/PostgreSQL alternative remains separate.

The code and GitHub tests do not prove the Cloudflare-hosted Worker is already live. The one-time database creation, UUID configuration and Cloudflare Git-import action occur in your Cloudflare dashboard. No personal grant application drafts or credentials are sent to D1.

## Incident 2026-11-23: D1 remote seed transaction rejection

The first Cloudflare build successfully migrated `0001_init.sql` but failed during `wrangler d1 execute GRANTS_DB --remote --file=generated/seed.sql` because the seed generator emitted `BEGIN TRANSACTION;` and `COMMIT;`. D1 manages SQL-file import transactions and rejects explicit transaction control. The generator now produces only idempotent INSERT/UPSERT statements and the Node test suite fails on any reintroduced BEGIN/COMMIT/SAVEPOINT/RELEASE statement. The original D1 database and completed migration should be retained; retry the build after this commit. See https://developers.cloudflare.com/d1/best-practices/import-export-data/ .
