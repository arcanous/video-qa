import { NextRequest, NextResponse } from 'next/server';
import { getVideoSummary } from '@lib/db';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const summary = await getVideoSummary(id);
    
    return NextResponse.json(summary);
  } catch (error) {
    console.error('Summary error:', error);
    return NextResponse.json(
      { error: 'Video not found' },
      { status: 404 }
    );
  }
}
