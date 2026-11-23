
-- PostgreSQL 17+. All timestamps are timestamptz UTC; evidence is append-only.
CREATE TABLE IF NOT EXISTS counties (
 fips char(5) PRIMARY KEY,
 name text NOT NULL,
 state char(2) NOT NULL CHECK (state IN ('IN','IL','KY')),
 communities text NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS programs (
 id text PRIMARY KEY,
 name text NOT NULL,
 scope text NOT NULL CHECK(scope IN ('FED','IN','IL','KY')),
 sector text NOT NULL,
 status text NOT NULL,
 funding_type text NOT NULL,
 deadline date,
 source_url text NOT NULL CHECK(source_url LIKE 'https://%'),
 documents_url text NOT NULL CHECK(documents_url LIKE 'https://%'),
 record jsonb NOT NULL,
 import_sha256 char(64) NOT NULL,
 curator_locked boolean NOT NULL DEFAULT false,
 imported_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS programs_scope_idx ON programs(scope);
CREATE INDEX IF NOT EXISTS programs_deadline_idx ON programs(deadline);
CREATE INDEX IF NOT EXISTS programs_text_idx ON programs USING gin (
 to_tsvector('english',coalesce(name,'')||' '||coalesce(sector,'')||' '||coalesce(status,'')));
CREATE TABLE IF NOT EXISTS county_sources (
 source_id text PRIMARY KEY,
 county_fips char(5) NOT NULL REFERENCES counties(fips),
 title text NOT NULL,
 source_url text NOT NULL CHECK(source_url LIKE 'https://%'),
 authority text NOT NULL,
 record jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS sync_runs (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 origin text NOT NULL,
 started_at timestamptz NOT NULL DEFAULT now(),
 completed_at timestamptz,
 status text NOT NULL DEFAULT 'RUNNING',
 scanned int NOT NULL DEFAULT 0,
 accepted int NOT NULL DEFAULT 0,
 errors int NOT NULL DEFAULT 0,
 detail text
);
CREATE TABLE IF NOT EXISTS source_checks (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 run_id bigint REFERENCES sync_runs(id),
 url text NOT NULL CHECK(url LIKE 'https://%'),
 checked_at timestamptz NOT NULL DEFAULT now(),
 http_status integer,
 state text NOT NULL CHECK(state IN ('REACHABLE','CHANGED','BLOCKED','MISSING','UNAVAILABLE','REDIRECT','PARTIAL')),
 content_sha256 char(64),
 content_type text,
 etag text,
 last_modified text,
 changed boolean NOT NULL DEFAULT false,
 error text
);
CREATE INDEX IF NOT EXISTS source_checks_url_time_idx ON source_checks(url,checked_at DESC);
CREATE TABLE IF NOT EXISTS opportunities (
 id text PRIMARY KEY,
 opportunity_number text,
 title text NOT NULL,
 agency text,
 status text,
 posted_at date,
 closes_at date,
 source_url text NOT NULL CHECK(source_url LIKE 'https://%'),
 source_system text NOT NULL,
 raw jsonb NOT NULL,
 discovered_at timestamptz NOT NULL DEFAULT now(),
 last_seen_at timestamptz NOT NULL DEFAULT now(),
 review_state text NOT NULL DEFAULT 'DISCOVERED'
  CHECK(review_state IN ('DISCOVERED','UNDER_REVIEW','APPROVED','REJECTED'))
);
CREATE INDEX IF NOT EXISTS opportunities_dates_idx ON opportunities(closes_at);
CREATE INDEX IF NOT EXISTS opportunities_text_idx ON opportunities USING gin (
 to_tsvector('english',coalesce(title,'')||' '||coalesce(agency,'')));
CREATE TABLE IF NOT EXISTS evidence_claims (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 program_id text REFERENCES programs(id),
 source_url text NOT NULL CHECK(source_url LIKE 'https://%'),
 source_sha256 char(64) NOT NULL,
 field_name text NOT NULL,
 extracted_value jsonb NOT NULL,
 verbatim_quote text NOT NULL,
 page_locator text NOT NULL,
 quote_found boolean NOT NULL DEFAULT false,
 locator_found boolean NOT NULL DEFAULT false,
 review_state text NOT NULL DEFAULT 'UNVERIFIED'
  CHECK(review_state IN ('UNVERIFIED','EVIDENCE_MATCHED','HUMAN_APPROVED','REJECTED')),
 model_name text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS evidence_claims_program_idx ON evidence_claims(program_id);
