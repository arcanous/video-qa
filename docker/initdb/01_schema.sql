-- Safe to keep; does nothing if already present
CREATE EXTENSION IF NOT EXISTS vector;

-- Idempotent column adds (OK even when created in 00_base.sql)
ALTER TABLE IF EXISTS videos
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'uploaded',
  ADD COLUMN IF NOT EXISTS duration_sec INT,
  ADD COLUMN IF NOT EXISTS original_path TEXT,
  ADD COLUMN IF NOT EXISTS original_name TEXT,
  ADD COLUMN IF NOT EXISTS size_bytes INT,
  ADD COLUMN IF NOT EXISTS normalized_path TEXT;

-- Dependent tables (now valid because videos exists)
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  video_id TEXT REFERENCES videos(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INT NOT NULL DEFAULT 0,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS jobs_set_updated_at ON jobs;
CREATE TRIGGER jobs_set_updated_at BEFORE UPDATE ON jobs
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS scenes (
  id TEXT PRIMARY KEY,
  video_id TEXT REFERENCES videos(id) ON DELETE CASCADE,
  idx INT,
  t_start REAL,
  t_end REAL,
  clip_path TEXT,
  UNIQUE(video_id, idx)
);

CREATE TABLE IF NOT EXISTS frames (
  id TEXT PRIMARY KEY,
  scene_id TEXT REFERENCES scenes(id) ON DELETE CASCADE,
  t_frame REAL,
  path TEXT,
  phash TEXT
);

CREATE TABLE IF NOT EXISTS transcript_segments (
  id TEXT PRIMARY KEY,
  video_id TEXT REFERENCES videos(id) ON DELETE CASCADE,
  t_start REAL,
  t_end REAL,
  text TEXT,
  embedding VECTOR(1536),
  UNIQUE(video_id, t_start, t_end)
);

CREATE TABLE IF NOT EXISTS frame_captions (
  id TEXT PRIMARY KEY,
  frame_id TEXT REFERENCES frames(id) ON DELETE CASCADE,
  caption TEXT,
  entities JSONB,
  embedding VECTOR(1536)
);

-- HNSW vector indexes (pgvector)
CREATE INDEX IF NOT EXISTS transcript_segments_embedding_hnsw
  ON transcript_segments USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS frame_captions_embedding_hnsw
  ON frame_captions USING hnsw (embedding vector_cosine_ops);