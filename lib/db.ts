import { Pool } from 'pg';

const globalForPg = globalThis as unknown as { __pgPool?: Pool };
export const pool = globalForPg.__pgPool ??= new Pool({ connectionString: process.env.DATABASE_URL });

// Schema is managed by docker/initdb/ - no app-side DDL
async function ready() {
  // Lightweight connectivity check only
  await pool.query('SELECT 1');
}

export async function getAllVideoIds(): Promise<string[]> {
  await ready();
  const { rows } = await pool.query('SELECT id FROM videos ORDER BY id DESC');
  return rows.map(r => r.id as string);
}

export async function countVideos(): Promise<number> {
  await ready();
  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM videos');
  return rows[0].count as number;
}

export async function insertVideo(id: string, originalName: string, storedPath: string, size: number): Promise<void> {
  await ready();
  await pool.query(
    'INSERT INTO videos (id, normalized_path) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET normalized_path = EXCLUDED.normalized_path',
    [id, storedPath]
  );
}

export async function insertJob(videoId: string): Promise<void> {
  await ready();
  const { nanoid } = await import('nanoid');
  await pool.query(
    'INSERT INTO jobs (id, video_id) VALUES ($1, $2)',
    [nanoid(), videoId]
  );
}

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
