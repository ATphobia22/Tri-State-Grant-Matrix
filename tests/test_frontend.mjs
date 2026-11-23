import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import vm from "node:vm";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const page = readFileSync(resolve(root, "site/index.html"), "utf8");
const catalog = JSON.parse(readFileSync(resolve(root, "site/data/catalog.json"), "utf8"));
const audit = JSON.parse(readFileSync(resolve(root, "site/data/audit.json"), "utf8"));
const serviceWorker = readFileSync(resolve(root, "site/service-worker.js"), "utf8");
const commandSource = readFileSync(resolve(root, "site/command-center.js"), "utf8");
const commandCss = readFileSync(resolve(root, "site/command-center.css"), "utf8");
const recordRegistry = JSON.parse(readFileSync(resolve(root, "site/data/public-record-sources.json"), "utf8"));
const recordAudit = JSON.parse(readFileSync(resolve(root, "site/data/public-records-audit.json"), "utf8"));
const recordSource = readFileSync(resolve(root, "site/public-records.js"), "utf8");
new vm.Script(recordSource, { filename: "site/public-records.js" });
new vm.Script(commandSource, { filename: "site/command-center.js" });
const source = page.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(source, "Expected inline application script");
new vm.Script(source, { filename: "site/index.html" });

class Element {
  constructor(tag = "div", id = "") {
    this.tagName = tag.toUpperCase();
    this.id = id;
    this.value = "";
    this.children = [];
    this.events = new Map();
    this.attrs = {};
    this.dataset = {};
    this.style = {};
    this.hidden = false;
    this.innerHTML = "";
    this.textContent = "";
    this.classList = {
      values: new Set(),
      add: name => this.classList.values.add(name),
      remove: name => this.classList.values.delete(name),
      toggle: (name, yes) => yes ? this.classList.values.add(name) : this.classList.values.delete(name),
      contains: name => this.classList.values.has(name)
    };
  }
  addEventListener(event, fn) {
    this.events.set(event, [...(this.events.get(event) || []), fn]);
  }
  dispatch(event) {
    for (const fn of this.events.get(event) || []) fn({ type: event, target: this });
  }
  appendChild(node) { this.children.push(node); return node; }
  append(...nodes) { nodes.forEach(node => this.appendChild(node)); }
  replaceChildren(...nodes) { this.children = nodes; }
  cloneNode() { const out = new Element(this.tagName, this.id); out.value = this.value; out.textContent = this.textContent; return out; }
  setAttribute(name, value) { this.attrs[name] = value; }
  scrollIntoView() {}
  focus() {}
  remove() {}
  click() { this.dispatch("click"); }
}

async function createApp() {
  const elements = new Map();
  const tags = new Map();
  for (const match of page.matchAll(/<(button|input|select|textarea|section|div|b|span|p)\b[^>]*?\bid="([^"]+)"[^>]*>/g)) {
    const [, tag, id] = match;
    const el = new Element(tag, id);
    const value = match[0].match(/\bvalue="([^"]*)"/);
    if (value) el.value = value[1];
    if (/\bhidden\b/.test(match[0])) el.hidden = true;
    elements.set(id, el);
    tags.set(id, tag);
  }
  const tabs = [];
  for (const match of page.matchAll(/<button\b[^>]*class="tab[^"]*"[^>]*data-tab="([^"]+)"/g)) {
    const el = new Element("button");
    el.dataset.tab = match[1];
    tabs.push(el);
  }
  assert.equal(tabs.length, 8);
  elements.get("doc-type").value = "City / town";
  const drafts = [...tags].filter(([id, tag]) => id.startsWith("doc-") && ["input", "textarea"].includes(tag)).map(([id]) => elements.get(id));
  const requests = [], downloads = [], alerts = [], blobs = [], errors = [];
  const stored = new Map();
  const DocumentURL = class extends URL {};
  DocumentURL.createObjectURL = blob => { blobs.push(blob); return "blob:smoke/" + blobs.length; };
  DocumentURL.revokeObjectURL = () => {};
  const body = new Element("body");
  const originalAppendChild = body.appendChild.bind(body);
  body.appendChild = el => {
    if (el.tagName === "A") el.click = () => downloads.push({ filename: el.download, href: el.href, blob: blobs[blobs.length - 1] });
    return originalAppendChild(el);
  };
  const document = {
    body,
    createElement: tag => new Element(tag),
    getElementById: id => elements.get(id) || null,
    querySelector: selector => elements.get(selector.slice(1)) || null,
    querySelectorAll: selector => selector === ".tab" ? tabs : selector === "#view-draft input,#view-draft textarea" ? drafts : []
  };
  const localStorage = {
    setItem: (key, value) => stored.set(key, value),
    getItem: key => stored.get(key) || null
  };
  const window = { print: () => { window.printed = true; }, confirm: () => true, localStorage };
  const fetch = async url => {
    requests.push(url);
    if (url === "./data/catalog.json") return { ok: true, json: async () => catalog };
    if (url === "./data/public-record-sources.json") return {ok: true, json: async () => recordRegistry};
    if (url === "./data/public-records-audit.json") return {ok: true, json: async () => recordAudit};
    if (url.startsWith("./data/audit.json")) return { ok: true, json: async () => audit };
    return { ok: false, json: async () => ({}) };
  };
  const context = vm.createContext({
    document, window, navigator: {}, location: { protocol: "http:" },
    fetch, URL: DocumentURL, Blob, Option: function (text, value) {
      const option = new Element("option");
      option.textContent = text;
      option.value = value;
      return option;
    },
    localStorage, alert: text => alerts.push(text),
    console: { error: (...args) => errors.push(args.map(String).join(" ")) },
    setTimeout: () => 0
  });
  vm.runInContext(commandSource, context, { timeout: 5000 });
  vm.runInContext(recordSource, context, { timeout: 5000 });
  vm.runInContext(source, context, { timeout: 5000 });
  await new Promise(done => setImmediate(done));
  await new Promise(done => setImmediate(done));
  return { elements, tabs, requests, downloads, alerts, blobs, errors, context, stored };
}

test("catalog, static links and scripts have safe basic structure", () => {
  assert.equal(catalog.counties.length, 9);
  assert.equal(new Set(catalog.counties.map(c => c.fips)).size, 9);
  assert.equal(catalog.programs.length, 101);
  for (const record of catalog.programs) {
    for (const key of ["official", "documents"]) {
      assert.equal(new URL(record[key]).protocol, "https:", record.id + " " + key);
    }
  }
  for (const resource of catalog.resources) assert.equal(new URL(resource.url).protocol, "https:");
  assert.match(serviceWorker, /\.\/data\/catalog\.json/);
  assert.match(serviceWorker, /\.\/data\/audit\.json/);
  assert.match(serviceWorker, /command-center\.js/);
  assert.match(commandCss, /prefers-reduced-motion/);
});

test("all visible application controls are bound to working handlers", async () => {
  const app = await createApp();
  assert.deepEqual(app.errors, []);
  assert.equal(app.elements.get("pcount").textContent, 101);
  assert.equal(app.elements.get("county-list").children.length, 9);
  assert.equal(app.elements.get("card-list").children.length, 24);
  for (const t of app.tabs) {
    t.dispatch("click");
    assert.equal(app.elements.get("view-" + t.dataset.tab).hidden, false);
  }
  app.elements.get("show-more").dispatch("click");
  assert.equal(app.elements.get("card-list").children.length, 48);
  app.elements.get("q").value = "flood";
  app.elements.get("q").dispatch("input");
  assert.match(app.elements.get("search-summary").textContent, /programs match/);
  app.elements.get("county").value = "17185";
  app.elements.get("county").dispatch("change");
  assert.ok(app.elements.get("card-list").children.length > 0);
  app.elements.get("reset").dispatch("click");
  assert.equal(app.elements.get("q").value, "");
  assert.equal(app.elements.get("county").value, "");
  assert.equal(app.elements.get("card-list").children.length, 24);
  app.elements.get("county-list").children[0].dispatch("click");
  assert.equal(app.elements.get("county").value, "18129");
  app.elements.get("jurisdiction").value = "IN";
  app.elements.get("jurisdiction").dispatch("change");
  assert.ok(app.elements.get("card-list").children.length > 0);
  app.elements.get("reset").dispatch("click");
  assert.equal(app.elements.get("jurisdiction").value, "");
  const grantCard = app.elements.get("card-list").children[0];
  const controls = grantCard.children.find(n => n.className === "card-actions");
  controls.children.find(n => n.textContent === "Track for a county").dispatch("click");
  assert.equal(app.elements.get("view-pipeline").hidden, false);
  assert.ok(app.elements.get("pipeline-note").textContent.includes("county"));
  assert.equal(app.errors.length, 0);
});

test("document generation, persistence, export and print actions work", async () => {
  const app = await createApp();
  const el = id => app.elements.get(id);
  app.tabs.find(t => t.dataset.tab === "draft").dispatch("click");
  el("doc-applicant").value = "City of Mount Vernon";
  el("doc-title").value = "Drainage assessment";
  el("doc-cost").value = "12000";
  el("make-doc").dispatch("click");
  assert.match(el("preview").innerHTML, /City of Mount Vernon/);
  assert.match(el("preview").innerHTML, /Drainage assessment/);
  el("save-local").dispatch("click");
  assert.ok(app.stored.has("tristate-grant-draft-v2"));
  el("doc-applicant").value = "Changed";
  el("load-local").dispatch("click");
  assert.equal(el("doc-applicant").value, "City of Mount Vernon");
  for (const id of ["download-doc", "download-html", "download-md", "download-json", "export-csv", "download-audit"]) {
    el(id).dispatch("click");
  }
  assert.equal(app.downloads.length, 6);
  assert.ok(app.downloads.some(d => d.filename.endsWith(".doc")));
  assert.ok(app.downloads.some(d => d.filename.endsWith(".html")));
  assert.ok(app.downloads.some(d => d.filename.endsWith(".md")));
  assert.ok(app.downloads.some(d => d.filename.endsWith(".json")));
  assert.ok(app.downloads.some(d => d.filename.endsWith(".csv")));
  const csv = app.downloads.find(d => d.filename.endsWith(".csv"));
  assert.match(await csv.blob.text(), /funding_type/);
  el("print-doc").dispatch("click");
  assert.equal(app.context.window.printed, true);
  el("clear-draft").dispatch("click");
  assert.equal(el("doc-applicant").value, "");
  assert.equal(el("doc-title").value, "");
  assert.equal(app.errors.length, 0);
});

test("audit reload is compatible with offline service-worker cache", async () => {
  const app = await createApp();
  app.elements.get("reload-audit").dispatch("click");
  await new Promise(done => setImmediate(done));
  assert.equal(app.requests.at(-1), "./data/audit.json",
    "Audit URLs must match the pre-cached URL exactly; timestamp queries break offline reload.");
  assert.match(app.elements.get("run-status").innerHTML, /Last HTTP check/);
  assert.equal(app.errors.length, 0);
});

test("every named button appears in the tested application", async () => {
  const app = await createApp();
  for (const match of page.matchAll(/<button\b[^>]*?\bid="([^"]+)"/g)) {
    const el = app.elements.get(match[1]);
    assert.ok(el, match[1]);
    assert.ok(el.events.get("click")?.length, "Missing click handler: " + match[1]);
  }
});

test("application pipeline requires an explicit county and preserves checklists and stage locally", async () => {
  const app = await createApp();
  const el = id => app.elements.get(id);
  assert.equal(el("pipeline-board").children.length, 4);
  assert.equal(el("tracked-count").textContent, "0");
  el("pipeline-program").value = catalog.programs[0].id;
  el("pipeline-add").dispatch("click");
  assert.equal(el("tracked-count").textContent, "0", "must not assume a county");
  el("pipeline-county").value = "18129";
  el("pipeline-add").dispatch("click");
  assert.equal(el("tracked-count").textContent, "1");
  assert.equal(JSON.parse(app.stored.get("tristate-grant-pipeline-v1"))[0].county_fips, "18129");
  el("pipeline-add").dispatch("click");
  assert.equal(el("tracked-count").textContent, "1", "must avoid duplicate local records");
  let card = el("pipeline-board").children[0].children.find(n => n.className === "pipeline-card");
  assert.ok(card);
  const details = card.children.find(n => n.tagName === "DETAILS");
  assert.ok(details.children.length > 2, "planning document checklist must render");
  const checkbox = details.children.find(n => n.tagName === "LABEL").children[0];
  checkbox.checked = true;
  checkbox.dispatch("change");
  assert.deepEqual(JSON.parse(app.stored.get("tristate-grant-pipeline-v1"))[0].done, [0]);
  assert.equal(el("pipeline-board").children[0].children.find(n => n.className === "pipeline-card"), card,
    "Checking a document must not collapse or replace the expanded checklist.");
  card = el("pipeline-board").children[0].children.find(n => n.className === "pipeline-card");
  const stageSelect = card.children.find(n => n.className === "control-label").children[0];
  stageSelect.value = "Submitted";
  stageSelect.dispatch("change");
  assert.equal(el("pipeline-board").children[3].children.filter(n => n.className === "pipeline-card").length, 1);
  el("pipeline-export").dispatch("click");
  assert.ok(app.downloads.some(d => d.filename === "Tri-State-Local-Grant-Pipeline.json"));
  card = el("pipeline-board").children[3].children.find(n => n.className === "pipeline-card");
  const remove = card.children.find(n => n.className === "card-actions").children.find(n => n.textContent === "Remove");
  remove.dispatch("click");
  assert.equal(el("tracked-count").textContent, "0");
});

test("official portal directory uses real catalog URLs and jurisdiction/search filters", async () => {
  const app = await createApp();
  const el = id => app.elements.get(id);
  assert.equal(el("portal-grid").children.length, catalog.resources.length);
  el("portal-scope").value = "KY";
  el("portal-scope").dispatch("change");
  assert.ok(el("portal-grid").children.length > 0);
  for (const c of el("portal-grid").children) {
    const link = c.children.find(n => n.tagName === "A");
    assert.ok(link);
    assert.ok(catalog.resources.some(r => r.url === link.href));
    assert.equal(new URL(link.href).protocol, "https:");
  }
  el("portal-scope").value = "";
  el("portal-q").value = "flood";
  el("portal-q").dispatch("input");
  assert.ok(el("portal-grid").children.length > 0 && el("portal-grid").children.length < catalog.resources.length);
  assert.match(el("portal-count").textContent, /official resource links/);
});

test("cost share model conserves cents and flags invalid allocations", async () => {
  const app = await createApp();
  const el = id => app.elements.get(id);
  assert.equal(el("match-fed-value").textContent, "$750,000.00");
  assert.equal(el("match-state-value").textContent, "$0.00");
  assert.equal(el("match-local-value").textContent, "$250,000.00");
  el("match-total").value = "0.01";
  el("match-federal").value = "50";
  el("match-state").value = "50";
  el("match-state").dispatch("input");
  const amounts = ["match-fed-value", "match-state-value", "match-local-value"].map(k =>
    Number(el(k).textContent.replace(/[$,]/g, "")));
  assert.equal(amounts.reduce((a, b) => a + b, 0), 0.01);
  assert.ok(amounts.every(n => n >= 0), "no negative local share after rounding");
  el("match-federal").value = "80";
  el("match-state").value = "40";
  el("match-federal").dispatch("input");
  assert.equal(el("match-fed-value").textContent, "—");
  assert.match(el("match-error").textContent, /no greater than 100%/);
  el("match-reset").dispatch("click");
  assert.equal(el("match-local-value").textContent, "$250,000.00");
});

test("new interface exposes no hard-coded sample project award totals", () => {
  assert.doesNotMatch(page, /14,850,000|3,325,000|Verified Entity Readiness|SAM UEI Active/);
  assert.match(page, /User-tracked|My application pipeline/);
  assert.match(commandSource, /NOFO/);
});

test("official county archive view has nine counties and explicitly flags Wabash Illinois", async () => {
  const app = await createApp();
  const entries = app.elements.get("records-list").children;
  assert.equal(entries.length, 9);
  const missing = entries.find(el => el.children.some(x => x.textContent === "Wabash County, IL"));
  assert.ok(missing);
  assert.ok(missing.children.some(x => x.textContent.includes("not yet located")));
  assert.equal(recordRegistry.counties.length, catalog.counties.length);
  assert.deepEqual(new Set(recordRegistry.counties.map(c => c.fips)),
    new Set(catalog.counties.map(c => c.fips)));
  const auditButton = app.elements.get("records-reload");
  assert.equal(auditButton.events.get("click").length, 1);
  auditButton.dispatch("click");
  await new Promise(done => setImmediate(done));
  assert.equal(app.requests.at(-1), "./data/public-records-audit.json",
    "Avoid cache-busting query strings that break the offline snapshot.");
  assert.equal(app.errors.length, 0);
  assert.match(serviceWorker, /public-record-sources\.json/);
  assert.match(serviceWorker, /public-records-audit\.json/);
  assert.match(serviceWorker, /public-records\.js/);
});
