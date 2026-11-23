"use strict";
/* Public read-only backend client; never sends private drafts or secrets. */
(function () {
  let status = "Static audited snapshot";
  const configReady = fetch("./data/backend.json",{cache:"no-store"})
    .then(r=>r.ok?r.json():{}).catch(()=>({}));
  const staticFetch = path => fetch(path,{cache:"no-store"});
  const label = message => {
    status=message;
    const el=document.getElementById("backend-status");
    if(el) el.textContent=message;
  };
  async function base() {
    const cfg=await configReady;
    const raw=String(cfg.api_base_url||"").replace(/\/+$/,"");
    if(!raw)return "";
    try {
      const url=new URL(raw);
      const local=url.protocol==="http:" && ["localhost","127.0.0.1"].includes(url.hostname);
      if(url.protocol!=="https:"&&!local)return "";
      return url.origin+url.pathname.replace(/\/$/,"");
    }catch{return ""}
  }
  async function apiGet(path) {
    const api=await base();
    if(!api)return null;
    try{
      const response=await fetch(api+path,{cache:"no-store",signal:AbortSignal.timeout(7000)});
      if(!response.ok)throw Error("API HTTP "+response.status);
      return await response.json();
    }catch{
      label("Backend unavailable — showing saved official-source snapshot");
      return null;
    }
  }
  window.grantBackend={
    get mode(){return status},
    async getCatalog(){
      const data=await apiGet("/v1/catalog");
      if(data?.counties?.length===9&&data.programs?.length>=100){
        label("Live PostgreSQL catalog connected · eligibility requires agency review");
        return {ok:true,json:async()=>data};
      }
      label("Static audited catalog · live database not connected");
      return staticFetch("./data/catalog.json");
    },
    async getAudit(){
      const data=await apiGet("/v1/audits/latest?limit=250");
      if(Array.isArray(data?.checks)&&data.checks.length){
        const links={},changes=[];
        for(const item of [...data.checks].reverse()){
          links[item.url]={status:item.state,http_status:item.http_status,
            checked_at:item.checked_at,fingerprint:item.content_sha256};
          if(item.changed||["MISSING","BLOCKED","UNAVAILABLE","REDIRECT","PARTIAL"].includes(item.state)){
            changes.push({type:item.changed?"CONTENT_CHANGED_REVIEW_REQUIRED":"SOURCE_ACCESS_REVIEW_REQUIRED",
              url:item.url,note:"Backend state: "+item.state});
          }
        }
        return {ok:true,json:async()=>({
          schema:"tristate.audit.backend.v1",last_run:data.last_run?.completed_at||"",
          links,changes,note:"Backend HTTP audit does not verify eligibility"
        })};
      }
      return staticFetch("./data/audit.json");
    },
    async getDiscovery(){
      const data=await apiGet("/v1/discover?limit=200");
      if(!Array.isArray(data?.items)||!data.items.length)return null;
      return data.items.filter(x=>/^grantsgov:\d+$/.test(String(x.id))&&
        /^https:\/\/www\.grants\.gov\/search-results-detail\/\d+$/.test(String(x.source_url||"")))
        .map(x=>({id:String(x.id).split(":")[1],title:x.title,
          agencyName:x.agency,closeDate:x.closes_at||null,
          checked:x.last_seen_at,source_url:x.source_url}));
    }
  };
  document.addEventListener("DOMContentLoaded",()=>label(status));
})();
