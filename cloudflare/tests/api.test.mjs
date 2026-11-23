import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync, existsSync} from "node:fs";
import {resolve, dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {execFileSync} from "node:child_process";
import {DatabaseSync} from "node:sqlite";
import {handle, importPublishedAudits} from "../src/index.mjs";

const here=dirname(fileURLToPath(import.meta.url));
const cfRoot=resolve(here,"..");
const repoRoot=resolve(cfRoot,"..");
const fips=["18129","18163","18051","18173","17193","17059","17185","21101","21225"];
const catalog=JSON.parse(readFileSync(resolve(repoRoot,"site/data/catalog.json"),"utf8"));
const sources=JSON.parse(readFileSync(resolve(repoRoot,"site/data/public-record-sources.json"),"utf8"));

class D1Adapter {
 constructor(db){this.db=db}
 prepare(sql){
  let params=[];
  return {
   bind(...v){params=v;return this},
   all:async()=>({results:this.db.prepare(sql).all(...params)}),
   first:async()=>this.db.prepare(sql).get(...params)||null,
   run:async()=>this.db.prepare(sql).run(...params)
  }
 }
 async batch(stmts){const out=[];for(const s of stmts)out.push(await s.run());return out}
}
function seeded(){
 const db=new DatabaseSync(":memory:");
 db.exec("PRAGMA foreign_keys=ON");
 db.exec(readFileSync(resolve(cfRoot,"migrations/0001_init.sql"),"utf8"));
 const gen=execFileSync(process.execPath,["scripts/generate-seed.mjs"],{cwd:cfRoot,encoding:"utf8"});
 assert.match(gen,/9 counties, 101 programs/);
 const seed=resolve(cfRoot,"generated/seed.sql");
 assert.ok(existsSync(seed));
 db.exec(readFileSync(seed,"utf8"));
 return {sqlite:db,GRANTS_DB:new D1Adapter(db),PUBLIC_ORIGIN:"https://atphobia22.github.io"};
}
async function query(env,path,init={}){
 const res=await handle(new Request("https://tristate-grants-api.example.workers.dev"+path,init),env);
 const body=await res.json();
 return {status:res.status,body,headers:res.headers};
}
test("D1 migration and idempotent source-controlled seed have exactly nine counties, 101 programs and real archive IDs",()=>{
 const env=seeded();
 const counties=env.sqlite.prepare("SELECT fips FROM counties ORDER BY fips").all().map(x=>x.fips);
 assert.deepEqual(counties,[...fips].sort());
 assert.equal(env.sqlite.prepare("SELECT count(*) AS n FROM programs").get().n,101);
 assert.equal(env.sqlite.prepare("SELECT count(*) AS n FROM county_sources").get().n,
  sources.counties.reduce((n,c)=>n+c.sources.length,0));
 assert.equal(catalog.programs.length,101);
 const seed=readFileSync(resolve(cfRoot,"generated/seed.sql"),"utf8");
 env.sqlite.exec(seed);
 assert.equal(env.sqlite.prepare("SELECT count(*) AS n FROM programs").get().n,101);
 assert.equal(env.sqlite.prepare("SELECT count(*) AS n FROM counties").get().n,9);
 env.sqlite.close();
});

test("public catalog and readiness preserve source JSON without claiming legal eligibility",async()=>{
 const env=seeded();
 const ready=await query(env,"/readyz");
 assert.equal(ready.status,200);
 assert.equal(ready.body.counties,9);
 assert.equal(ready.body.programs,101);
 const c=await query(env,"/v1/catalog");
 assert.equal(c.status,200);
 assert.deepEqual(c.body.counties.map(x=>x.fips),[...fips].sort());
 assert.equal(c.body.programs.length,101);
 assert.equal(c.body.resources.length,catalog.resources.length);
 assert.equal(c.body.metadata.backend,"cloudflare-d1");
 assert.equal(c.body.metadata.eligibility_verified,false);
 const source=await query(env,"/v1/programs/FEMA-FMA-2026");
 assert.equal(source.status,200);
 assert.equal(source.body.eligible,null);
 assert.equal(source.body.program.deadline,"2027-02-26");
 env.sqlite.close();
});

test("county and grant search are strict, parameterized and read-only",async()=>{
 const env=seeded();
 const posey=await query(env,"/v1/programs?county=18129&limit=100");
 assert.equal(posey.status,200);
 assert.ok(posey.body.items.every(x=>["IN","FED"].includes(x.scope)));
 assert.equal(posey.body.county_filter_is_eligibility_decision,false);
 const henderson=await query(env,"/v1/programs?county=21101&limit=100");
 assert.ok(henderson.body.items.every(x=>["KY","FED"].includes(x.scope)));
 const bad=await query(env,"/v1/programs?county=99999");
 assert.equal(bad.status,404);
 assert.equal((await query(env,"/v1/programs?limit=999")).status,400);
 assert.equal((await query(env,"/v1/programs?q=%27%20OR%201%3D1")).body.total,0);
 const records=await query(env,"/v1/records");
 assert.equal(records.status,200);
 assert.deepEqual([...new Set(records.body.records.map(x=>x.county_fips))].sort(),[...fips].sort());
 const record=await query(env,"/v1/records?fips=17185");
 assert.ok(record.body.records.every(x=>x.county_fips==="17185"));
 assert.equal((await query(env,"/v1/evidence/FEMA-FMA-2026")).body.items.length,0);
 assert.equal((await query(env,"/v1/discover")).body.cache_only,true);
 assert.equal((await query(env,"/v1/opportunities")).body.items.length,0);
 assert.equal((await query(env,"/v1/admin/evidence",{method:"POST"})).status,405);
 env.sqlite.close();
});

test("CORS is restricted to public GitHub origin and failed database never fabricates a live catalog",async()=>{
 const env=seeded();
 const allowed=await query(env,"/healthz",{headers:{Origin:"https://atphobia22.github.io"}});
 assert.equal(allowed.headers.get("access-control-allow-origin"),"https://atphobia22.github.io");
 const wrong=await query(env,"/healthz",{headers:{Origin:"https://untrusted.example"}});
 assert.equal(wrong.headers.get("access-control-allow-origin"),null);
 env.sqlite.exec("DELETE FROM programs");
 assert.equal((await query(env,"/readyz")).status,503);
 assert.equal((await query(env,"/v1/catalog")).status,503);
 env.sqlite.close();
});

test("daily ingestion uses only committed audit URLs and keeps dates, errors, source hashes and history",async()=>{
 const env=seeded();
 const stamp="2026-11-23T14:03:01+00:00";
 const grant={last_run:stamp,changes:[{type:"CONTENT_CHANGED_REVIEW_REQUIRED",url:"https://www.fema.gov/test"}],
 links:{"https://www.fema.gov/test":{checked_at:stamp,status:"REACHABLE",http_status:200,fingerprint:"a".repeat(64)}}};
 const county={last_run:stamp,changes:[],sources:{"posey-meetings":{source_id:"posey-meetings",checked_at:stamp,status:"ACCESS_RESTRICTED",url:"https://www.poseycountyin.gov/meetings/",http_status:403,content_sha256:null,error_type:"HTTPError"}}};
 const fakeFetch=async url=>{
  assert.ok(url.startsWith("https://atphobia22.github.io/Tri-State-Grant-Matrix/data/"));
  const payload=url.endsWith("public-records-audit.json")?county:grant;
  return new Response(JSON.stringify(payload),{status:200,headers:{"content-type":"application/json"}});
 };
 const a=await importPublishedAudits(env,fakeFetch);
 assert.deepEqual(a,{successful:2,failed:0,observed:2});
 const b=await importPublishedAudits(env,fakeFetch);
 assert.deepEqual(b,{successful:2,failed:0,observed:2});
 assert.equal(env.sqlite.prepare("SELECT count(*) n FROM source_checks").get().n,2);
 assert.equal(env.sqlite.prepare("SELECT count(*) n FROM audit_runs").get().n,2);
 const checks=(await query(env,"/v1/audits/latest")).body.checks;
 assert.ok(checks.some(x=>x.state==="ACCESS_RESTRICTED"&&x.http_status===403));
 assert.ok(checks.some(x=>x.content_sha256==="a".repeat(64)&&x.changed===1));
 assert.equal((await query(env,"/v1/audits/latest")).body.last_run.completed_at,stamp);
 env.sqlite.close();
});

test("configuration cannot imply Cloudflare database has already been created",()=>{
 const cfg=JSON.parse(readFileSync(resolve(cfRoot,"wrangler.jsonc"),"utf8"));
 assert.equal(cfg.name,"tri-state-grants-api");
 assert.equal(cfg.d1_databases[0].binding,"GRANTS_DB");
 assert.match(cfg.d1_databases[0].database_id,/REPLACE_WITH_REAL_D1_UUID/);
 assert.equal(cfg.vars.PUBLIC_ORIGIN,"https://atphobia22.github.io");
 assert.ok(cfg.triggers.crons.length>0);
});
