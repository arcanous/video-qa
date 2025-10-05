import { embed } from 'ai';
import { openai } from './ai';
import { pool } from './db';

// 1. Embed query text → 1536-dim vector
export async function embedQuery(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: openai.textEmbedding('text-embedding-3-small'),
    value: text,
  });
  return embedding;
}

// 2. Search transcripts by vector similarity
export async function searchTranscripts(videoId: string, embedding: number[], limit = 8) {
  const { rows } = await pool.query(
    `SELECT id, text, t_start, t_end, 
            1 - (embedding <=> $1::vector) AS similarity
     FROM transcript_segments
     WHERE video_id = $2
     ORDER BY embedding <=> $1::vector
     LIMIT $3`,
    [JSON.stringify(embedding), videoId, limit]
  );
  return rows;
}

// 3. Search frame captions by vector similarity
export async function searchFrameCaptions(videoId: string, embedding: number[], limit = 8) {
  const { rows } = await pool.query(
    `SELECT fc.id, fc.frame_id, fc.caption, fc.entities,
            f.path, f.t_frame,
            1 - (fc.embedding <=> $1::vector) AS similarity
     FROM frame_captions fc
     JOIN frames f ON fc.frame_id = f.id
     JOIN scenes s ON f.scene_id = s.id
     WHERE s.video_id = $2
     ORDER BY fc.embedding <=> $1::vector
     LIMIT $3`,
    [JSON.stringify(embedding), videoId, limit]
  );
  return rows;
}

// 4. Format context for LLM prompt
export function formatContext(transcripts: Array<{text: string, t_start: number, t_end: number}>, frames: Array<{caption: string, frame_id: string, entities?: {controls?: unknown[]}}>): string {
  let context = '';
  
  if (transcripts.length > 0) {
    context += 'Transcript:\n';
    transcripts.forEach(t => {
      const start = formatTime(t.t_start);
      const end = formatTime(t.t_end);
      context += `[${start}-${end}] ${t.text}\n`;
    });
  }
  
  if (frames.length > 0) {
    context += '\nFrames:\n';
    frames.forEach(f => {
      context += `[${f.frame_id}] ${f.caption}\n`;
      if (f.entities?.controls && f.entities.controls.length > 0) {
        context += `  Controls: ${JSON.stringify(f.entities.controls)}\n`;
      }
    });
  }
  
  return context;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
