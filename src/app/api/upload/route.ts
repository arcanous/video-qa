import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { writeVideoFile } from '@lib/file';
import { insertVideo, insertJob } from '@lib/db';

export const runtime = 'nodejs';

/**
 * Upload schema validation for video files.
 * Validates file type and size constraints.
 */
const uploadSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => file.type.startsWith('video/'),
    'File must be a video'
  ).refine(
    (file) => file.size <= 500 * 1024 * 1024, // 500MB limit
    'File size must be less than 500MB'
  ),
});

/**
 * POST /api/upload
 * 
 * Upload flow:
 * 1. Validate file type and size
 * 2. Generate unique video ID
 * 3. Write file to uploads directory
 * 4. Store metadata in database
 * 5. Create processing job for worker
 * 
 * @param request - NextRequest with FormData containing video file
 * @returns Promise<NextResponse> JSON response with video ID or error
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Validate file type and size
    const validation = uploadSchema.safeParse({ file });
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }
    
    // Generate unique video ID
    const id = nanoid();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Write file and get relative path for database
    const storedPath = await writeVideoFile(id, file.name, buffer);
    
    // Store video metadata in database
    await insertVideo(id, file.name, storedPath, file.size);
    
    // Enqueue job for processing (worker will claim via FOR UPDATE SKIP LOCKED)
    await insertJob(id);
    
    return NextResponse.json({ id });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
