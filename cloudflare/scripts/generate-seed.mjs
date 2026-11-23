// Deterministic SQL seed generator from source-controlled nine-county JSON.
// Never imports awards, private applications, AI-inferred fields or unreviewed discoveries.
import {readFileSync, mkdirSync, writeFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {resolve, dirname} from "node:path";
import {createHash} from "node:crypto";
const root=resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const catalog=JSON.parse(readFileSync(resolve(root,"site/data/catalog.json"),"utf8"));
const registry=JSON.parse(readFileSync(resolve(root,"site/data/public-record-sources.json"),"utf8"));
const expected=["18129","18163","18051","18173","17193","17059","17185","21101","21225"];
function exact(c){
 const values=c.map(x=>x.fips);
 if(values.length!==9 || new Set(values).size!==9 ||
   expected.some(x=>!values.includes(x))) throw Error("Nine-county FIPS gate failed");
}
exact(catalog.counties); exact(registry.counties);
if(catalog.programs.length!==101)throw Error("Unexpected curated catalog count; inspect before seed");
const sqlvalue=x=>x==null?"NULL":"'"+String(x).replaceAll("'","''")+"'";
const statement=(table,cols,values,tail="")=>
 "INSERT INTO "+table+"("+cols.join(",")+") VALUES("+
 values.map(sqlvalue).join(",")+") "+tail+";\n";
// Wrangler D1 executes SQL files within its own managed transaction. Explicit
// BEGIN/COMMIT statements are rejected by D1 remote imports.
let sql="-- Generated from the canonical source catalog; do not edit by hand.\n";
for(const county of catalog.counties){
 sql+=statement("counties",["fips","name","state","communities"],
 [county.fips,county.name,county.state,county.communities],
 "ON CONFLICT(fips) DO UPDATE SET name=excluded.name,state=excluded.state,communities=excluded.communities");
}
const programIds=new Set();
for(const p of catalog.programs){
 if(programIds.has(p.id))throw Error("Duplicate program: "+p.id);
 programIds.add(p.id);
 if(!["IN","IL","KY","FED"].includes(p.scope))throw Error("Unexpected jurisdiction");
 const json=JSON.stringify(p);
 const sha=createHash("sha256").update(json).digest("hex");
 sql+=statement("programs",["id","name","scope","sector","status","deadline","official_url",
 "documents_url","record_json","source_sha256"],
 [p.id,p.name,p.scope,p.sector,p.status,p.deadline||null,p.official,p.documents,json,sha],
 "ON CONFLICT(id) DO UPDATE SET name=excluded.name,scope=excluded.scope,sector=excluded.sector,"+
 "status=excluded.status,deadline=excluded.deadline,official_url=excluded.official_url,"+
 "documents_url=excluded.documents_url,record_json=excluded.record_json,"+
 "source_sha256=excluded.source_sha256,updated_at=CURRENT_TIMESTAMP "+
 "WHERE programs.curator_locked=0 AND programs.source_sha256<>excluded.source_sha256");
}
const seen=new Set();
for(const county of registry.counties){
 for(const source of county.sources){
  if(seen.has(source.id))throw Error("Duplicate archive source: "+source.id);
  seen.add(source.id);
  sql+=statement("county_sources",["source_id","county_fips","title","source_url",
   "authority","record_json"],[source.id,county.fips,source.title,source.url,
   source.authority,JSON.stringify(source)],
   "ON CONFLICT(source_id) DO UPDATE SET county_fips=excluded.county_fips,"+
   "title=excluded.title,source_url=excluded.source_url,authority=excluded.authority,"+
   "record_json=excluded.record_json");
 }
}
// Do not emit BEGIN TRANSACTION, COMMIT or SAVEPOINT for Cloudflare D1.
const output=resolve(root,"cloudflare/generated/seed.sql");
mkdirSync(dirname(output),{recursive:true});
writeFileSync(output,sql,"utf8");
console.log("Generated D1 seed:",catalog.counties.length,"counties,",programIds.size,
 "programs,",seen.size,"archived source records. No personal data.");
