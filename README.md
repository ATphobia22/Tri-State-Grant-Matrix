# Tri-State River Valley Grant Matrix

Free public GitHub Pages portal for nine counties: **IN:** Posey, Vanderburgh, Gibson, Warrick; **IL:** White, Gallatin, Wabash; **KY:** Henderson, Union.

The website at site/index.html hosts a 101-pathway catalog of grants, loans, technical-assistance programs, disaster funds and state allocations, organized by county and public-service department. Each program links to an official agency page and a forms/guidance source. Program listing and county matching do not establish grant eligibility or an open NOFO.

**Site features:** local-only grant application packet generator, Word-compatible .doc, HTML, Markdown and JSON exports, browser print/save-as-PDF, CSV catalog export, local draft save/restore, government link audit statuses and monitored source change reports. No accounts, paywalls or uploads of applicant private documents.

## Setup

1. Repository Settings → Pages → **GitHub Actions** as deployment source.
2. A push to main triggers .github/workflows/pages.yml to test and deploy ./site. Confirm the workflow result and the actual published URL. Intended URL after enabling Pages: https://atphobia22.github.io/Tri-State-Grant-Matrix/ .
3. The official link monitor runs via .github/workflows/monitor.yml on Monday and Thursday UTC, or by manual workflow_dispatch; it checks every distinct program and documentation URL then commits site/data/audit.json.
4. A monitored page content fingerprint change is labeled **REVIEW REQUIRED**. Grant deadlines, eligibility and award amounts are not automatically changed by an HTTP crawler. Government websites can block automated visitors and yield an inconclusive BLOCKED status.

## Verifications and limitations

The original 96 pathways were reconstructed from the uploaded Tri-State Grant System file and extended to 101. The selected deadline and eligibility notes reviewed November 22, 2026 are separate from unreviewed historical program pathways. Current official notices, forms, agency contacts and state subapplication deadlines must be reviewed before applying. FEMA FY2026 FMA federal closing is February 26, 2027, but state pass-through deadlines can be earlier. Indiana OCRA Round 2 final applications require earlier proposal prerequisites. Kentucky CDBG Economic Development page lists March 1, 2027 and Housing lists February 1, 2027.

Word-compatible DOC export is HTML-based, not a native OOXML DOCX. PDF export uses the browser Print / Save as PDF control. The generated application packet does not replace Grants.gov Workspace and official government forms; do not upload private applications into this public GitHub repository.

Tests: `python -m unittest discover -s tests -v`. Run link audit: `python scripts/monitor.py` with network access.

Reference portals: https://www.grants.gov/ · https://sam.gov/ · https://www.in.gov/sba/grants/state-agency-grant-opportunities/ · https://gata.illinois.gov/grants/csfa.html · https://dlg.ky.gov/grants/federal/Pages/default.aspx .
