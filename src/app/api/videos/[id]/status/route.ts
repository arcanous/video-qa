import { NextRequest, NextResponse } from 'next/server';
import { getVideoStatus } from '../../../../../lib/db';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const status = await getVideoStatus(id);
    
    return NextResponse.json(status);
  } catch (error) {
    console.error('Status error:', error);
    return NextResponse.json(
      { error: 'Video not found' },
      { status: 404 }
    );
  }
}
