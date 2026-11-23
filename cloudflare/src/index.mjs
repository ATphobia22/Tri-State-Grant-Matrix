// Cloudflare Workers + D1 implementation of the public, no-login grant API.
// The static GitHub Pages catalog is the authoritative curated seed;
// no AI agent can publish awards, applicant eligibility or private drafts.
import catalog from "../../site/data/catalog.json" with {type:"json"};
import archive from "../../site/data/public-record-sources.json" with {type:"json"};

const SITE="https://atphobia22.github.io/Tri-State-Grant-Matrix/";
const ORIGIN="https://atphobia22.github.io";
const FIPS=["18129","18163","18051","18173","17193","17059","17185","21101","21225"];
const ACCEPTED=new Set(["REACHABLE","CHANGED","BLOCKED","MISSING","UNAVAILABLE","REDIRECT","PARTIAL","ACCESS_RESTRICTED","NOT_FOUND"]);
const MAX_SNAPSHOT_BYTES=1024*1024;

function corsHeaders(request,env){
 const headers={"content-type":"application/json; charset=utf-8",
 "cache-control":"public, max-age=60",
 "x-content-type-options":"nosniff"};
 const origin=request.headers.get("Origin");
 const authorized=env.PUBLIC_ORIGIN||ORIGIN;
 if(origin===authorized){
  headers["access-control-allow-origin"]=authorized;
  headers["access-control-allow-methods"]="GET, HEAD, OPTIONS";
  headers["access-control-allow-headers"]="Content-Type";
  headers["vary"]="Origin";
 }
 return headers;
}
function response(request,env,data,status=200){
 return new Response(JSON.stringify(data),{status,headers:corsHeaders(request,env)});
}
function problem(request,env,status,detail){
 return response(request,env,{detail,status},status);
}
function safePage(params,max=100){
 const n=Number(params.get("limit")||30), offset=Number(params.get("offset")||0);
 if(!Number.isInteger(n)||n<1||n>max||!Number.isInteger(offset)||offset<0||offset>10000) return null;
 return {n,offset};
}
function safeFips(v){return v===""||FIPS.includes(v)}
async function all(db,sql,params=[]){return (await db.prepare(sql).bind(...params).all()).results||[]}
async function first(db,sql,params=[]){return await db.prepare(sql).bind(...params).first()}
function details(row){return JSON.parse(row.record_json)}
function validQuery(value,max){return typeof value==="string"&&value.length<=max}

export async function handle(request,env){
 const path=new URL(request.url);
 if(request.method==="OPTIONS")return new Response(null,{status:204,headers:corsHeaders(request,env)});
 if(!["GET","HEAD"].includes(request.method))return problem(request,env,405,"Read-only public API");
 if(!env.GRANTS_DB)return problem(request,env,503,"D1 database binding not configured");
 const db=env.GRANTS_DB;
 try{
  const pathname=path.pathname;
  if(pathname==="/healthz")return response(request,env,{status:"alive",service:"tristate-grants-cloudflare"});
  if(pathname==="/readyz"){
   const c=await first(db,"SELECT count(*) AS n FROM counties");
   const p=await first(db,"SELECT count(*) AS n FROM programs");
   const ready=c?.n===9&&p?.n>=101;
   return response(request,env,{status:ready?"ready":"unseeded",counties:c?.n||0,programs:p?.n||0},ready?200:503);
  }
  if(pathname==="/v1/counties"){
   const c=await all(db,"SELECT fips,name,state,communities FROM counties ORDER BY fips");
   return response(request,env,{counties:c,eligibility_verified:false});
  }
  if(pathname==="/v1/catalog"){
   const c=await all(db,"SELECT fips,name,state,communities FROM counties ORDER BY fips");
   const p=await all(db,"SELECT record_json FROM programs ORDER BY id");
   if(c.length!==9||p.length<101)return problem(request,env,503,"D1 catalog has not been seeded");
   return response(request,env,{schema:catalog.schema,as_of:catalog.as_of,
    counties:c,programs:p.map(details),resources:catalog.resources,
    readme:catalog.readme,metadata:{backend:"cloudflare-d1",
     retrieved_at:new Date().toISOString(),eligibility_verified:false}});
  }
  if(pathname==="/v1/programs"){
   const page=safePage(path.searchParams);
   if(!page)return problem(request,env,400,"Invalid pagination");
   const fips=path.searchParams.get("county")||"";
   const scope=path.searchParams.get("scope")||"";
   const sector=path.searchParams.get("sector")||"";
   const q=(path.searchParams.get("q")||"").trim();
   if(!safeFips(fips))return problem(request,env,404,"County outside nine-county coverage");
   if(scope&&!["FED","IN","IL","KY"].includes(scope))return problem(request,env,400,"Invalid scope");
   if(!validQuery(sector,100)||!validQuery(q,140))return problem(request,env,400,"Search too long");
   const clauses=[],args=[];
   if(scope){clauses.push("scope=?");args.push(scope)}
   if(sector){clauses.push("sector=?");args.push(sector)}
   if(fips){
    const county=await first(db,"SELECT state FROM counties WHERE fips=?",[fips]);
    if(!county)return problem(request,env,404,"Unknown county");
    clauses.push("(scope='FED' OR scope=?)");args.push(county.state);
   }
   if(q){
    clauses.push("(instr(lower(name),lower(?))>0 OR instr(lower(sector),lower(?))>0 OR instr(lower(status),lower(?))>0)");
    args.push(q,q,q);
   }
   const where=clauses.length?" WHERE "+clauses.join(" AND "):"";
   const count=await first(db,"SELECT count(*) AS n FROM programs"+where,args);
   const rows=await all(db,"SELECT record_json FROM programs"+where+
    " ORDER BY name LIMIT ? OFFSET ?",args.concat([page.n,page.offset]));
   return response(request,env,{total:count.n,items:rows.map(details),
    county_filter_is_eligibility_decision:false});
  }
  if(pathname.startsWith("/v1/programs/")){
   const id=decodeURIComponent(pathname.slice("/v1/programs/".length));
   if(!/^[A-Za-z0-9._-]{1,120}$/.test(id))return problem(request,env,400,"Invalid program ID");
   const p=await first(db,"SELECT record_json,updated_at FROM programs WHERE id=?",[id]);
   if(!p)return problem(request,env,404,"Program not found");
   const program=details(p);
   const checks=await all(db,"SELECT url,checked_at,http_status,state,content_sha256 FROM source_checks WHERE url=? OR url=? ORDER BY checked_at DESC LIMIT 12",[program.official,program.documents]);
   return response(request,env,{program,last_imported_at:p.updated_at,source_checks:checks,eligible:null});
  }
  if(pathname==="/v1/records"){
   const fips=path.searchParams.get("fips")||"";
   if(!safeFips(fips))return problem(request,env,404,"County outside nine-county coverage");
   const sql="SELECT county_fips,source_id,title,source_url,authority,record_json FROM county_sources";
   const rows=await all(db,sql+(fips?" WHERE county_fips=?":"")+" ORDER BY county_fips,source_id",fips?[fips]:[]);
   return response(request,env,{records:rows.map(row=>({...row,record:JSON.parse(row.record_json),record_json:undefined})),
    nine_counties_only:true});
  }
  if(pathname==="/v1/opportunities"||pathname==="/v1/discover"){
   const page=safePage(path.searchParams,200);
   if(!page)return problem(request,env,400,"Invalid pagination");
   const q=(path.searchParams.get("q")||"").trim();
   if(!validQuery(q,120))return problem(request,env,400,"Search too long");
   const where=q?" WHERE instr(lower(title),lower(?))>0 OR instr(lower(agency),lower(?))>0":"";
   const args=q?[q,q]:[];
   const rows=await all(db,"SELECT id,title,agency,status,closes_at,source_url,observed_at,review_state FROM opportunities"+
    where+" ORDER BY observed_at DESC,id LIMIT ? OFFSET ?",args.concat([page.n,page.offset]));
   if(pathname==="/v1/discover")return response(request,env,{items:rows,source:"Grants.gov saved discovery only",cache_only:true,eligibility_verified:false});
   return response(request,env,{items:rows,source:"Grants.gov saved discovery only",review_notice:"Unverified applicant eligibility"});
  }
  if(pathname==="/v1/audits/latest"){
   const limit=safePage(path.searchParams,250);
   if(!limit)return problem(request,env,400,"Invalid audit limit");
   const run=await first(db,"SELECT * FROM audit_runs ORDER BY observed_at DESC,id DESC LIMIT 1");
   const rows=await all(db,"SELECT url,checked_at,http_status,state,content_sha256,changed,error FROM source_checks ORDER BY checked_at DESC,id DESC LIMIT ?",[limit.n]);
   return response(request,env,{last_run:run?{...run,completed_at:run.observed_at}:null,checks:rows,
    notice:"Source index HTTP observations are not eligibility or meeting-action verification"});
  }
  if(pathname.startsWith("/v1/evidence/")){
   const id=pathname.slice("/v1/evidence/".length);
   if(!/^[A-Za-z0-9._-]{1,120}$/.test(id))return problem(request,env,400,"Invalid program ID");
   const rows=await all(db,"SELECT field_name,value_json,verbatim_quote,page_locator,review_state,source_url,source_sha256,model_name,created_at FROM evidence_claims WHERE program_id=? ORDER BY created_at DESC LIMIT 100",[id]);
   return response(request,env,{items:rows.map(row=>({...row,extracted_value:JSON.parse(row.value_json),value_json:undefined})),
    notice:"Candidate quotes never establish legal grant eligibility"});
  }
  return problem(request,env,404,"Not found");
 }catch(err){
  // Do not expose database errors, credentials or SQL to anonymous callers.
  console.error("Grant Matrix Worker failed",err?.name||"Error");
  return problem(request,env,503,"Public grant database is temporarily unavailable");
 }
}

function isValidStamp(date){
 return typeof date==="string"&&date.length>=19&&Number.isFinite(Date.parse(date));
}
function shaOrNull(value){
 return typeof value==="string"&&/^[0-9a-f]{64}$/i.test(value)?value:null;
}
function trustedUrl(v){
 try{return typeof v==="string"&&new URL(v).protocol==="https:"&&v.length<=2000}catch{return false}
}
function mapAuditRows(origin,raw){
 const changeUrls=new Set((raw.changes||[]).filter(e=>e&&typeof e==="object"&&
  (e.type||"").includes("CHANGED")).map(e=>origin==="grant_links"?e.url:e.source_id).filter(Boolean));
 const source=origin==="grant_links"?raw.links:raw.sources;
 if(!source||typeof source!=="object"||Array.isArray(source))throw Error("Invalid snapshot structure");
 const rows=[];
 for(const [key,value] of Object.entries(source).slice(0,250)){
  if(!value||!ACCEPTED.has(value.status))continue;
  const url=origin==="grant_links"?key:value.url;
  if(!trustedUrl(url)||!isValidStamp(value.checked_at))continue;
  rows.push({origin,url,checked_at:value.checked_at,state:value.status,
   http_status:Number.isInteger(value.http_status)?value.http_status:null,
   content_sha256:shaOrNull(origin==="grant_links"?value.fingerprint:value.content_sha256),
   changed:changeUrls.has(key)?1:0,
   error:typeof value.error_type==="string"?value.error_type.slice(0,120):null});
 }
 return rows;
}
async function fetchSnapshot(fetcher,path){
 const response=await fetcher(SITE+"data/"+path,{headers:{Accept:"application/json"}});
 if(!response.ok)throw Error("Published audit unavailable: "+path);
 const length=Number(response.headers.get("content-length")||0);
 if(length>MAX_SNAPSHOT_BYTES)throw Error("Published audit exceeds byte cap");
 const bytes=await response.arrayBuffer();
 if(bytes.byteLength>MAX_SNAPSHOT_BYTES)throw Error("Published audit truncated");
 const data=JSON.parse(new TextDecoder().decode(bytes));
 if(!isValidStamp(data.last_run))throw Error("Published audit has no dated run");
 return data;
}
export async function importPublishedAudits(env,fetcher=fetch){
 if(!env.GRANTS_DB)throw Error("D1 binding not configured");
 let successful=0,failed=0,observed=0;
 for(const entry of [{origin:"grant_links",path:"audit.json"},
                     {origin:"county_archives",path:"public-records-audit.json"}]){
  try{
   const data=await fetchSnapshot(fetcher,entry.path);
   const rows=mapAuditRows(entry.origin,data);
   if(!rows.length)throw Error("Empty published source observations");
   const d=env.GRANTS_DB;
   await d.prepare("INSERT OR IGNORE INTO audit_runs(origin,observed_at,source_url,entries) VALUES(?,?,?,?)")
     .bind(entry.origin,data.last_run,SITE+"data/"+entry.path,rows.length).run();
   for(let i=0;i<rows.length;i+=20){
    await d.batch(rows.slice(i,i+20).map(x=>
     d.prepare("INSERT OR IGNORE INTO source_checks(origin,url,checked_at,state,http_status,content_sha256,changed,error) VALUES(?,?,?,?,?,?,?,?)")
      .bind(x.origin,x.url,x.checked_at,x.state,x.http_status,x.content_sha256,x.changed,x.error)));
   }
   observed+=rows.length;successful++;
  }catch(err){failed++;console.error("Published audit import error",entry.origin,err?.name||"Error")}
 }
 return {successful,failed,observed};
}
export default {
 fetch(request,env){return handle(request,env)},
 scheduled(_controller,env,ctx){
  ctx.waitUntil(importPublishedAudits(env));
 }
};
