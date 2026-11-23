"""Real PostgreSQL/API tests; only the government HTTP call is mocked."""
import json
import httpx
import pytest
from fastapi.testclient import TestClient
from backend import bootstrap, extraction, worker
from backend.api import app
from backend.storage import connect

@pytest.fixture(scope="module",autouse=True)
def seeded():
    bootstrap.setup()
    with connect() as db:
        assert bootstrap.seed(db)==(9,101)

@pytest.fixture()
def client():
    return TestClient(app)

def test_health_and_postgres_readiness(client):
    assert client.get("/healthz").json()["status"]=="alive"
    ready=client.get("/readyz")
    assert ready.status_code==200
    assert ready.json()["counties"]==9
    assert ready.json()["programs"]==101

def test_exact_counties_and_catalog(client):
    data=client.get("/v1/catalog").json()
    assert len(data["counties"])==9
    assert len(data["programs"])==101
    assert {c["fips"] for c in data["counties"]}==bootstrap.EXPECTED_FIPS
    assert data["metadata"]["eligibility_verified"] is False
    assert all(p["official"].startswith("https://") for p in data["programs"])

def test_county_filters_and_sql_safety(client):
    all_fed=client.get("/v1/programs",params={"scope":"FED","limit":100})
    assert all_fed.status_code==200
    assert all(x["scope"]=="FED" for x in all_fed.json()["items"])
    posey=client.get("/v1/programs",params={"county":"18129","limit":100})
    assert posey.status_code==200
    assert all(x["scope"] in ("IN","FED") for x in posey.json()["items"])
    ky=client.get("/v1/programs",params={"county":"21101","limit":100})
    assert ky.status_code==200
    assert all(x["scope"] in ("KY","FED") for x in ky.json()["items"])
    assert posey.json()["county_filter_is_eligibility_decision"] is False
    assert client.get("/v1/programs",params={"county":"99999"}).status_code==404
    assert client.get("/v1/programs",params={"limit":10000}).status_code==422
    assert client.get("/v1/programs",params={"q":"'; DROP TABLE programs;--"}).status_code==200

def test_grant_sources_and_county_archives(client):
    detail=client.get("/v1/programs/FEMA-FMA-2026")
    assert detail.status_code==200
    assert detail.json()["program"]["deadline"]=="2027-02-26"
    assert detail.json()["eligible"] is None
    assert client.get("/v1/programs/not-real").status_code==404
    nine=client.get("/v1/records").json()["records"]
    assert {r["county_fips"] for r in nine}==bootstrap.EXPECTED_FIPS
    assert all(r["source_url"].startswith("https://") for r in nine)

def test_public_admin_is_locked(client):
    payload={"source_url":"https://www.fema.gov/example","source_text":"[page 2]\nMatch 25%.",
      "model_name":"test-model","claims":[{"field_name":"match","extracted_value":"25%",
      "verbatim_quote":"Match 25%.","page_locator":"page 2"}]}
    assert client.post("/v1/admin/evidence",json=payload).status_code==403
    assert client.post("/v1/admin/evidence",json=payload,
                       headers={"X-Admin-Token":"incorrect"}).status_code==403

def test_exact_page_and_quote_evidence():
    text="[page 1]\nBudget range $1m.\n[page 2]\nLocal share is 25 percent."
    assert extraction.verify_quote(text,"Local share is 25 percent.","page 2")==(True,True)
    assert extraction.verify_quote(text,"Local share is 25 percent.","page 1")==(True,False)
    assert extraction.verify_quote(text,"Local share is 35 percent.","page 2")==(False,False)
    assert extraction.verify_quote(text,"Local share is 25 percent.","Section 7")==(True,False)

def test_host_policy_and_date_parser():
    assert worker.safe_url("https://www.grants.gov/search-grants")
    assert worker.safe_url("https://www.unioncountyky.org/archive/")
    for url in ("http://grants.gov/","https://localhost/private",
          "https://grants.gov.evil.invalid/path","https://grants.gov@evil.invalid/path"):
        assert worker.safe_url(url) is False
    assert worker.parse_date("11/23/2026").isoformat()=="2026-11-23"
    assert worker.parse_date("2027-02-26").isoformat()=="2027-02-26"
    assert worker.parse_date("not a date") is None

def test_grants_gov_discovery_mock_with_real_postgres(client):
    sample={"errorcode":0,"data":{"oppHits":[{
      "id":"9876543","number":"TEST-RIVER-2026","title":"Test-only municipal flood project",
      "agencyName":"Test Agency","oppStatus":"posted","openDate":"11/23/2026",
      "closeDate":"02/26/2027"}]}}
    def respond(request):
        assert request.url.host=="api.grants.gov"
        assert request.method=="POST"
        body=json.loads(request.content)
        assert body["oppStatuses"]=="posted"
        assert body["keyword"] in worker.KEYWORDS
        return httpx.Response(200,json=sample)
    with httpx.Client(transport=httpx.MockTransport(respond)) as mock:
        with connect() as db:
            run=worker.start_run(db,"test_mock")
            scanned,accepted,errors=worker.sync_grants(mock,db,run)
            worker.finish_run(db,run,scanned,accepted,errors)
    assert scanned==len(worker.KEYWORDS)
    assert accepted==len(worker.KEYWORDS)
    assert errors==0
    items=client.get("/v1/discover",params={"limit":200}).json()["items"]
    found=next(x for x in items if x["id"]=="grantsgov:9876543")
    assert found["source_url"]=="https://www.grants.gov/search-results-detail/9876543"
    assert found["closes_at"]=="2027-02-26"
    assert client.get("/v1/opportunities").status_code==200
    assert client.get("/v1/audits/latest").json()["last_run"] is not None
    assert "/v1/admin/evidence" in client.get("/openapi.json").json()["paths"]
