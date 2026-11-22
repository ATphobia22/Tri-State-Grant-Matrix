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

Then open **http://localhost:8000/**. The static site requires no account, server database, or external JavaScript framework.

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
| **Official program / Forms & guidance** | Opens source links in a separate tab. The actual notice and instructions control eligibility and required documents. |
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

[Source-audit workflow](https://github.com/ATphobia22/Tri-State-Grant-Matrix/actions/workflows/monitor.yml) runs on Mondays and Thursdays and can also be started manually. It monitors source URLs, response status, and page-content fingerprints, writing `site/data/audit.json`. The app can read cached catalog and audit data offline **after successful service-worker installation while hosted on HTTPS**. The audit reload uses the same URL as the offline cache. The command center CSS and JavaScript are also precached. Direct `file://` use is not supported as a full offline application.

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
