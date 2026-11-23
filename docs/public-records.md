# Nine-county public meeting record monitoring

Official source registry: site/data/public-record-sources.json. Published snapshot: site/data/public-records-audit.json. The monitor does not detect or verify grant awards.

## Official source validation (November 23, 2026)

| FIPS | County | Primary official meeting archive | Research status |
|---|---|---|---|
| 18129 | Posey, IN | https://www.poseycountyin.gov/meetings/ | Commissioners and council minutes, plus APC |
| 18163 | Vanderburgh, IN | https://evansville.granicus.com/ViewPublisher.php?view_id=1 | Official joint Evansville/Vanderburgh delegated portal; filter board identity |
| 18051 | Gibson, IN | https://gibsoncounty-in.gov/public-meetings/ | Official public meetings and commissioners documents |
| 18173 | Warrick, IN | https://www.warrickcounty.gov/commissioners | Official county page links to meeting-archive vendor |
| 17193 | White, IL | https://www.whitecounty-il.gov/minutes | Official board minutes, separate agendas |
| 17185 | Wabash, IL | https://www.ilsos.gov/departments/archives/irad/wabash.html | Current county-board archive NOT located; historical records custodian identified |
| 17059 | Gallatin, IL | https://gallatinco.illinois.gov/departments/board/ | Agendas and minutes in PDF/DOCX |
| 21101 | Henderson, KY | https://www.hendersoncountyky.gov/AgendaCenter/Fiscal-Court-2 | Fiscal Court agendas and historical versions |
| 21225 | Union, KY | https://www.unioncountyky.org/local-government/fiscal-court/meeting-minutes | Fiscal Court minutes page; may block automated HTTP requests |

Wabash County, IL: Illinois Secretary of State records information is historical, and City of Mount Carmel meeting files are **municipal**, not county-board minutes. Do not substitute Wabash County, Indiana. Obtain an official county-board index or records-request process from the Wabash County IL county clerk before enabling county records monitoring.

## Implemented source monitoring

- Scheduled daily at 13:45 UTC plus manual GitHub workflow dispatch. Visitors opening GitHub Pages do not launch server-side crawls.
- Approved, HTTPS-only source URLs and bounded redirects; four parallel reads; size limits; conditional HTTP GET.
- SHA-256 of retrieved meeting index page bytes and a **separate** SHA-256 of discovered document URLs. These are not hashes of PDF/DOCX attachments: the monitor does **not** download their contents.
- UTC checks, explicit last successful observation, cached stale evidence on 403/429/timeouts, content changes, newly listed and no-longer-listed documents, and human review flags.
- No AI inference, no grant application, deadline, eligibility or award updates, no account requirements, and no mirroring or scraping of CitizenPortal content.
- First successful scan establishes a baseline. A link no longer indexed might still exist; a blocked fetch is not a missing record. Dynamic JS portals and document links requiring navigation can be missed.

## Open-source repositories evaluated (optional, NOT installed)

| GitHub repository | License / purpose | Recommendation |
|---|---|---|
| https://github.com/dgtlmoon/changedetection.io | Apache-2.0; website changes, selectors, PDF and notifications | Best optional self-hosted watcher for dynamic archives |
| https://github.com/docling-project/docling | MIT; PDF/DOCX/HTML layout and table extraction, local AI document understanding | Preferred second-stage document parser, after approved source acquisition |
| https://github.com/apache/tika | Apache-2.0; broad document format detection, metadata and text | Fallback extraction for unusual attachments |
| https://github.com/Unstructured-IO/unstructured | Apache-2.0; ETL and RAG-friendly document partitioning | Alternative for large multi-format corpora |
| https://github.com/huginn/huginn | MIT; self-hosted event agents and feed watching | Useful after GitHub Actions is insufficient |
| https://github.com/OpenLineage/OpenLineage | Open-source job lineage, traceable data processing | Add later if workloads become distributed |
| https://github.com/datahub-project/datahub | Open-source metadata discovery and governance | Not justified by the initial twelve monitored pages |

Engineering choice: use lightweight stdlib + GitHub Actions and Git commit history now. Do not install large AI/RAG platforms until documents are acquired lawfully, tables/meeting dates are validated, and independently sourced evaluations show that they improve accuracy. If a later AI classifier suggests a project, store exact primary-source link, date, passage, model ID, confidence and human-review state; no machine result may silently become a confirmed award.

## Human review and legal boundaries

Government meeting materials may include official motions, pending resolutions, budgets, contracts, non-final drafts and past records. Their availability does not prove grant submission or receipt. For Kentucky, KRS 61.835 (https://apps.legislature.ky.gov/law/statutes/statute.aspx?id=23051) addresses recording meeting actions and public inspection. The legal rules vary by state and custodian; obtain appropriate review before republication of whole documents. Always preserve county FIPS, source link, date and classification; checked_at is an observation timestamp, not a meeting date.

To run locally: python -m unittest discover -s tests -v ; python scripts/monitor_public_records.py.

## First completed automation run and accuracy repair

The completed initial source check (2026-11-23T12:52:26+00:00) observed 10 reachable archive indexes, one HTTP 403 (Union KY) and one unavailable network result (Gallatin IL); Wabash IL remains without a verified current county-board archive. This is an HTTP/index observation, **not a guarantee that each archive's documents are complete or current**.

The index-size guard limits page reads to 2 MB. A partially downloaded index must never trigger removal or delisting claims for unseen links. The 2026-11-23 reliability test explicitly checks this rule alongside the existing 500-link discovery truncation protection.
