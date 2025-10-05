import { NextResponse } from 'next/server';
import { getAllVideoIds } from '@lib/db';
import { pool } from '@lib/db';

export async function GET() {
  try {
    const ids = await getAllVideoIds();
    // Fetch full details
    const videos = await Promise.all(
      ids.map(async id => {
        const { rows } = await pool.query(
          'SELECT id, original_name, status FROM videos WHERE id = $1',
          [id]
        );
        return rows[0];
      })
    );
    return NextResponse.json(videos.filter(Boolean));
  } catch {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
