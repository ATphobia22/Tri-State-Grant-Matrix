// Search the public Grants.gov index on each visit. Local eligibility requires agency review.
(async function discover() {
  const panel = document.querySelector("#discovery");
  const endpoint = "https://api.grants.gov/v1/api/search2";
  const topics = ["flood mitigation", "water infrastructure", "community facilities", "rural broadband"];
  const results = new Map();
  const failed = [];
  await Promise.all(topics.map(async keyword => {
    try {
      const response = await fetch(endpoint, {method: "POST", cache: "no-store",
        headers: {"Content-Type": "application/json"}, signal: AbortSignal.timeout(15000),
        body: JSON.stringify({rows: 25, keyword, oppStatuses: "posted"})});
      if (!response.ok) throw Error("HTTP failure");
      const payload = await response.json();
      if (Number(payload.errorcode) !== 0 || !Array.isArray(payload.data?.oppHits)) throw Error("Invalid result");
      for (const hit of payload.data.oppHits) {
        if (/^\d+$/.test(hit.id) && hit.title) results.set(String(hit.id), hit);
      }
    } catch { failed.push(keyword); }
  }));
  const summary = document.createElement("p");
  summary.textContent = results.size + " distinct federal listings returned across four searches (up to 25 per topic). County eligibility requires review." +
    (failed.length ? " Live search unavailable for " + failed.join(", ") + ". The published catalog remains available." : "");
  panel.replaceChildren(summary);
  const list = document.createElement("ul");
  for (const hit of [...results.values()].sort((a,b) => a.title.localeCompare(b.title))) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = "https://www.grants.gov/search-results-detail/" + hit.id;
    link.textContent = hit.title;
    item.append(link, " · " + (hit.agencyName || hit.agencyCode || "See agency notice") +
      " · Closing date " + (hit.closeDate || "unspecified"));
    list.appendChild(item);
  }
  panel.appendChild(list);
})();
