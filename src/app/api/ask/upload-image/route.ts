import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { nanoid } from 'nanoid';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });
    
    // Validate
    const validTypes = ['image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Too large' }, { status: 400 });
    }
    
    // Save
    const ext = file.type === 'image/png' ? 'png' : 'jpg';
    const imageId = nanoid();
    const filename = `${imageId}.${ext}`;
    const dir = join(process.cwd(), 'data', 'ask-uploads');
    await mkdir(dir, { recursive: true });
    
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(join(dir, filename), buffer);
    
    return NextResponse.json({ 
      imageId, 
      mediaType: file.type,
      path: `data/ask-uploads/${filename}`
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
