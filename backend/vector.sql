-- Optional semantic index: run only when pgvector + a 4096-D embedding model are provisioned.
-- Qwen3-Embedding-8B is not installed by default. No embedding is fabricated.
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE IF NOT EXISTS document_embeddings (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_url text NOT NULL CHECK(source_url LIKE 'https://%'),
  document_sha256 char(64) NOT NULL,
  chunk_id integer NOT NULL,
  page_locator text,
  content_excerpt text NOT NULL,
  model_name text NOT NULL,
  embedding vector(4096) NOT NULL,
  embedded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(document_sha256,chunk_id,model_name)
);
CREATE INDEX IF NOT EXISTS document_embeddings_sha_idx ON document_embeddings(document_sha256);
