# Nine-county PostgreSQL + FastAPI backend

Status: committed and tested as code; NOT publicly deployed until a server, database and approved HTTPS domain are provisioned.

Production code:
- backend/schema.sql — programs, nine county FIPS, official records, append-only source checks, federal opportunities, evidence candidates and run receipts
- backend/bootstrap.py — deterministic seed from official source-controlled catalog, 101 pathways and nine counties, no inferred eligibility
- backend/api.py — bounded public read-only API and operator-only evidence staging with an admin token
- backend/worker.py — official Grants.gov search2 discovery and source checks, every six hours when a server runs
- backend/model_registry.py — optional Hugging Face model revisions/license metadata (no model weights)
- backend/export_audit.py — public-only JSONL/Parquet exports (no applicant data)
- backend/vector.sql — optional pgvector 4096-dimensional embedding storage, not active by default
- backend/tests — live PostgreSQL and mocked upstream regression checks.

## Run with Docker Compose

1. Copy backend/.env.example to .env in repository root.
2. Replace POSTGRES_PASSWORD and SYNC_ADMIN_TOKEN placeholders with independent, strong secrets. Never commit .env.
3. Run docker compose up --build -d db api worker.
4. Open http://127.0.0.1:8000/readyz; expect status ready, 9 counties, at least 101 programs. The interactive OpenAPI UI is /docs.
5. View recent source results: docker compose logs --tail 100 worker.
6. Back up to a private location: docker compose exec -T db pg_dump -U grantmatrix -d grantmatrix -Fc > grantmatrix.backup. Test a restore before real deployment.
7. For public hosting, configure API_DOMAIN DNS/firewall and enable the optional Caddy profile, then independently verify the HTTPS API before setting site/data/backend.json api_base_url. The public website remains static until this is done.

Ports and availability: Database port is not exposed to the public internet. API port 8000 binds to localhost by default. The worker has outbound access for official sources, but cannot bypass blocked government sites. The Caddy public profile requires operator-owned DNS and a secure server. The database is persistent only while the Docker volume remains and backups actually work. Never remove the database volume before backing up.

Public browsing and the current iPhone-facing website do not require a login, a model, a GPU, or a paid subscription. Applicant drafts remain browser-local and should not be sent to this public database.

## Audits and operation

The separate GitHub Actions workflows for grant links and county archives run daily and commit public dated audit snapshots even when the backend is offline. A separately deployed backend makes private PostgreSQL history possible; worker default interval is 21600 seconds. Source status does not automatically modify grant applicant rules, cost-sharing, awards or deadlines.

For optional AI model/repository review see docs/ai-tooling-evaluation.md. Pinned repo SHA and declared license can be verified, but neither checks model quality nor installs weights; inference endpoints need separate hosting/evaluation. Current API tests are in .github/workflows/backend.yml and use temporary PostgreSQL 17, not a durable production instance.
