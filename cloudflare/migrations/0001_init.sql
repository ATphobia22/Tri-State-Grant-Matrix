-- D1/SQLite schema. Not a PostgreSQL migration.
-- No personal applicant drafts or private application attachments are stored.
CREATE TABLE IF NOT EXISTS counties (
  fips TEXT PRIMARY KEY CHECK(length(fips)=5),
  name TEXT NOT NULL,
  state TEXT NOT NULL CHECK(state IN ('IN','IL','KY')),
  communities TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS programs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  scope TEXT NOT NULL CHECK(scope IN ('IN','IL','KY','FED')),
  sector TEXT NOT NULL,
  status TEXT NOT NULL,
  deadline TEXT,
  official_url TEXT NOT NULL CHECK(official_url LIKE 'https://%'),
  documents_url TEXT NOT NULL CHECK(documents_url LIKE 'https://%'),
  record_json TEXT NOT NULL CHECK(json_valid(record_json)),
  source_sha256 TEXT NOT NULL CHECK(length(source_sha256)=64),
  curator_locked INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS programs_scope_deadline ON programs(scope,deadline);
CREATE INDEX IF NOT EXISTS programs_sector ON programs(sector);
CREATE TABLE IF NOT EXISTS county_sources (
  source_id TEXT PRIMARY KEY,
  county_fips TEXT NOT NULL REFERENCES counties(fips),
  title TEXT NOT NULL,
  source_url TEXT NOT NULL CHECK(source_url LIKE 'https://%'),
  authority TEXT NOT NULL,
  record_json TEXT NOT NULL CHECK(json_valid(record_json))
);
CREATE INDEX IF NOT EXISTS county_sources_county ON county_sources(county_fips);
CREATE TABLE IF NOT EXISTS opportunities (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  agency TEXT,
  status TEXT,
  source_url TEXT NOT NULL CHECK(source_url LIKE 'https://%'),
  closes_at TEXT,
  raw_json TEXT NOT NULL CHECK(json_valid(raw_json)),
  observed_at TEXT NOT NULL,
  review_state TEXT NOT NULL DEFAULT 'DISCOVERED'
    CHECK(review_state IN ('DISCOVERED','UNDER_REVIEW','APPROVED','REJECTED'))
);
CREATE INDEX IF NOT EXISTS opportunities_closes ON opportunities(closes_at);
CREATE TABLE IF NOT EXISTS audit_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  origin TEXT NOT NULL CHECK(origin IN ('grant_links','county_archives')),
  observed_at TEXT NOT NULL,
  imported_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  source_url TEXT NOT NULL,
  entries INTEGER NOT NULL DEFAULT 0,
  UNIQUE(origin,observed_at)
);
CREATE TABLE IF NOT EXISTS source_checks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  origin TEXT NOT NULL CHECK(origin IN ('grant_links','county_archives')),
  url TEXT NOT NULL CHECK(url LIKE 'https://%'),
  checked_at TEXT NOT NULL,
  state TEXT NOT NULL,
  http_status INTEGER,
  content_sha256 TEXT,
  changed INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  UNIQUE(origin,url,checked_at)
);
CREATE INDEX IF NOT EXISTS source_checks_recent ON source_checks(checked_at DESC);
CREATE INDEX IF NOT EXISTS source_checks_url ON source_checks(url,checked_at DESC);
CREATE TABLE IF NOT EXISTS evidence_claims (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  program_id TEXT REFERENCES programs(id),
  source_url TEXT NOT NULL CHECK(source_url LIKE 'https://%'),
  source_sha256 TEXT NOT NULL,
  field_name TEXT NOT NULL,
  value_json TEXT NOT NULL CHECK(json_valid(value_json)),
  verbatim_quote TEXT NOT NULL,
  page_locator TEXT NOT NULL,
  review_state TEXT NOT NULL DEFAULT 'UNVERIFIED',
  model_name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS evidence_claims_program ON evidence_claims(program_id);
