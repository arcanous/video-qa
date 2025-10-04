import { mkdirSync } from 'fs';
import { promises as fsp } from 'fs';
import { join, extname, basename } from 'path';

export function ensureUploadsDir(): void {
  const uploadsDir = join(process.cwd(), 'data', 'uploads');
  try {
    mkdirSync(uploadsDir, { recursive: true });
  } catch {
    // Directory might already exist, ignore error
  }
}

export function toSafeFileName(original: string): string {
  // Remove path separators and unsafe characters
  return original
    .replace(/[\/\\:*?"<>|]/g, '_')
    .replace(/\s+/g, '_')
    .toLowerCase();
}

export async function writeVideoFile(id: string, originalName: string, buffer: Buffer): Promise<string> {
  ensureUploadsDir();
  const ext = (extname(originalName) || '.mp4').toLowerCase();
  const base = toSafeFileName(basename(originalName, ext));
  const fileName = `${id}_${base}${ext}`;
  const filePath = join(process.cwd(), 'data', 'uploads', fileName);
  
  await fsp.writeFile(filePath, buffer);
  return `data/uploads/${fileName}`;
}
