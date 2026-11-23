# Tri-State River Valley Grant Matrix

**Find public funding. Organize a local project. Prepare for an application.**

A **free, public grant-research and project-planning website** for local governments, public-service organizations, and communities in the Ohio–Wabash tri-state region of **Indiana, Illinois, and Kentucky**.

**[Open the Grant Matrix](https://atphobia22.github.io/Tri-State-Grant-Matrix/)** · [Check the public database](https://tri-state-grants-api.atphobia22.workers.dev/readyz) · [Report an error or suggest a source](https://github.com/ATphobia22/Tri-State-Grant-Matrix/issues)

> **Important:** This is an independent **information and application-preparation tool**, **not** a government grant agency, grant award database, application-submission portal, eligibility certification, or promise of funding. Always rely on the current official agency notice and application system.

## What is this, in plain language?

Local governments often have to search several federal and state websites to find potential funding for roads, water systems, drainage, emergency services, community buildings, broadband, and other public needs. The Grant Matrix brings **starting points, official links, planning tools, and source-check information into one place**.

A town clerk can research programs; a fire department can organize a possible equipment or facility project; a utility can outline a wastewater proposal; and a county official can review the source documents before discussing a potential application. **Selecting a county or seeing a program listed does not mean that applicant or project qualifies.**

The website is open to the public. **No account, payment, or installation is required to browse.** It works on phones, tablets, and computers. Personal planning drafts and tracked projects stay in the browser unless the user chooses to export them.

### At a glance — published scope, November 23, 2026

| Item | What is available |
| --- | --- |
| Geographic coverage | **9 counties in 3 states**, listed below |
| Funding catalog | **101 curated funding pathways** as of November 22, 2026; not 101 confirmed open competitions |
| Source directory | **23** government and supporting-data portal links |
| Federal opportunity discovery | Saved Grants.gov search results for **4 topics**, dated and refreshed by a scheduled process |
| Public meeting records | Nine county entries; official county meeting archive identified for **8**; Wabash County, Illinois remains a documented gap |
| Public data service | **Cloudflare Worker + D1 database**, live and connected to the website as of November 23, 2026 |
| Resilience | Published static catalog and audits remain the fallback if the live database is unavailable |
| Applicant accounts | **None** for public browsing; local drafts are not uploaded to the public database |
| Price | **Free public access** |

These are inventory counts, **not counts of eligible applicants, active awards, approved projects, or verified current funding opportunities**.

## Communities covered

| State | Counties | Examples of communities served |
| --- | --- | --- |
| **Indiana** | **Posey, Vanderburgh, Gibson, Warrick** | Mount Vernon, New Harmony, Evansville, Princeton, Boonville, Newburgh |
| **Illinois** | **White, Wabash, Gallatin** | Carmi, Mount Carmel, Shawneetown |
| **Kentucky** | **Henderson, Union** | Henderson, Morganfield, Sturgis, Uniontown |

County selection helps show **federal pathways and programs associated with that county's state**. It does not check municipal boundaries, rural eligibility, utility ownership, nonprofit status, census geography, or every program's special conditions. A township, city, county, district, or nonprofit must still verify its own eligibility in the official notice.

## How to use it: a five-minute introduction

1. **Open the [public website](https://atphobia22.github.io/Tri-State-Grant-Matrix/)** and select **Find grants**.
2. **Choose a county**, then search by a need such as flood mitigation, water, fire, transportation, or broadband. Narrow by jurisdiction, department/purpose, or funding stage.
3. **Open Official program and Forms & guidance** on a promising result. Confirm the actual opportunity is open, the applicant is eligible, and the deadline, match, preapplication, and forms are current.
4. Select **Track this program** to add a program/county pair to **My pipeline**, or **Prepare application packet** to start a local project draft.
5. Use the **Cost-share model** to explore a budget, **export** your planning records, and take the official notice and draft to the appropriate local decision-makers. Submit any real application **only through the awarding agency's authorized system**.

**Example:** A municipal water department in Posey County can search for water and wastewater funding, review agency links, create a project need/scope/budget draft, and track preparation. This does **not** determine whether the department meets a program's legal requirements or apply for funding on its behalf.

## Features and functions

The public site has **eight main sections**:

| Section in the website | What it does | Important boundary |
| --- | --- | --- |
| **1. Find grants** | Search the 101-pathway catalog; choose among nine counties; filter by federal/IN/IL/KY jurisdiction, department/purpose, and funding stage; show more cards in groups of 24; view official source and form links; see available status/review details; export the filtered matrix as **CSV**. | A catalog entry may be a continuing program, loan, subsidy, or historical pathway rather than an open grant. |
| **2. My pipeline** | Track a **specific program and county** through **Prospects → Pre-Qualification → Drafting & Engineering → Submitted**; mark optional preparation checklist items reviewed; see progress; prepare a draft; remove an item; export a private **JSON** backup. | These are **user-entered planning stages**, not agency application statuses. Marking “Submitted” does not submit anything. |
| **3. Source directory** | Search/filter 23 government and supporting-data links by jurisdiction/category; see full copyable URLs, domains, and available link-check results. | A reachable website is not proof that its grant is open or that every form works. |
| **4. Forms & resources** | Find links to official registration, application, guidance, compliance, and supporting-data sources; review a general preparation checklist. | This is a reference library, **not** a complete program-specific packet. |
| **5. Document generator** | Enter applicant, county, program, project name/location, costs, requested award, local match, timeline, need, scope, outcomes, and evidence/uncertainties. Generate a draft narrative, budget summary, potential exhibits, and official reference links. Save/load/clear locally; export **Word-compatible .doc, HTML, Markdown, or JSON**; **Print / Save as PDF** through the browser. | Drafts are **not official forms** and are **never automatically filed**. The .doc download contains HTML compatible with Word; it is **not a native .docx** file. |
| **6. Cost-share model** | Enter total project cost and illustrative federal/state percentages; calculate federal, state, and local/other portions, with a visual breakdown and input validation. | This is arithmetic for planning, **not an approved match rate or funding commitment**. |
| **7. Public meeting records** | Browse source directories for all nine counties, open official archive indexes and observed document links, see check dates and source-review flags. | Document links are **candidates**, not verified meeting content, votes, grants, or awards. |
| **8. Source updates** | View dated federal discovery listings, source audit status, and review flags; reload the latest **published** audit data; export audit JSON; open the GitHub Actions workflow. | Reloading a snapshot does **not** start a new live crawl, confirm eligibility, or change an agency deadline. |

### Additional controls and behaviors

- **Search / County / Department / Funding stage / Funding jurisdiction:** combine filters to narrow results; **Clear filters** resets the grant search controls.
- **Track this program:** opens the local pipeline and requires a county selection before creating a tracked entry. The same program can be tracked separately for different counties.
- **Application checklists:** checkboxes record only that **you reviewed** a possible item; actual required exhibits depend on the current Notice of Funding Opportunity (NOFO).
- **Save draft / Load saved draft / Clear form:** use the current browser's storage; export a copy before changing devices or clearing browser data.
- **Export filtered grant matrix (CSV):** includes the currently displayed filter results, not a certification of grant availability.
- **Export my pipeline (JSON):** creates a portable local backup of program/county stages and reviewed checklist items.
- **Export link audit JSON:** makes source observations available for independent review.
- **External official links:** open in the same tab for better compatibility with mobile/in-app browsers; use **Back** to return. Grant cards include **“Link not opening? Show and copy addresses”**. The directory includes the official [Simpler.Grants.gov search](https://simpler.grants.gov/search) as an alternative to classic Grants.gov search.

### What the application-preparation packet includes

The generator provides an **editable starting document**, using fields supplied by the user:

- Applicant legal name and applicant type (for example, city/town, county, township, utility/district, fire/EMS, law enforcement, nonprofit, or other).
- Selected county, funding program and official program links.
- Project title, service area, statement of need, proposed scope of work, measurable outcomes, and schedule.
- Preliminary project cost, requested award, proposed match, source evidence, risks, and unanswered questions.
- A possible-document checklist that **must be reconciled with the current agency instructions**.

**No application is submitted, approved, certified, or reviewed by an awarding agency through this tool.** The exported file must be checked, completed, and transferred into the actual application process by the applicant.

### Cost-share calculator example

The **Restore illustrative example** button sets a **$1,000,000 project**, **75% federal**, and **0% state**. The resulting **$250,000 local/other remainder** is **illustrative only**. Actual federal/state shares, eligible match sources, in-kind contributions, caps, and committed funds are determined by the specific notice and governing authorities. Invalid inputs produce a warning, and valid calculations reconcile to whole cents.

## Funding information: what each label means

| Term | Meaning |
| --- | --- |
| **Funding pathway / program** | An agency program or potential route to support. It may be a grant, loan, subsidy, or other assistance; it may have **no current competition**. |
| **Open opportunity / NOFO** | A specific official solicitation with applicant rules, a submission method, dates, and required materials. Check the current original notice. |
| **Program status** | A catalog description or review note, not a binding agency decision. |
| **Reviewed / checked date** | When a particular catalog detail or source was last examined; it is not proof that all fields remain current. |
| **HTTP reachable / blocked / unavailable** | Technical observations about accessing a web address. They do not establish eligibility, funding, record completeness, or legal validity. |
| **Source change / hash** | Evidence that monitored page content or a set of observed links may have changed; a human must interpret what changed. |
| **County match** | Geographic/state catalog filtering, **not** a determination of eligibility for a city, township, utility, or nonprofit. |
| **Pipeline stage** | The user's private planning label, **not** a status from Grants.gov or a state portal. |

Before budgeting or filing, check the **current official notice** for the applicant category, service area, eligible expenses, registration requirements, preapplication and final deadlines (including time zone), match rate and source restrictions, procurement, engineering/environmental reviews, reporting, and award conditions. A program's final application deadline may still be listed after an earlier **mandatory proposal gate** has closed.

## County public meeting archives

The **Public meeting records** section helps officials and residents locate original local-government records rather than relying on summaries. It is a **source index**, not a complete or certified archive of meetings.

| County | Source coverage in the current registry |
| --- | --- |
| Posey, IN | Official county meeting source(s) identified |
| Vanderburgh, IN | Official/delegated meeting source identified |
| Gibson, IN | Official county meeting source(s) identified |
| Warrick, IN | Official/delegated meeting source(s) identified |
| White, IL | Official county meeting source(s) identified |
| **Wabash, IL** | **Official county-board meeting archive not yet located**; state archives and Mount Carmel municipal sources are labeled **reference only**, not substituted |
| Gallatin, IL | Official county board source identified |
| Henderson, KY | Official fiscal court source identified |
| Union, KY | Official fiscal court source identified |

The registry contains **12 monitored official/delegated source indexes** across the eight counties with identified archives, plus reference-only links for Wabash, Illinois. A monitor checks source-index availability and observed document URLs, with timestamps and SHA-256 fingerprints. It does **not** download and authenticate every PDF/DOCX attachment, confirm a vote, or conclude that a grant was approved. HTTP 403 and network failures are reported as access limitations, not fabricated missing records. The website displays up to the first **20 observed document links per source**, when available.

See [official source inventory](site/data/public-record-sources.json), [latest county record observations](site/data/public-records-audit.json), and [public-records methodology](docs/public-records.md).

## Where the data comes from, and how it updates

The catalog points users to **original federal and state agency sources**, such as [Grants.gov](https://www.grants.gov/), [SAM.gov](https://sam.gov/), [Indiana state grant opportunities](https://www.in.gov/sba/grants/state-agency-grant-opportunities/), [Illinois GATA](https://gata.illinois.gov/grants/csfa.html), and [Kentucky Department for Local Government](https://dlg.ky.gov/grants/federal/Pages/default.aspx). The directory also includes program agencies and supporting-data portals. **The agencies, not this website, determine program rules and awards.**

| Data/process | What currently happens | Typical schedule (UTC) |
| --- | --- | --- |
| **Curated catalog** | Source-controlled 101-pathway catalog is published on GitHub Pages and seeded into Cloudflare D1. Material program terms are **not silently rewritten** by link checks. | Editorial updates when reviewed |
| **Grant link audit** | Checks catalog/resource URLs and records HTTP observations, dates, and page fingerprints; publishes **site/data/audit.json**. | GitHub Actions **daily 13:15** |
| **Federal discovery** | Server-side Grants.gov discovery produces a **dated saved snapshot** for flood mitigation, water infrastructure, community facilities, and rural broadband. | Included in the **13:15** workflow |
| **County meeting index audit** | Checks the 12 monitored archive indexes, observed document links, hashes, and access errors; publishes **site/data/public-records-audit.json**. | GitHub Actions **daily 13:45** |
| **Cloudflare audit receipt import** | Scheduled Worker reads the two **published** audit snapshots and imports bounded, deduplicated observations into D1. It does **not** re-verify each agency notice. | Worker Cron **daily 15:30** |
| **Public website visit** | Reads the live **read-only** catalog/audit API when available; falls back to the published static data. | Whenever a visitor opens/reloads the page |

Schedules are **configured times**, not guarantees that GitHub, Cloudflare, or an external agency will respond at that exact minute. Check the **last successful observation time** in the site and the [workflow history](https://github.com/ATphobia22/Tri-State-Grant-Matrix/actions). A change in a monitored page is a **review lead**, not a verified change to an award, deadline, or eligibility rule.

**Federal discovery limitation:** The D1 **/v1/discover** collection was empty at the November 23, 2026 verification. The public interface therefore uses the saved federal discovery snapshot when no D1 opportunities are available. The snapshot is **not a live browser-side Grants.gov search** and may include opportunities that have since changed or closed.

**Do not confuse the two kinds of checking:** A URL audit can confirm a technical response; only the current agency NOFO and related official guidance can confirm applicant and project requirements.

## Privacy, access, and offline behavior

- **Public access:** No public login, paywall, applicant registration, or cloud account is needed to browse this site.
- **Local project information:** Pipeline stages, checklist selections, and saved draft fields are held in **browser local storage**, not in the public D1 catalog. They do not synchronize between devices or constitute an official record.
- **Backups:** Export your draft and pipeline before changing phones, clearing site data, using private browsing, or sharing a device. Keep exports containing applicant details **private**.
- **Do not upload confidential information:** Never post bank records, personal identifiers, nonpublic bids, credentials, protected information, or unsubmitted applications to public GitHub issues or repository files.
- **Offline reading:** After a successful visit over HTTPS and service-worker installation, some published pages and snapshots may remain readable without a network connection. **Live source verification, agency websites, and application submission do not work offline.** Opening the HTML with **file://** is not the supported offline method.
- **Phones and in-app browsers:** Official links open in the same tab. If an embedded browser blocks a government website, use the displayed full URL in Safari or Chrome. Some agency sites require their own authentication, cookies, or JavaScript.
- **Provider infrastructure:** The public website is hosted by GitHub Pages and the read-only API by Cloudflare; normal web requests may be processed under those providers' infrastructure and policies. The app does not offer a private hosted applicant account.

## What is running now — and what is not

| Component | Status as verified November 23, 2026 |
| --- | --- |
| **GitHub Pages public website** | **Deployed** and reachable |
| **Cloudflare Worker + D1 SQLite** | **Live**; **/readyz** returned **ready, 9 counties, 101 programs**; public county, catalog, records, filtered program, and audit endpoints responded |
| **Browser API adapter** | **Connected** to the actual Worker URL with a bounded timeout and static-data fallback |
| **GitHub Actions frontend verification and Pages deployment** | Passed for the Cloudflare-connected release |
| **Scheduled grant and county source audits** | Workflows configured and publishing dated snapshots; availability of external websites varies |
| **Applicant pipeline and draft generator** | Browser-local planning features; no hosted applicant record or submission system |
| **D1 federal opportunity discovery** | **No items** in the verified D1 discovery collection; dated static discovery fallback is used |
| **PostgreSQL / FastAPI / Docker alternative** | **Repository code and tests**, **not a separately verified public production deployment** |
| **Optional AI/model metadata and vector tools** | Research/optional backend code only; **not a deployed grant-eligibility AI**, not installed large model weights, and not an automatic legal or financial reviewer |

This distinction matters: **working source code, a successful test, and a deployed public service are different forms of evidence**. The website should never imply that an optional component is live merely because its files exist.

## Public API and technical overview

The website is lightweight HTML, CSS, and JavaScript served by **GitHub Pages**. Its API client reads a public **Cloudflare Worker** backed by **D1 SQLite**, with local static snapshots for resilience. The browser-local planning tools do **not** send draft applications to D1.

**[API readiness](https://tri-state-grants-api.atphobia22.workers.dev/readyz)** · [Public catalog](https://tri-state-grants-api.atphobia22.workers.dev/v1/catalog) · [County records index](https://tri-state-grants-api.atphobia22.workers.dev/v1/records)

| Read-only endpoint | Purpose |
| --- | --- |
| **GET /healthz** | Worker process health |
| **GET /readyz** | D1 seed/readiness counts |
| **GET /v1/counties** | Nine county FIPS identifiers and communities |
| **GET /v1/catalog** | Full curated catalog and resource links |
| **GET /v1/programs** | Filterable, paginated program list (including county, scope, sector, and search text) |
| **GET /v1/programs/{id}** | One program record |
| **GET /v1/records** | Official/delegated county source registry |
| **GET /v1/opportunities** and **GET /v1/discover** | Saved federal discovery records, if ingested |
| **GET /v1/audits/latest** | Dated imported source-check observations |
| **GET /v1/evidence/{id}** | Staged evidence claims, if present; **not eligibility determinations** |

The public Worker exposes **read-only HTTP methods**; it does not accept applicant drafts or public edits to awards, deadlines, or eligibility. The API is **not** a general-purpose replacement for federal or state application portals.

### Repository guide

| Location | Purpose |
| --- | --- |
| **site/index.html** | Public pages, filters, application-preparation form, exports |
| **site/command-center.js** | Browser-local pipeline, official-source directory, cost-share model |
| **site/public-records.js** | County archive source display |
| **site/discovery.js** | Dated federal opportunity display and fallback |
| **site/backend-client.js** and **site/data/backend.json** | Cloudflare API adapter and public endpoint configuration |
| **site/data/catalog.json** | Curated nine-county catalog, 101 pathways, 23 source links |
| **site/data/audit.json** and **site/data/public-records-audit.json** | Dated published observations |
| **site/service-worker.js** | Offline snapshot caching |
| **cloudflare/** | Live Worker implementation, D1 schema/seed scripts, tests and Wrangler config |
| **scripts/** | Grant-link, federal-discovery, and county archive monitors |
| **backend/** and **compose.yaml** | Separate optional FastAPI/PostgreSQL deployment |
| **tests/** | Frontend, catalog, source registry and configuration regression tests |
| **.github/workflows/** | CI, Pages deployment, audit schedules, Cloudflare checks |

### Run and test locally

From the repository root, with Python 3 and Node.js installed:

```bash
python -m http.server 8000 --directory site
```

Open **http://localhost:8000/**. Serving over HTTP is important: directly opening **site/index.html** using **file://** is not equivalent to a hosted site.

```bash
node --test tests/test_frontend.mjs
python -m unittest discover -s tests -v
node --test cloudflare/tests/*.test.mjs
```

The Pages workflow runs frontend and Python tests before deployment. Tests verify program structure and local logic; they **cannot guarantee** every third-party link or mobile browser works. Review [Pages deployment](.github/workflows/pages.yml), [frontend checks](.github/workflows/site-smoke.yml), [grant link monitoring](.github/workflows/monitor.yml), [county archive monitoring](.github/workflows/public-records.yml), and [Cloudflare checks](.github/workflows/cloudflare.yml).

For operators: [Cloudflare deployment and maintenance notes](docs/cloudflare-free-deployment.md), [PostgreSQL alternative](backend/README.md), [public records methodology](docs/public-records.md), and [optional AI tooling evaluation](docs/ai-tooling-evaluation.md). Some older setup notes describe the **pre-deployment** state; the **“What is running now”** section above is the current release baseline.

## For local officials: recommended review process

1. Define the **public need**, service area, responsible agency, project ownership, and intended beneficiaries.
2. Search the matrix and record the **program ID, agency, official URL, notice date, and review date**.
3. Open the actual **NOFO** and verify eligibility, preapplication requirements, cost share, allowable costs, procurement rules, and every deadline.
4. Gather source-backed evidence (for example, engineering reports, utility plans, budgets, maps, service statistics, or adopted plans) as required by the **specific** program.
5. Use **My pipeline**, the draft generator, and cost-share model to prepare an **internal working packet**; retain local copies.
6. Obtain any required **council, board, fiscal court, district, or authorized-official approvals** through the normal public process.
7. Submit through the **agency's official application system** and separately retain the actual confirmation/receipt.

A municipality may use the site for research and internal coordination; it should **not** treat the website's local “Submitted” label, source audit, or generated draft as proof of an agency filing.

## Questions, corrections, and community contributions

**See a broken link, missing county source, incorrect deadline, or a newly published official notice?** [Open a GitHub issue](https://github.com/ATphobia22/Tri-State-Grant-Matrix/issues) with the **program/source name, official agency URL, date observed, county/state, and what appears incorrect**. Please do not include personal applicant data or confidential documents. A correction should be supported by the original agency source; an automated HTTP result alone is not sufficient.

**Frequently asked questions**

- **Does it apply for a grant for me?** No. It helps research, organize, and draft. Applications must go to the official agency.
- **Are all 101 programs open right now?** No. They are funding pathways, and some may not have an active competition.
- **Does choosing my county mean I qualify?** No. It filters by geography/state; official eligibility rules still apply.
- **Are county meeting records complete?** No. Eight county archives are identified, Wabash County, Illinois is a documented gap, and attachment contents are not comprehensively verified.
- **Will it automatically update when I open it?** It reads the latest available database or published snapshot. **Source crawls occur on scheduled workflows**, not as an unrestricted crawl initiated by every visitor.
- **Can I use it without internet?** Some previously cached content may work after an online visit; live official sources and applications require internet.
- **Can I use it on my phone?** Yes. If a government site blocks an embedded browser, copy its displayed URL into Safari or Chrome.
- **Is it a government website?** No. It links to government sources but is independently operated.

## License and public-interest boundaries

The repository includes the **[GNU General Public License, version 3](LICENSE)**. Official government websites, linked documents, third-party data, and external services retain their own terms and attribution requirements; a link here does not relicense their content.

**Bottom line:** The Tri-State River Valley Grant Matrix helps communities **find potential funding, prepare better-informed project materials, and review original sources**. **Local officials and awarding agencies retain responsibility for eligibility, approvals, submissions, and funding decisions.**
