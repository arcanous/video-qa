-- PostgreSQL Database Schema for Video QA Application
-- Consolidated initialization script combining all schema components
-- This replaces the previous three-file approach (00_base.sql, 01_schema.sql, 02_migrate_phash.sql)

-- 1. Extensions
-- Required for vector operations and HNSW indexes
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Base tables (no dependencies)
-- Videos table with all required columns from the start
CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'uploaded',
  duration_sec INT,
  original_path TEXT,
  original_name TEXT,
  size_bytes INT,
  normalized_path TEXT
);

-- 3. Dependent tables (with foreign keys)
-- Jobs table for processing queue
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  video_id TEXT REFERENCES videos(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INT NOT NULL DEFAULT 0,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scenes table for video segmentation
CREATE TABLE IF NOT EXISTS scenes (
  id TEXT PRIMARY KEY,
  video_id TEXT REFERENCES videos(id) ON DELETE CASCADE,
  idx INT,
  t_start REAL,
  t_end REAL,
  clip_path TEXT,
  UNIQUE(video_id, idx)
);

-- Frames table for individual frame storage
-- phash is defined as TEXT from the start (no migration needed)
CREATE TABLE IF NOT EXISTS frames (
  id TEXT PRIMARY KEY,
  scene_id TEXT REFERENCES scenes(id) ON DELETE CASCADE,
  t_frame REAL,
  path TEXT,
  phash TEXT
);

-- Transcript segments with vector embeddings
CREATE TABLE IF NOT EXISTS transcript_segments (
  id TEXT PRIMARY KEY,
  video_id TEXT REFERENCES videos(id) ON DELETE CASCADE,
  t_start REAL,
  t_end REAL,
  text TEXT,
  embedding VECTOR(1536),
  UNIQUE(video_id, t_start, t_end)
);

-- Frame captions with vector embeddings
CREATE TABLE IF NOT EXISTS frame_captions (
  id TEXT PRIMARY KEY,
  frame_id TEXT REFERENCES frames(id) ON DELETE CASCADE,
  caption TEXT,
  entities JSONB,
  embedding VECTOR(1536)
);

-- 4. Functions
-- Trigger function for automatic updated_at timestamp
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN 
  NEW.updated_at = NOW(); 
  RETURN NEW; 
END; 
$$ LANGUAGE plpgsql;

-- 5. Triggers
-- Drop existing trigger if it exists, then create new one
DROP TRIGGER IF EXISTS jobs_set_updated_at ON jobs;
CREATE TRIGGER jobs_set_updated_at 
  BEFORE UPDATE ON jobs
  FOR EACH ROW 
  EXECUTE FUNCTION set_updated_at();

-- 6. Indexes (HNSW for vector search)
-- Vector similarity indexes for semantic search
CREATE INDEX IF NOT EXISTS transcript_segments_embedding_hnsw
  ON transcript_segments USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS frame_captions_embedding_hnsw
  ON frame_captions USING hnsw (embedding vector_cosine_ops);
