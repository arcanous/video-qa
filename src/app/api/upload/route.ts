import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { writeVideoFile } from '../../../../lib/file';
import { insertVideo, insertJob } from '../../../../lib/db';

export const runtime = 'nodejs';

const uploadSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => file.type.startsWith('video/'),
    'File must be a video'
  ).refine(
    (file) => file.size <= 500 * 1024 * 1024, // 500MB limit
    'File size must be less than 500MB'
  ),
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    const validation = uploadSchema.safeParse({ file });
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }
    
    const id = nanoid();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const storedPath = await writeVideoFile(id, file.name, buffer);
    
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
