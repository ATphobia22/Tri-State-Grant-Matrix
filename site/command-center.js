"use strict";
/* User-owned workflow state is local only. Nothing here infers eligibility or a grant award. */
function initCommandCenter(data) {
  const byId = id => document.getElementById(id);
  const STORAGE = "tristate-grant-pipeline-v1";
  const STAGES = ["Prospects", "Pre-Qualification", "Drafting & Engineering", "Submitted"];
  const names = { FED: "Federal", IN: "Indiana", IL: "Illinois", KY: "Kentucky", EVIDENCE: "Supporting data" };
  const byProgram = new Map(data.programs.map(p => [p.id, p]));
  const byCounty = new Map(data.counties.map(c => [c.fips, c]));
  let records = [];
  const note = text => { byId("pipeline-note").textContent = text; };
  const node = (tag, className, value) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (value !== undefined) el.textContent = value;
    return el;
  };
  const currency = cents => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
  const validRecord = r => r && typeof r === "object" && byProgram.has(r.program_id) &&
    byCounty.has(r.county_fips) && STAGES.includes(r.stage) &&
    Array.isArray(r.done) && r.done.every(x => Number.isInteger(x) && x >= 0 && x < 40);
  function loadRecords() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE) || "[]");
      if (!Array.isArray(saved)) throw Error("Stored pipeline is not a list.");
      records = saved.filter(validRecord).map(r => ({
        program_id: r.program_id, county_fips: r.county_fips, stage: r.stage,
        done: [...new Set(r.done)]
      })).slice(0, 300);
      if (records.length !== saved.length) note("Some invalid or outdated local records were ignored. Export a backup before editing.");
    } catch {
      records = [];
      note("Saved pipeline cannot be read; no public grant data was changed. Browser storage may be disabled.");
    }
  }
  function saveRecords() {
    try { localStorage.setItem(STORAGE, JSON.stringify(records)); }
    catch { note("Could not save to this browser. Download your pipeline JSON as a backup."); }
  }
  function docsFor(r) {
    const p = byProgram.get(r.program_id), c = byCounty.get(r.county_fips);
    return checklist(p, c.state);
  }
  function addRecord(programId, countyFips) {
    if (!byProgram.has(programId) || !byCounty.has(countyFips)) {
      note("Select a program AND one of the nine counties before tracking.");
      return false;
    }
    if (records.some(r => r.program_id === programId && r.county_fips === countyFips)) {
      note("This program is already tracked for that county. Open its card to update the checklist.");
      return false;
    }
    records.push({ program_id: programId, county_fips: countyFips, stage: STAGES[0], done: [] });
    saveRecords();
    renderPipeline();
    note("Tracked locally for " + byCounty.get(countyFips).name + " County. No application was submitted.");
    return true;
  }
  function renderPipeline() {
    const board = byId("pipeline-board");
    board.replaceChildren();
    byId("tracked-count").textContent = String(records.length);
    for (const stage of STAGES) {
      const col = node("section", "stage-col");
      const group = records.filter(r => r.stage === stage);
      const head = node("h3", "stage-title", stage + " · " + group.length);
      col.appendChild(head);
      if (!group.length) col.appendChild(node("p", "small", "No locally tracked applications in this stage."));
      for (const r of group) {
        const p = byProgram.get(r.program_id), c = byCounty.get(r.county_fips);
        const docs = docsFor(r), done = r.done.filter(i => i < docs.length);
        const article = node("article", "pipeline-card");
        article.appendChild(node("span", "pill scope-" + p.scope.toLowerCase(), names[p.scope]));
        article.appendChild(node("h4", "", p.name));
        article.appendChild(node("p", "small", c.name + " County, " + c.state + " · " + p.id));
        const progressNote = node("p", "small", done.length + " of " + docs.length + " planning items marked reviewed");
        article.appendChild(progressNote);
        const meter = node("progress", "pipeline-meter");
        meter.max = docs.length || 1;
        meter.value = done.length;
        meter.setAttribute("aria-label", "Personally reviewed checklist items");
        article.appendChild(meter);
        const stageLabel = node("label", "control-label", "My application stage");
        const sel = node("select", "stage-select");
        sel.setAttribute("aria-label", "Application stage for " + p.name + " in " + c.name + " County");
        for (const s of STAGES) sel.appendChild(new Option(s, s));
        sel.value = r.stage;
        sel.addEventListener("change", () => {
          r.stage = sel.value;
          saveRecords(); renderPipeline();
          note("Updated local application stage. This does not change the grant notice.");
        });
        stageLabel.appendChild(sel);
        article.appendChild(stageLabel);
        const details = node("details", "pipeline-details");
        details.appendChild(node("summary", "", "Review optional application checklist"));
        details.appendChild(node("p", "fine", "Planning prompts only; the current NOFO decides requirements. A check means you personally reviewed the item, not agency verification."));
        for (let i = 0; i < docs.length; i++) {
          const label = node("label", "check-item");
          const tick = node("input");
          tick.type = "checkbox";
          tick.checked = r.done.includes(i);
          tick.setAttribute("aria-label", "Mark reviewed: " + docs[i]);
          tick.addEventListener("change", () => {
            r.done = tick.checked ? [...new Set([...r.done, i])].sort((a, b) => a - b) : r.done.filter(x => x !== i);
            saveRecords();
            const reviewed = r.done.filter(j => j < docs.length).length;
            progressNote.textContent = reviewed + " of " + docs.length + " planning items marked reviewed";
            meter.value = reviewed;
            note("Checklist updated locally; verify official requirements independently.");
          });
          label.appendChild(tick);
          label.appendChild(node("span", "", docs[i]));
          details.appendChild(label);
        }
        article.appendChild(details);
        const actions = node("div", "card-actions");
        const draft = node("button", "action", "Prepare draft");
        draft.type = "button";
        draft.addEventListener("click", () => {
          byId("doc-program").value = p.id;
          byId("doc-county").value = c.fips;
          changeTab("draft");
          createDraft();
        });
        const remove = node("button", "action subtle", "Remove");
        remove.type = "button";
        remove.addEventListener("click", () => {
          if (window.confirm && !window.confirm("Remove this locally tracked item and its checkmarks?")) return;
          records = records.filter(x => x !== r);
          saveRecords(); renderPipeline();
          note("Local application tracking entry removed.");
        });
        actions.append(draft, remove);
        article.appendChild(actions);
        col.appendChild(article);
      }
      board.appendChild(col);
    }
  }
  for (const c of data.counties) byId("pipeline-county").appendChild(new Option(c.name + " County, " + c.state, c.fips));
  for (const p of [...data.programs].sort((a, b) => a.name.localeCompare(b.name))) {
    byId("pipeline-program").appendChild(new Option(p.name + " (" + p.scope + ")", p.id));
  }
  byId("pipeline-add").addEventListener("click", () => addRecord(byId("pipeline-program").value, byId("pipeline-county").value));
  byId("pipeline-export").addEventListener("click", () => {
    const payload = { schema: "tristate.local-pipeline.v1", exported_at: new Date().toISOString(), notice: "Local planning records only; no agency validation or application submission.", records };
    download(JSON.stringify(payload, null, 2), "Tri-State-Local-Grant-Pipeline.json", "application/json");
    note("Exported your local planning records. Keep the file private if it contains sensitive information.");
  });
  window.selectPipelineProgram = id => {
    byId("pipeline-program").value = id;
    const chosen = byId("county").value;
    if (chosen) byId("pipeline-county").value = chosen;
    changeTab("pipeline");
    note(chosen ? "Confirm the selected county and select Track this program." : "Select the relevant county, then select Track this program.");
    byId("pipeline-county").focus();
  };
  loadRecords();
  renderPipeline();

  const evidenceLabels = new Set([
    "FEMA flood maps", "HUD low-to-moderate income block-group data — official data.gov entry",
    "USDA rural eligibility mapping", "USGS water information", "EPA ECHO environmental compliance"
  ]);
  const sourceGroup = r => {
    if (evidenceLabels.has(r.label)) return "EVIDENCE";
    if (r.label.startsWith("Indiana")) return "IN";
    if (r.label.startsWith("Illinois")) return "IL";
    if (r.label.startsWith("Kentucky")) return "KY";
    return "FED";
  };
  function renderDirectory() {
    const q = byId("portal-q").value.trim().toLowerCase(), group = byId("portal-scope").value;
    const list = data.resources.filter(r => (!group || sourceGroup(r) === group) &&
      (!q || (r.label + " " + r.url).toLowerCase().includes(q)));
    byId("portal-count").textContent = list.length + " official resource links shown of " + data.resources.length;
    const box = byId("portal-grid");
    box.replaceChildren();
    for (const r of list) {
      const scope = sourceGroup(r), link = new URL(r.url);
      const article = node("article", "portal-card");
      article.appendChild(node("span", "pill scope-" + scope.toLowerCase(), names[scope]));
      article.appendChild(node("h3", "", r.label));
      article.appendChild(node("p", "portal-domain", link.hostname));
      const state = audit && audit.links ? audit.links[r.url] : null;
      article.appendChild(node("p", "small", state ? "HTTP probe: " + state.status + " · " + (state.checked_at || "").slice(0, 10) : "No HTTP probe on record"));
      const a = node("a", "action primary", "Open official source");
      a.href = r.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      article.appendChild(a);
      box.appendChild(article);
    }
  }
  byId("portal-q").addEventListener("input", renderDirectory);
  byId("portal-scope").addEventListener("change", renderDirectory);
  window.renderPortalDirectory = renderDirectory;
  renderDirectory();

  const cash = id => byId(id);
  function updateMatch() {
    const totalRaw = cash("match-total").value.trim();
    const federalRaw = cash("match-federal").value.trim();
    const stateRaw = cash("match-state").value.trim();
    const total = Number(totalRaw), federal = Number(federalRaw), state = Number(stateRaw);
    const valid = totalRaw !== "" && federalRaw !== "" && stateRaw !== "" &&
      Number.isFinite(total) && total > 0 && total <= 1e12 &&
      Number.isFinite(federal) && federal >= 0 && federal <= 100 &&
      Number.isFinite(state) && state >= 0 && state <= 100 &&
      federal + state <= 100;
    if (!valid) {
      cash("match-error").textContent = "Enter a positive project cost (up to $1 trillion), federal/state shares from 0% to 100%, and a combined share no greater than 100%.";
      for (const id of ["match-fed-value", "match-state-value", "match-local-value"]) cash(id).textContent = "—";
      for (const id of ["match-fed-bar", "match-state-bar", "match-local-bar"]) cash(id).style.width = "0%";
      return;
    }
    const cents = Math.round(total * 100);
    const f = Math.round(cents * federal / 100);
    const s = Math.min(Math.round(cents * state / 100), cents - f);
    const local = cents - f - s;
    cash("match-error").textContent = "Scenario only — verify match eligibility, source restrictions and award terms in the current NOFO.";
    cash("match-fed-value").textContent = currency(f);
    cash("match-state-value").textContent = currency(s);
    cash("match-local-value").textContent = currency(local);
    cash("match-fed-bar").style.width = federal + "%";
    cash("match-state-bar").style.width = state + "%";
    cash("match-local-bar").style.width = (100 - federal - state) + "%";
    cash("match-local-pct").textContent = (Math.round((100 - federal - state) * 100) / 100) + "%";
  }
  for (const id of ["match-total", "match-federal", "match-state"]) cash(id).addEventListener("input", updateMatch);
  cash("match-reset").addEventListener("click", () => {
    cash("match-total").value = "1000000";
    cash("match-federal").value = "75";
    cash("match-state").value = "0";
    updateMatch();
  });
  updateMatch();
}
