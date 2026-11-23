"use strict";
/* Display source evidence only. No third-party summaries, inferred votes, or grant awards. */
(function () {
  const byId = id => document.getElementById(id);
  const elt = (tag, text, cls) => {
    const e = document.createElement(tag);
    if (text !== undefined) e.textContent = text;
    if (cls) e.className = cls;
    return e;
  };
  function externalLink(url, title) {
    const a = elt("a", title, "action");
    a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer";
    return a;
  }
  const hasSource = (a, id) => a && a.sources && a.sources[id];
  function renderCounties(registry, audit) {
    const wrap = byId("records-list");
    wrap.replaceChildren();
    for (const county of registry.counties) {
      const card = elt("article", undefined, "record-card");
      const heading = elt("h3", county.county + " County, " + county.state);
      card.appendChild(heading);
      const fips = elt("p", "County FIPS " + county.fips, "small");
      card.appendChild(fips);
      const gap = county.archive_status === "county_archive_not_located";
      card.appendChild(elt("p", gap ? "Current official county-board archive: not yet located" :
        "Official meeting archive identified", "record-state" + (gap ? " needs-review" : "")));
      card.appendChild(elt("p", county.notes, "small"));
      for (const source of county.sources) {
        const section = elt("div", undefined, "record-source");
        section.appendChild(externalLink(source.url, source.title));
        const observation = hasSource(audit, source.id);
        const note = !source.monitor ? "Reference only — not monitored as a county archive" :
          !audit || !audit.last_run ? "Not audited yet" :
          !observation ? "No observation returned" :
          observation.status === "REACHABLE" ?
            "Archive index reached · last successful check " + (observation.last_success_at || "unknown") :
            "Automated check " + observation.status + " · past evidence may be stale";
        section.appendChild(elt("p", note, "small"));
        if (observation && observation.documents && observation.documents.length) {
          const details = elt("details");
          details.appendChild(elt("summary", observation.documents.length +
            " observed meeting/document links (not verified contents)"));
          const list = elt("ul", undefined, "record-links");
          for (const doc of observation.documents.slice(0, 20)) {
            const li = elt("li");
            li.appendChild(externalLink(doc.url, doc.label || "Source attachment"));
            list.appendChild(li);
          }
          if (observation.documents.length > 20)
            details.appendChild(elt("p", "Showing the first 20; use the primary archive for the full listing.", "fine"));
          details.appendChild(list);
          section.appendChild(details);
        }
        card.appendChild(section);
      }
      wrap.appendChild(card);
    }
    const changes = byId("records-changes");
    changes.replaceChildren();
    const events = (audit && audit.changes) || [];
    if (!events.length) {
      changes.appendChild(elt("p", "No review flags in the most recent check. This does not guarantee that archives are complete or unchanged.", "small"));
    } else {
      changes.appendChild(elt("p", events.length + " latest source-review flags. They are not confirmed changes to grant or government records.", "small"));
      const list = elt("ul");
      for (const ev of events.slice(0, 20)) {
        list.appendChild(elt("li", ev.source_id + " · " + ev.type + " · " + ev.detected_at));
      }
      changes.appendChild(list);
    }
  }
  async function loadPublicRecords() {
    const status = byId("records-status");
    if (!status) return;
    status.textContent = "Loading the official source inventory and committed audit snapshot…";
    try {
      const [registryResponse, auditResponse] = await Promise.all([
        fetch("./data/public-record-sources.json"),
        fetch("./data/public-records-audit.json", {cache: "no-store"})
      ]);
      if (!registryResponse.ok || !auditResponse.ok) throw Error("Published data not available");
      const registry = await registryResponse.json(), audit = await auditResponse.json();
      if (!Array.isArray(registry.counties) || registry.counties.length !== 9 ||
          registry.counties.some(c => !/^[0-9]{5}$/.test(c.fips))) throw Error("Unexpected county registry");
      renderCounties(registry, audit);
      status.textContent = audit.last_run ?
        "Last UTC source check: " + audit.last_run + " · " +
        registry.counties.filter(c => c.archive_status === "official_archive_identified").length +
        " county archives identified; source reachability is shown individually." :
        "Nine counties listed · eight official county archives identified · automated checks not yet completed.";
    } catch {
      status.textContent = "Could not load the published public-record snapshot. Check network access or offline cache.";
    }
  }
  byId("records-reload").addEventListener("click", loadPublicRecords);
  loadPublicRecords();
})();
