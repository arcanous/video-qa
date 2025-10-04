import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

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

export function writeVideoFile(id: string, originalName: string, buffer: Buffer): string {
  ensureUploadsDir();
  const safeName = toSafeFileName(originalName);
  const fileName = `${id}_${safeName}.mp4`;
  const filePath = join(process.cwd(), 'data', 'uploads', fileName);
  
  writeFileSync(filePath, buffer);
  return `data/uploads/${fileName}`;
}
