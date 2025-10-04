import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { join } from 'path';

let db: Database.Database | null = null;

function ensureDbDir() {
  const dbDir = join(process.cwd(), 'db');
  try {
    mkdirSync(dbDir, { recursive: true });
  } catch {
    // Directory might already exist, ignore error
  }
}

function getDb(): Database.Database {
  if (!db) {
    ensureDbDir();
    const dbPath = join(process.cwd(), 'db', 'videoqa.db');
    db = new Database(dbPath);
    
    // Create table if not exists
    db.exec(`
      CREATE TABLE IF NOT EXISTS videos (
        id TEXT PRIMARY KEY,
        originalName TEXT NOT NULL,
        storedPath TEXT NOT NULL,
        size INTEGER NOT NULL,
        uploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }
  return db;
}

export function getAllVideoIds(): string[] {
  const database = getDb();
  const stmt = database.prepare('SELECT id FROM videos ORDER BY uploadedAt DESC');
  const rows = stmt.all() as { id: string }[];
  return rows.map(row => row.id);
}

export function countVideos(): number {
  const database = getDb();
  const stmt = database.prepare('SELECT COUNT(*) as count FROM videos');
  const result = stmt.get() as { count: number };
  return result.count;
}

export function insertVideo(id: string, originalName: string, storedPath: string, size: number): void {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT INTO videos (id, originalName, storedPath, size)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(id, originalName, storedPath, size);
}
