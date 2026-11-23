// Federal discovery runs server-side; on a static site use a dated saved snapshot.
(async function discover(){
  const panel=document.querySelector("#discovery");
  const topics=["flood mitigation","water infrastructure","community facilities","rural broadband"];
  const results=new Map();
  let mode="dated published snapshot";
  try{
    const live=await window.grantBackend?.getDiscovery?.();
    if(Array.isArray(live)&&live.length){
      mode="PostgreSQL-backed official Grants.gov search cache";
      for(const hit of live)results.set(String(hit.id),hit);
    }
  }catch{/* Keep static fallback. */}
  if(!results.size){
    try{
      const response=await fetch("./data/discovery.json",{cache:"no-store"});
      if(!response.ok)throw Error("Snapshot missing");
      const snapshot=await response.json();
      for(const topic of topics){
        const saved=snapshot[topic];
        if(!Array.isArray(saved?.hits))continue;
        for(const hit of saved.hits){
          if(/^\d+$/.test(String(hit.id))&&hit.title&&!results.has(String(hit.id))){
            results.set(String(hit.id),{...hit,checked:saved.checked});
          }
        }
      }
    }catch{mode="source snapshot unavailable"}
  }
  const note=document.createElement("p");
  note.textContent=results.size+" federal listings from "+mode+
    ". No browser-side cross-origin POST requests. County eligibility and deadlines require current agency review.";
  panel.replaceChildren(note);
  const list=document.createElement("ul");
  for(const hit of [...results.values()].sort((a,b)=>a.title.localeCompare(b.title))){
    if(!/^\d+$/.test(String(hit.id)))continue;
    const item=document.createElement("li"),link=document.createElement("a");
    link.href="https://www.grants.gov/search-results-detail/"+hit.id;
    link.rel="noreferrer";
    link.textContent=hit.title;
    item.append(link," · "+(hit.agency||hit.agencyName||hit.agencyCode||"See agency notice")+
      " · Closing date "+(hit.closeDate||"not verified")+
      (hit.checked?" · Last indexed "+String(hit.checked).slice(0,10):""));
    list.appendChild(item);
  }
  panel.appendChild(list);
})();
