import { Pool } from 'pg';

const globalForPg = globalThis as unknown as { __pgPool?: Pool };
export const pool = globalForPg.__pgPool ??= new Pool({ connectionString: process.env.DATABASE_URL });

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS videos (
      id TEXT PRIMARY KEY,
      originalName TEXT NOT NULL,
      storedPath TEXT NOT NULL,
      size INTEGER NOT NULL,
      uploadedAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

let schemaEnsured: Promise<void> | null = null;
async function ready() {
  if (!schemaEnsured) schemaEnsured = ensureSchema();
  return schemaEnsured;
}

export async function getAllVideoIds(): Promise<string[]> {
  await ready();
  const { rows } = await pool.query('SELECT id FROM videos ORDER BY uploadedAt DESC');
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
    'INSERT INTO videos (id, originalName, storedPath, size) VALUES ($1, $2, $3, $4)',
    [id, originalName, storedPath, size]
  );
}
