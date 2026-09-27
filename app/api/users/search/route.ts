import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 1) return NextResponse.json({ users: [] });
  try {
    const result = await db.query(`
      SELECT id, username, display_name AS "displayName", avatar_url AS "avatarUrl",
        (SELECT count(*)::int FROM follows f WHERE f.following_id = u.id) AS followers
      FROM users u
      WHERE username ILIKE $1 OR display_name ILIKE $1
      ORDER BY username ASC LIMIT 20
    `, [`%${q}%`]);
    return NextResponse.json({ users: result.rows });
  } catch (error) {
    console.error('user search', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
