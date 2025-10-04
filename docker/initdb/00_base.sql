-- Base objects that must exist first
CREATE EXTENSION IF NOT EXISTS vector;  -- required for VECTOR + HNSW indexes

CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  -- minimal columns + the ones you plan to add
  status TEXT NOT NULL DEFAULT 'uploaded',
  duration_sec INT,
  normalized_path TEXT
);