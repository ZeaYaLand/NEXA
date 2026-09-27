import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 1) return NextResponse.json({ users: [] });
  try {
    const current = await getCurrentUser();
    const result = await db.query(`
      SELECT id, username, display_name AS "displayName", avatar_url AS "avatarUrl",
        (SELECT count(*)::int FROM follows f WHERE f.following_id = u.id) AS followers,
        CASE WHEN $2::text IS NULL THEN false
          ELSE EXISTS (SELECT 1 FROM follows f2 WHERE f2.follower_id = $2::uuid AND f2.following_id = u.id)
        END AS "isFollowing",
        CASE WHEN $2::text IS NULL THEN false ELSE u.id = $2::uuid END AS "isSelf"
      FROM users u
      WHERE username ILIKE $1 OR display_name ILIKE $1
      ORDER BY username ASC LIMIT 20
    `, [`%${q}%`, current?.id ?? null]);
    return NextResponse.json({ users: result.rows });
  } catch (error) {
    console.error('user search', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
