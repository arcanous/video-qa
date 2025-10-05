import { mkdirSync } from 'fs';
import { promises as fsp } from 'fs';
import { join, extname, basename } from 'path';

/**
 * Ensures the uploads directory exists.
 * Creates the directory structure if it doesn't exist.
 */
export function ensureUploadsDir(): void {
  const uploadsDir = join(process.cwd(), 'data', 'uploads');
  try {
    mkdirSync(uploadsDir, { recursive: true });
  } catch {
    // Directory might already exist, ignore error
  }
}

/**
 * Sanitizes a filename for safe filesystem usage.
 * Removes path separators and unsafe characters, converts to lowercase.
 * 
 * @param original - Original filename
 * @returns Sanitized filename safe for filesystem
 */
export function toSafeFileName(original: string): string {
  // Remove path separators and unsafe characters
  return original
    .replace(/[\/\\:*?"<>|]/g, '_')
    .replace(/\s+/g, '_')
    .toLowerCase();
}

/**
 * Writes a video file to the uploads directory and returns the relative path.
 * 
 * Path resolution strategy:
 * - Stores relative paths in database (e.g., "uploads/{id}_{name}.mp4")
 * - Worker resolves to absolute paths via DATA_DIR environment variable
 * - Benefits: Portable across environments, easy to move data
 * 
 * @param id - Video ID (nanoid)
 * @param originalName - Original filename from upload
 * @param buffer - File buffer to write
 * @returns Promise<string> Relative path for database storage
 */
export async function writeVideoFile(id: string, originalName: string, buffer: Buffer): Promise<string> {
  ensureUploadsDir();
  const ext = (extname(originalName) || '.mp4').toLowerCase();
  const base = toSafeFileName(basename(originalName, ext));
  const fileName = `${id}_${base}${ext}`;
  const filePath = join(process.cwd(), 'data', 'uploads', fileName);
  
  await fsp.writeFile(filePath, buffer);
  return `uploads/${fileName}`;
}
