import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { canViewUserContent } from '@/lib/nexa-core/privacy';
import type { Visibility } from '@/lib/nexa-core/types';

export async function GET(_request: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  try {
    const result = await db.query(`SELECT id, username, display_name AS "displayName", bio, avatar_url AS "avatarUrl", created_at AS "createdAt" FROM users WHERE lower(username)=lower($1) LIMIT 1`, [decodeURIComponent(username)]);
    if (!result.rowCount) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const profile = result.rows[0];
    const current = await getCurrentUser();

    const blocked = current && current.id !== profile.id ? await db.query(
      'SELECT blocker_id FROM nexa_blocks WHERE (blocker_id=$1 AND blocked_id=$2) OR (blocker_id=$2 AND blocked_id=$1)',
      [current.id, profile.id]
    ) : { rows: [] };
    const blockedByMe = blocked.rows.some(row => row.blocker_id === current?.id);
    const blockedByThem = blocked.rows.some(row => row.blocker_id === profile.id);
    if (blockedByMe || blockedByThem) {
      return NextResponse.json({ user: profile, followers: 0, following: 0, isFollowing: false, isSelf: false, blocked: true, posts: [] });
    }

    const counts = await db.query(`SELECT (SELECT count(*)::int FROM nexa_follows WHERE following_id=$1) AS followers, (SELECT count(*)::int FROM nexa_follows WHERE follower_id=$1) AS following`, [profile.id]);
    let isFollowing = false;
    if (current && current.id !== profile.id) {
      const f = await db.query('SELECT 1 FROM nexa_follows WHERE follower_id=$1 AND following_id=$2', [current.id, profile.id]);
      isFollowing = !!f.rowCount;
    }
    const postsResult = await db.query(`SELECT p.id,p.content,p.created_at,p.media_url,p.media_type,p.visibility,u.id AS user_id,u.username,(SELECT count(*)::int FROM post_likes l WHERE l.post_id=p.id) AS like_count,(SELECT count(*)::int FROM comments c WHERE c.post_id=p.id) AS comment_count,${current ? 'EXISTS (SELECT 1 FROM post_likes l WHERE l.post_id=p.id AND l.user_id=$2)' : 'false'} AS liked FROM posts p JOIN users u ON u.id=p.user_id WHERE p.user_id=$1 ORDER BY p.created_at DESC LIMIT 50`, current ? [profile.id, current.id] : [profile.id]);
    const posts = [];
    for (const post of postsResult.rows) {
      if (await canViewUserContent(current?.id ?? null, profile.id, post.visibility as Visibility)) posts.push(post);
    }
    return NextResponse.json({ user: profile, followers: counts.rows[0].followers, following: counts.rows[0].following, isFollowing, isSelf: current?.id === profile.id, blocked: false, posts });
  } catch (error) { console.error('GET user profile', error); return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 }); }
}
