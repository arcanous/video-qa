import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ videoId: string; frameNum: string }> }
) {
  try {
    const { videoId, frameNum } = await params;
    
    // Validate frame number is numeric
    const frameNumber = parseInt(frameNum, 10);
    if (isNaN(frameNumber) || frameNumber < 0) {
      return NextResponse.json({ error: 'Invalid frame number' }, { status: 400 });
    }
    
    // Construct the file path
    const paddedFrameNum = frameNumber.toString().padStart(3, '0');
    const imagePath = join(process.cwd(), 'data', 'frames', videoId, `scene_${paddedFrameNum}.jpg`);
    
    // Read the image file
    const imageBuffer = await readFile(imagePath);
    
    // Return the image with appropriate headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        'Content-Length': imageBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Frame image error:', error);
    return NextResponse.json({ error: 'Frame image not found' }, { status: 404 });
  }
}
