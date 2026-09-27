import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(_request: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  try {
    const result = await db.query(`SELECT id, username, display_name AS "displayName", bio, avatar_url AS "avatarUrl", created_at AS "createdAt" FROM users WHERE lower(username)=lower($1) LIMIT 1`, [username]);
    if (!result.rowCount) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const profile = result.rows[0];
    const counts = await db.query(`SELECT (SELECT count(*)::int FROM follows WHERE following_id=$1) AS followers, (SELECT count(*)::int FROM follows WHERE follower_id=$1) AS following`, [profile.id]);
    const current = await getCurrentUser();
    let isFollowing = false;
    if (current && current.id !== profile.id) {
      const f = await db.query('SELECT 1 FROM follows WHERE follower_id=$1 AND following_id=$2', [current.id, profile.id]);
      isFollowing = !!f.rowCount;
    }
    const posts = await db.query(`SELECT p.id,p.content,p.created_at,u.id AS user_id,u.username,(SELECT count(*)::int FROM post_likes l WHERE l.post_id=p.id) AS like_count,(SELECT count(*)::int FROM comments c WHERE c.post_id=p.id) AS comment_count,${current ? 'EXISTS (SELECT 1 FROM post_likes l WHERE l.post_id=p.id AND l.user_id=$2)' : 'false'} AS liked FROM posts p JOIN users u ON u.id=p.user_id WHERE p.user_id=$1 ORDER BY p.created_at DESC LIMIT 50`, current ? [profile.id, current.id] : [profile.id]);
    return NextResponse.json({ user: profile, followers: counts.rows[0].followers, following: counts.rows[0].following, isFollowing, isSelf: current?.id === profile.id, posts: posts.rows });
  } catch (error) { console.error('GET user profile', error); return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 }); }
}
