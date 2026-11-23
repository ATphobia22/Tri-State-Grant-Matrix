# Tri-State River Valley Grant Matrix

**A free, public grant-research and project-preparation resource for the Ohio–Wabash River Valley communities of Indiana, Illinois, and Kentucky.**

**[OPEN THE GRANT MATRIX](https://atphobia22.github.io/Tri-State-Grant-Matrix/)** · [See official source checks](https://atphobia22.github.io/Tri-State-Grant-Matrix/data/audit.json) · [Browse county meeting sources](https://atphobia22.github.io/Tri-State-Grant-Matrix/#records) · [Check database status](https://tri-state-grants-api.atphobia22.workers.dev/readyz)

> **Plain-language summary:** The Grant Matrix helps a city, county, township, water utility, fire department, nonprofit, or resident **find possible funding programs, reach the government agencies responsible for them, organize project information, estimate possible local matching costs, and follow published-source changes**. It is a research and planning tool—not a grant application service, an official government portal, a list of guaranteed awards, or a determination that an applicant qualifies.

**Public access:** No visitor account, subscription, or paywall. Designed for phones, tablets, and computers. The source code is available under this repository's [GNU GPL version 3 license](LICENSE). Government agency documents and data remain subject to their own terms.

## At a glance

| What the system provides | Current scope |
| --- | --- |
| Geographic coverage | **9 counties** across Indiana, Illinois, and Kentucky |
| Curated catalog | **101 funding pathways** (programs, grants, loans, subsidies, and related financing routes), **not** 101 confirmed open competitions |
| Official and supporting source directory | **23** links to funding, registration, application guidance, and evidence resources |
| Public meeting source register | **14** county-linked source entries: **12** monitored official/delegated indexes and **2** Wabash County, IL reference-only sources |
| Public website | [GitHub Pages](https://atphobia22.github.io/Tri-State-Grant-Matrix/) |
| Live backend | [Cloudflare Worker + D1 database](https://tri-state-grants-api.atphobia22.workers.dev/readyz), with a static-data fallback |
| Source review | Scheduled daily grant-link and county-archive audits, dated observations, and review flags |
| Personal project work | Browser-local application tracker, planning checklist, draft document generator, cost-share scenario calculator, and exports |

**Verified service milestone (November 23, 2026):** The public Cloudflare API returned `status: ready` with **9 counties and 101 programs**, and the updated GitHub Pages frontend was published successfully. These numbers demonstrate database coverage; they **do not verify the current status or eligibility of every funding program**. For the current status, open the live links above.

## Who can use it—and for what?

| Community user | Example use |
| --- | --- |
| **City and town officials** | Research water, streets, stormwater, housing, parks, public facilities, or revitalization funding before proposing a budget or resolution |
| **County commissioners, councils, and staff** | Find regional and federal funding routes, official program instructions, and public meeting source records |
| **Townships, special districts, and utilities** | Prepare a project description, develop a preliminary cost-share scenario, and collect possible required-document prompts |
| **Fire, EMS, law-enforcement, and emergency-management agencies** | Explore public-safety, equipment, infrastructure, resilience, and emergency-related programs; confirm agency-specific applicant rules |
| **Planning, GIS, public works, and engineering teams** | Identify programs where maps, benefit populations, engineering reports, flood data, or environmental documentation may be relevant |
| **Local nonprofits and community groups** | Search potential funding routes and prepare a preliminary proposal narrative; verify nonprofit eligibility in each official notice |
| **Residents and community advocates** | Learn where public entities can research potential financing and consult source-linked public meeting records |

A program appearing for a county means it is **geographically relevant to research**. It does *not* mean every municipality, township, utility, department, nonprofit, or person in that county is an eligible applicant.

## The nine-county service area

| State | County | County FIPS | Examples of communities |
| --- | --- | --- | --- |
| Indiana | **Posey** | `18129` | Mount Vernon, New Harmony, Cynthiana, Griffin |
| Indiana | **Vanderburgh** | `18163` | Evansville, Darmstadt |
| Indiana | **Gibson** | `18051` | Princeton, Fort Branch, Owensville, Oakland City |
| Indiana | **Warrick** | `18173` | Boonville, Newburgh, Chandler, Elberfeld |
| Illinois | **White** | `17193` | Carmi, Norris City, Grayville |
| Illinois | **Wabash** | `17185` | Mount Carmel, Allendale, Bellmont |
| Illinois | **Gallatin** | `17059` | Shawneetown, Ridgway, Equality |
| Kentucky | **Henderson** | `21101` | Henderson, Corydon, Robards |
| Kentucky | **Union** | `21225` | Morganfield, Sturgis, Uniontown, Waverly |

The catalog has **40 federal**, **22 Indiana**, **18 Illinois**, and **21 Kentucky** pathways. Broad research categories include flood protection and resilience; drinking water, wastewater, and utilities; roads and transportation; economic development; parks and conservation; fire, EMS, and public safety; housing; community facilities; broadband; health; and planning/GIS. These are catalog classifications, not the administering agencies' official eligibility decisions.

## Start here: how a community can use it

1. **Open the [public website](https://atphobia22.github.io/Tri-State-Grant-Matrix/).** Choose one of the nine counties or leave the county filter open to browse the whole region.
2. Select **Find grants**, then search for a need such as “culvert,” “wastewater,” “fire,” or “community facilities.” Narrow by department/purpose, funding stage, or federal/state jurisdiction.
3. Open **Official program** and **Forms & guidance** for a candidate program. Check the *actual agency notice*, applicant type, deadline (including any earlier state preapplication date), eligible costs, local match, and required registrations.
4. If it is worth investigating, select **Track for a county**. Use **My pipeline** to make your own planning list and mark possible documents as reviewed.
5. Open **Cost-share model** for an illustrative funding split. Then use **Document generator** for a first draft of the problem statement, scope, outcomes, budget, and evidence gaps.
6. **Export** your draft, pipeline, or filtered grant list, and take it to the applicant's clerk, finance officer, project manager, grant administrator, governing board, or other qualified reviewer.
7. **Apply through the awarding agency's official system.** The Grant Matrix does not transmit grant applications, make board approvals, or file agency forms.

**Example:** A Posey County utility researching a pump-station improvement could filter for Indiana/federal water funding, compare agency requirements, build a *hypothetical* funding split, draft a project narrative, and export a checklist. It must still obtain the governing notice, current financing terms, engineering estimates, and any required public authorization.

## Website features: every major page and control

| Page or feature | What it actually does |
| --- | --- |
| **Find grants** | Shows funding-pathway cards with program title, jurisdiction, purpose, status text, published deadline where recorded, official links, and available source-review context |
| **County selector** | Filters the research list to federal and the selected county's state pathways; **not** a legal applicant-eligibility engine |
| **Search, department/purpose, funding stage, jurisdiction** | Narrow the 101-pathway catalog; **Clear filters** resets the search and filters |
| **Show more grants** | Loads additional cards in groups of 24; **Export filtered grant matrix (CSV)** downloads the current selection |
| **Official program / Forms & guidance** | Opens agency pages in the same browser tab; source URLs are exposed for copying if mobile browsers block navigation |
| **My pipeline** | Tracks a selected program **and county** through **Prospects → Pre-Qualification → Drafting & Engineering → Submitted**; these are user-managed labels, **not** government application statuses |
| **Pipeline checklists and progress** | Let a person mark suggested planning documents reviewed; checklist items are examples, not verified mandatory forms |
| **Remove / Prepare draft / Export my pipeline (JSON)** | Manage personal tracked records, open a preliminary application draft, or download a private backup |
| **Source directory** | Searches 23 official and supporting portal/resource links by keyword and category, displaying source addresses and available HTTP checks |
| **Forms & resources** | Explains common **entity/governance**, **financial/matching**, and **project/engineering** documentation; links to official registration, forms, and evidence sources |
| **Document generator** | Creates an editable project-preparation packet from entered applicant, project, financial, schedule, outcomes, and supporting-evidence fields |
| **Save draft / Load saved draft / Clear form** | Saves or retrieves the draft **only in the current browser**, or clears the visible form |
| **Document export** | Downloads **Word-compatible `.doc` (HTML content, not native `.docx`)**, HTML, Markdown, or JSON; **Print / Save as PDF** uses the browser print dialog |
| **Cost-share model** | Estimates federal, state, and remaining local/other shares from a total project cost and percentages entered by the user |
| **Public meeting records** | Lists the nine county source registers, available official archive links, index-page observations, and document-link candidates |
| **Reload committed records snapshot** | Reloads published county archive observations; it does **not** directly crawl agency sites from the visitor's phone |
| **Live federal opportunity search** | Displays an indexed Grants.gov search snapshot for four research topics; it is **not a guarantee of live agency availability or applicant eligibility** |
| **Source updates / Reload published results** | Reports latest published link checks, changed pages, unreachable/blocked sources, and review flags |
| **Export link audit JSON** | Downloads the published technical source-check evidence for independent examination |
| **View and run update workflow** | Links to the repository's scheduled audit workflow; manually running GitHub Actions requires appropriate repository permissions |

### What goes into a draft packet?

The browser form accepts a county, program, applicant legal name and organization type, project title and service location, estimated cost, requested award, local match, timeline, statement of need, scope of work, measurable outcomes, and source evidence or uncertainties. It produces a preliminary planning document that can be edited or printed.

It **does not** create a verified federal SF-424 package, replace agency certifications, upload attachments to an agency, digitally sign forms, or submit a grant application.

### How the cost-share calculator works

Enter a project total and proposed federal/state percentages. The tool calculates the remaining portion:

`Local or other amount = Total project cost − Federal share − State share`

For an **illustrative** $1,000,000 project with 75% federal and 0% state funding, the displayed remainder is **$250,000 (25%)**. These are example inputs, **not** a promised federal rate, award, or approved local match. The calculator checks that percentages are within 0–100%, their combined share does not exceed 100%, and the three dollar results reconcile to cents. Actual agency rules may prohibit certain match sources, in-kind contributions, expenses, or combinations of programs.

## Official sources and public meeting records

The source directory includes gateways such as:

- [Grants.gov](https://www.grants.gov/) and [Simpler.Grants.gov](https://simpler.grants.gov/search) — federal grant notices and searches.
- [SAM.gov](https://sam.gov/) — federal entity registration and assistance listings.
- [Indiana OCRA](https://www.in.gov/ocra/) and [Indiana grant opportunities](https://www.in.gov/sba/grants/state-agency-grant-opportunities/) — relevant state-program information.
- [Illinois GATA](https://gata.illinois.gov/) — Illinois grant accountability and assistance resources.
- [Kentucky Department for Local Government](https://dlg.ky.gov/) — Kentucky local-government programs.
- [FEMA Map Service Center](https://msc.fema.gov/portal/home), [USGS Water Data](https://waterdata.usgs.gov/), [USDA eligibility](https://eligibility.sc.egov.usda.gov/eligibility/), and [EPA ECHO](https://echo.epa.gov/) — examples of supporting evidence sources.

The **Public meeting records** area maintains **14 source entries** associated with the nine counties. Twelve official or explicitly delegated archive/index pages are monitored, while two Wabash County, Illinois references are correctly labeled as **historical state records** or **Mount Carmel municipal records**, **not** a verified current Wabash County board archive. Eight of the nine counties have an identified current official or delegated archive; the Wabash, Illinois county-board archive remains a documented research gap.

The index monitor may show links to agendas, minutes, or attachments. It **does not** download and validate every underlying PDF/Word attachment, establish that a meeting action was legally adopted, or interpret a proposal as an approved grant award. [Read the county-source methods and gaps](docs/public-records.md).

## How the daily updates and audits work

**Important distinction:** The automated service checks *sources*, not every legal condition inside every solicitation. Catalog entries are **not automatically rewritten** when an external page changes.

| Process | Scheduled time (UTC) | Output and limitation |
| --- | --- | --- |
| **Grant source audit** | **13:15 daily** | Checks catalog and resource URLs, HTTP access, timestamps, and source-content fingerprints; publishes [`audit.json`](site/data/audit.json) and review flags |
| **Federal opportunity snapshot** | With the grant audit | Runs fixed Grants.gov Search2 topics (**flood mitigation, water infrastructure, community facilities, rural broadband**); retains last successful results in [`discovery.json`](site/data/discovery.json) |
| **County meeting index audit** | **13:45 daily** | Checks 12 approved archive/index URLs, detects listed-link and index-content changes, records access problems; publishes [`public-records-audit.json`](site/data/public-records-audit.json) |
| **Cloudflare D1 audit import** | **15:30 daily** | The Worker reads the *published* grant and county snapshots and stores timestamped, deduplicated source-check receipts in D1 |
| **Public site publishing** | Following approved `main` updates / successful monitor runs | GitHub Actions tests the public interface and publishes the `site/` directory to GitHub Pages |

UTC is used for reproducible records; the local clock time in Indiana/Kentucky/Illinois may shift with daylight saving time. Scheduled jobs can fail or run late. Check the actual **last-run timestamp**, not the schedule alone.

Source-monitor signals mean:

| Indicator | Interpretation |
| --- | --- |
| **REACHABLE** | The automated URL request received a successful response. **Not** proof that a grant is open or that a county is eligible |
| **BLOCKED / ACCESS_RESTRICTED** | The server or protective service rejected automated access, such as HTTP 403. A person might still open the page |
| **UNAVAILABLE** | This check could not retrieve the page; an outage, timeout, or scanner restriction is possible |
| **MISSING / LINK_PROBLEM** | A link returned not-found information or needs manual investigation |
| **CONTENT_CHANGED_REVIEW_REQUIRED** | A source fingerprint changed; a human must determine whether *substantive* program rules changed |
| **Stale / last known** | Earlier successful observations are retained and must not be confused with a fresh check |

The grant monitor can hash successfully retrieved PDF content and normalized page text. The county-record monitor hashes **index pages and observed document URL lists**, not the downloaded bodies of all referenced attachments. Hashes support *change detection and provenance*, not legal interpretation.

**A review flag is a lead, not a factual finding that a grant was awarded, a deadline moved, or a county meeting approved funding.** The official agency notice and the local governing body remain authoritative.

## Current technology and availability

```text
PUBLIC, NO-LOGIN EXPERIENCE
  GitHub Pages — mobile-friendly HTML/CSS/JavaScript
        │
        ├── Live read-only API → Cloudflare Worker → D1 (SQLite) database
        │                               └── county, program, source and audit records
        │
        └── Static source-controlled catalog and snapshots (fallback)
                     ↑
        GitHub Actions: official-source and county index checks
                     │
        Cloudflare daily schedule: imports published audit receipts into D1

PERSONAL WORK (ON EACH USER'S DEVICE)
  Application pipeline + checklist + draft = browser local storage
  JSON / CSV / draft document exports = files downloaded by that user
```

**Currently live:** Public website, populated nine-county Cloudflare D1 catalog, anonymous read-only API, official-source directory, browser-local preparation features, daily GitHub monitoring workflows, published snapshots, and Cloudflare receipt-import schedule. The [API readiness endpoint](https://tri-state-grants-api.atphobia22.workers.dev/readyz) checks database connection and record counts, **not** correctness of every program's terms.

**Database and API reference:** `GET /readyz`; `GET /v1/counties`; `GET /v1/catalog`; `GET /v1/programs` with optional `q`, `county`, `scope`, and `sector` filters; `GET /v1/programs/{id}`; `GET /v1/records`; `GET /v1/audits/latest`; `GET /v1/discover`; `GET /v1/opportunities`; and `GET /v1/evidence/{id}`. The public Worker does not permit catalog modifications by anonymous visitors. [Open a county API example](https://tri-state-grants-api.atphobia22.workers.dev/v1/programs?county=18129).

**Not currently active on the Cloudflare public service:** automatic ingestion of full NOFO PDFs into verified field-by-field grant rules; scanned-document OCR; Qwen/Gemma inference; embedding-based semantic retrieval; a filled D1 federal-opportunities cache; applicant accounts or cross-device draft synchronization; direct government grant submissions; or automatic approval of eligibility, awards, and deadlines. The **federal discovery display uses the dated public snapshot when the D1 discovery table is empty**.

A separate `backend/` implementation provides **FastAPI + PostgreSQL + Docker Compose** as an alternative, with optional AI metadata/evidence modules and vector storage definitions. That code is **not** the public production server. The public service runs under `cloudflare/`; it does not need a GPU or a paid model endpoint. Cloudflare Free quotas and provider availability still apply; free public access is not a guarantee of uninterrupted hosting.

## Privacy, public access, and mobile/offline use

- **No login to browse.** No public application-account database or applicant-identity verification is provided.
- **Drafts and tracked pipeline stages remain in the browser's local storage.** They are not automatically synced between phones, computers, or browsers. Clearing site data or using private browsing can erase them. **Export copies and store them appropriately**.
- The public database contains curated funding metadata and public-source observations, **not confidential application files, bank records, passwords, personal identifiers, or draft project budgets**.
- **Offline fallback:** after the hosted website has successfully installed its service worker and cached the required assets, previously saved public data may be viewable without a connection. This is not a fully self-contained offline installer and cannot refresh official notices without internet service.
- **iPhone/in-app browser links:** government source links open in the same tab to avoid blocked pop-ups. Use **Back** to return. If a site blocks in-app navigation, expand **“Link not opening? Show and copy addresses”** and open the address in Safari or Chrome.
- **Independent government portals may require sign-in**, cookies, credentials, an application account, or agency registration. The Grant Matrix's no-login policy does not override those requirements.

## What this platform does **not** do

It does **not** guarantee grant funding, confirm that 101 competitions are open, confer applicant eligibility, automatically submit forms, certify environmental or engineering reviews, make procurement decisions, approve local budget appropriations, or speak for a government agency. Funding notices can have different **federal deadlines, state subapplication dates, local resolutions, project ranking windows, matching rules, and application-specific conditions**. The official current Notice of Funding Opportunity (**NOFO**) and administering agency's instructions govern.

Reviewers should independently confirm applicant type and service-area qualification, deadlines and time zones, required registrations/UEI/SAM status, governing-body approvals, documented match and eligible costs, procurement and prevailing-wage requirements where applicable, engineering and environmental documentation, and required forms. Do not treat the tool's draft or a review-flag count as legal, accounting, financial, grant-administration, or engineering advice.

## Common questions

**Does a county filter mean our town or township is eligible?** No. It limits the research view to statewide and federal pathways. Each program's notice sets applicant types, geographic thresholds, and other restrictions.

**Is the catalog current?** The live database contains a curated catalog last assembled on November 22, 2026, plus newer *source-access* observations. Automatic technical checks do not update program eligibility or notice terms without review. Use the direct government link and check the latest agency notice.

**Can we apply from this site?** No. It helps prepare research and a draft. Apply on the agency's official portal and keep official confirmation and filing records.

**Can our county office share a draft with another employee?** Use the draft and pipeline export features and follow the office's approved information-security procedures. The current system has no shared-account workspace or automatic synchronization.

**Why does a source say blocked or unavailable when I can open it?** Some government systems restrict automated requests or require browser authentication. A failed automated check is not proof that the public record or program was withdrawn.

**Is it completely free?** Browsing and public tools have no fees or registration. Backend hosting uses Cloudflare's free usage tier and GitHub Pages; provider quotas and future service terms can change. There is no paid inference service required for browsing.

**How can a government office verify what the site displays?** Follow the source links, inspect [dated grant-audit evidence](site/data/audit.json) and [county-audit evidence](site/data/public-records-audit.json), and compare the claim against the original agency NOFO or county record. Report mismatches through the [GitHub issue tracker](https://github.com/ATphobia22/Tri-State-Grant-Matrix/issues) with the source URL and observation date; do not include confidential applicant records.

## For IT staff, developers, and public-sector reviewers

### Where information is stored

| Component | Folder or file | Purpose |
| --- | --- | --- |
| Public interface | [`site/index.html`](site/index.html), `site/command-center.js`, `site/public-records.js`, `site/discovery.js` | Search, tracking, drafts, source directories, archive display, discovery |
| Published public data | [`site/data/catalog.json`](site/data/catalog.json), `audit.json`, `public-record-sources.json`, `public-records-audit.json`, `discovery.json` | Curated catalog and public dated snapshots |
| Cloudflare API | [`cloudflare/src/index.mjs`](cloudflare/src/index.mjs) | Public read-only Worker and scheduled audit importer |
| Cloudflare D1 schema | [`cloudflare/migrations/`](cloudflare/migrations/) | SQLite schema and evidence/source tables |
| Cloudflare setup | [`cloudflare/wrangler.jsonc`](cloudflare/wrangler.jsonc), [deployment instructions](docs/cloudflare-free-deployment.md) | Worker configuration and deployment procedures |
| Grant-source checks | [`scripts/monitor.py`](scripts/monitor.py), [`scripts/discover.py`](scripts/discover.py) | Link status/content fingerprints and indexed Grants.gov topics |
| County-source checks | [`scripts/monitor_public_records.py`](scripts/monitor_public_records.py) | Approved county archive indexes and detected listed links |
| Scheduled automation | [`.github/workflows/`](.github/workflows/) | Grant/records audits, website deployment, frontend/backend tests |
| Alternate server | [`backend/`](backend/), [`compose.yaml`](compose.yaml) | Optional Docker/FastAPI/PostgreSQL code, not the live Cloudflare backend |
| AI evaluation | [`docs/ai-tooling-evaluation.md`](docs/ai-tooling-evaluation.md) | Investigated optional open-source models and document tools; no claims of installed inference |

### Tests and local review

```bash
# Frontend behavior, controls, same-tab external links and fallback configuration
node --test tests/test_frontend.mjs

# Nine-county scope, grants metadata, source registry and monitoring checks
python -m unittest discover -s tests -v

# Cloudflare Worker/D1 test suite (Node.js 22+, SQLite support)
node --test cloudflare/tests/*.test.mjs

# Local website inspection (from repository root)
python -m http.server 8000 --directory site
# Visit http://localhost:8000/
```

GitHub Actions tests the relevant changes before publishing. Cloudflare Git integration deploys the Worker separately. **A green test or successful deploy is not a substitute for checking the public URL and actual data returned by the government sources.** See [GitHub Actions](https://github.com/ATphobia22/Tri-State-Grant-Matrix/actions) and [the API readiness response](https://tri-state-grants-api.atphobia22.workers.dev/readyz).

### Review, corrections, and reuse

This is an **independent, public-interest community tool**, not a product of FEMA, Grants.gov, the State of Indiana, Illinois, Kentucky, or the counties named above. Public-source references are attributed; each agency retains authority over its own program. Software reuse is governed by the repository's [GPL-3.0 license](LICENSE); it does not transfer rights in external government or third-party documents.

To suggest a correction, [open an issue](https://github.com/ATphobia22/Tri-State-Grant-Matrix/issues) with the county, program ID if available, official URL, publication date, what is incorrect, and the suggested revision. **Never include grant applicant passwords, confidential financial records, personal information, or private applications in a public issue.** Corrections to source-linked factual fields should be reviewed against authoritative evidence before they enter the curated catalog.

---

**Operating principle: Government agencies and elected or authorized officials make the decisions. This software organizes public information so communities can research, prepare, document, and ask better questions.**
