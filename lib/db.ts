import { Pool } from 'pg';

// Database configuration constants
const DB_CONNECTION_TIMEOUT = 10000; // 10 seconds
const DB_POOL_SIZE = 5;

/**
 * Database connection pool for PostgreSQL operations.
 * Uses global singleton pattern to prevent multiple pool instances.
 */
const globalForPg = globalThis as unknown as { __pgPool?: Pool };
export const pool = globalForPg.__pgPool ??= new Pool({ 
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: DB_CONNECTION_TIMEOUT,
  max: DB_POOL_SIZE
});

/**
 * Ensures database connection is ready before operations.
 * Performs lightweight connectivity check only - no schema validation.
 */
async function ready() {
  // Lightweight connectivity check only
  await pool.query('SELECT 1');
}

/**
 * Retrieves all video IDs from the database, ordered by creation date (newest first).
 * @returns Promise<string[]> Array of video IDs
 */
export async function getAllVideoIds(): Promise<string[]> {
  await ready();
  const { rows } = await pool.query('SELECT id FROM videos ORDER BY id DESC');
  return rows.map(r => r.id as string);
}

/**
 * Counts the total number of videos in the database.
 * @returns Promise<number> Total video count
 */
export async function countVideos(): Promise<number> {
  await ready();
  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM videos');
  return rows[0].count as number;
}

/**
 * Inserts or updates video metadata in the database.
 * Uses ON CONFLICT to handle idempotent operations - safe to re-run.
 * 
 * @param id - Video ID (nanoid)
 * @param originalName - Original filename from upload
 * @param storedPath - Relative path to stored file (e.g., "uploads/{id}_{name}.mp4")
 * @param size - File size in bytes
 */
export async function insertVideo(id: string, originalName: string, storedPath: string, size: number): Promise<void> {
  await ready();
  await pool.query(
    'INSERT INTO videos (id, original_path, original_name, size_bytes) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET original_path = EXCLUDED.original_path, original_name = EXCLUDED.original_name, size_bytes = EXCLUDED.size_bytes',
    [id, storedPath, originalName, size]
  );
}

/**
 * Creates a processing job for a video.
 * The worker will poll for this job and process the video through the pipeline.
 * 
 * @param videoId - Video ID to process
 */
export async function insertJob(videoId: string): Promise<void> {
  await ready();
  const { nanoid } = await import('nanoid');
  await pool.query(
    'INSERT INTO jobs (id, video_id) VALUES ($1, $2)',
    [nanoid(), videoId]
  );
}

/**
 * Gets the current processing status of a video.
 * Returns the video status, number of processing attempts, and last update time.
 * 
 * @param videoId - Video ID to check
 * @returns Promise<{status, attempts, updatedAt}> Video status information
 * @throws Error if video not found
 */
export async function getVideoStatus(videoId: string): Promise<{ status: string; attempts: number; updatedAt: string | null }> {
  await ready();
  const { rows } = await pool.query(`
    SELECT 
      v.status,
      COALESCE(j.attempts, 0) as attempts,
      j.updated_at as updatedAt
    FROM videos v
    LEFT JOIN jobs j ON v.id = j.video_id
    WHERE v.id = $1
    ORDER BY j.updated_at DESC
    LIMIT 1
  `, [videoId]);
  
  if (rows.length === 0) {
    throw new Error('Video not found');
  }
  
  return {
    status: rows[0].status as string,
    attempts: rows[0].attempts as number,
    updatedAt: rows[0].updatedat ? rows[0].updatedat.toISOString() : null
  };
}

/**
 * Gets processing results summary for a video.
 * Returns counts of scenes, frames, transcript segments, and total transcript characters.
 * 
 * @param videoId - Video ID to summarize
 * @returns Promise<{scenes, frames, transcriptSegments, transcriptChars}> Processing results
 * @throws Error if video not found
 */
export async function getVideoSummary(videoId: string): Promise<{ scenes: number; frames: number; transcriptSegments: number; transcriptChars: number }> {
  await ready();
  const { rows } = await pool.query(`
    SELECT 
      (SELECT COUNT(*)::int FROM scenes WHERE video_id = $1) as scenes,
      (SELECT COUNT(*)::int FROM frames f JOIN scenes s ON f.scene_id = s.id WHERE s.video_id = $1) as frames,
      (SELECT COUNT(*)::int FROM transcript_segments WHERE video_id = $1) as transcriptSegments,
      (SELECT COALESCE(SUM(LENGTH(text)), 0)::int FROM transcript_segments WHERE video_id = $1) as transcriptChars
  `, [videoId]);
  
  if (rows.length === 0) {
    throw new Error('Video not found');
  }
  
  return {
    scenes: rows[0].scenes as number,
    frames: rows[0].frames as number,
    transcriptSegments: rows[0].transcriptsegments as number,
    transcriptChars: rows[0].transcriptchars as number
  };
}

export async function getVideoById(id: string) {
  await ready();
  const { rows } = await pool.query(
    'SELECT id, original_name, status FROM videos WHERE id = $1',
    [id]
  );
  return rows[0] || null;
}
