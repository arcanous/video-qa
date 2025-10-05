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

// 2b. Search transcripts across multiple videos
export async function searchTranscriptsMulti(videoIds: string[], embedding: number[], limit = 8) {
  const { rows } = await pool.query(
    `SELECT ts.id, ts.text, ts.t_start, ts.t_end, ts.video_id, v.original_name,
            1 - (ts.embedding <=> $1::vector) AS similarity
     FROM transcript_segments ts
     JOIN videos v ON ts.video_id = v.id
     WHERE ts.video_id = ANY($2)
     ORDER BY ts.embedding <=> $1::vector
     LIMIT $3`,
    [JSON.stringify(embedding), videoIds, limit]
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

// 3b. Search frame captions across multiple videos
export async function searchFrameCaptionsMulti(videoIds: string[], embedding: number[], limit = 8) {
  const { rows } = await pool.query(
    `SELECT fc.id, fc.frame_id, fc.caption, fc.entities,
            f.path, f.t_frame, s.video_id, v.original_name,
            1 - (fc.embedding <=> $1::vector) AS similarity
     FROM frame_captions fc
     JOIN frames f ON fc.frame_id = f.id
     JOIN scenes s ON f.scene_id = s.id
     JOIN videos v ON s.video_id = v.id
     WHERE s.video_id = ANY($2)
     ORDER BY fc.embedding <=> $1::vector
     LIMIT $3`,
    [JSON.stringify(embedding), videoIds, limit]
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

// 4b. Format context for multiple videos
export function formatContextMulti(transcripts: Array<{text: string, t_start: number, t_end: number, video_id: string, original_name: string}>, frames: Array<{caption: string, frame_id: string, entities?: {controls?: unknown[]}, video_id: string, original_name: string}>, userImageCaption?: string): string {
  let context = '';
  
  // Add user image context at the top if provided
  if (userImageCaption) {
    context += '**User Provided Image Context:**\n';
    context += `${userImageCaption}\n\n`;
  }
  
  // Group transcripts by video
  const transcriptGroups = new Map<string, Array<{text: string, t_start: number, t_end: number}>>();
  transcripts.forEach(t => {
    if (!transcriptGroups.has(t.video_id)) {
      transcriptGroups.set(t.video_id, []);
    }
    transcriptGroups.get(t.video_id)!.push({ text: t.text, t_start: t.t_start, t_end: t.t_end });
  });
  
  // Group frames by video
  const frameGroups = new Map<string, Array<{caption: string, frame_id: string, entities?: {controls?: unknown[]}}>>();
  frames.forEach(f => {
    if (!frameGroups.has(f.video_id)) {
      frameGroups.set(f.video_id, []);
    }
    frameGroups.get(f.video_id)!.push({ caption: f.caption, frame_id: f.frame_id, entities: f.entities });
  });
  
  // Format each video's content
  const allVideoIds = new Set([...transcriptGroups.keys(), ...frameGroups.keys()]);
  
  allVideoIds.forEach(videoId => {
    const videoName = transcripts.find(t => t.video_id === videoId)?.original_name || 
                     frames.find(f => f.video_id === videoId)?.original_name || 
                     videoId;
    
    context += `**Video: "${videoName}"**\n`;
    
    const videoTranscripts = transcriptGroups.get(videoId) || [];
    if (videoTranscripts.length > 0) {
      context += 'Transcript:\n';
      videoTranscripts.forEach(t => {
        const start = formatTime(t.t_start);
        const end = formatTime(t.t_end);
        context += `[T: ${start}-${end}] ${t.text}\n`;
      });
    }
    
    const videoFrames = frameGroups.get(videoId) || [];
    if (videoFrames.length > 0) {
      context += '\nFrames:\n';
      videoFrames.forEach(f => {
        context += `[F: ${f.frame_id}] ${f.caption}\n`;
        if (f.entities?.controls && f.entities.controls.length > 0) {
          context += `  Controls: ${JSON.stringify(f.entities.controls)}\n`;
        }
      });
    }
    
    context += '\n';
  });
  
  return context;
}

// 5. Multimodal search function
export async function searchMultimodal(
  videoIds: string[],
  textEmbedding: number[],
  imageCaption: string | null,
  limit = 8
) {
  if (!imageCaption) {
    // No image - use existing multi-video search
    const [transcripts, frames] = await Promise.all([
      searchTranscriptsMulti(videoIds, textEmbedding, limit),
      searchFrameCaptionsMulti(videoIds, textEmbedding, limit)
    ]);
    return { transcripts, frames };
  }
  
  // With image - search both modalities
  const imageCaptionEmbedding = await embedQuery(imageCaption);
  
  const [transcripts, textFrames, imageFrames] = await Promise.all([
    searchTranscriptsMulti(videoIds, textEmbedding, Math.ceil(limit / 2)),
    searchFrameCaptionsMulti(videoIds, textEmbedding, Math.ceil(limit / 4)),
    searchFrameCaptionsMulti(videoIds, imageCaptionEmbedding, Math.ceil(limit / 4))
  ]);
  
  // Merge frame results, deduplicate by frame_id
  const frameMap = new Map();
  [...textFrames, ...imageFrames].forEach(frame => {
    if (!frameMap.has(frame.frame_id) || frame.similarity > frameMap.get(frame.frame_id).similarity) {
      frameMap.set(frame.frame_id, frame);
    }
  });
  
  const frames = Array.from(frameMap.values())
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, Math.ceil(limit / 2));
  
  return { transcripts, frames };
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
