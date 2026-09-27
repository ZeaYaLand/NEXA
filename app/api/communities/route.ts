import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const q = new URL(req.url).searchParams.get('q')?.trim() || '';
  const like = `%${q}%`;
  const r = await db.query(`
    SELECT c.id, c.type, c.title AS name, c.description, c.username,
           c.is_public, c.created_at, c.owner_id,
           COUNT(cm.user_id)::int AS members,
           COUNT(*) FILTER (WHERE cm.role IN ('owner','admin'))::int AS admins,
           (c.owner_id=$1) AS is_owner,
           EXISTS (SELECT 1 FROM conversation_members me WHERE me.conversation_id=c.id AND me.user_id=$1 AND me.status='active') AS is_member
    FROM conversations c
    LEFT JOIN conversation_members cm ON cm.conversation_id=c.id AND cm.status='active'
    WHERE c.type IN ('group','channel')
      AND (c.is_public=true OR c.owner_id=$1 OR EXISTS (
        SELECT 1 FROM conversation_members me
        WHERE me.conversation_id=c.id AND me.user_id=$1 AND me.status='active'
      ))
      AND ($2='' OR c.title ILIKE $3 OR c.username ILIKE $3 OR c.description ILIKE $3)
    GROUP BY c.id
    ORDER BY c.created_at DESC
    LIMIT 100`, [user.id, q, like]);
  return NextResponse.json({ communities: r.rows });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const type = body.type === 'channel' ? 'channel' : 'group';
  const name = String(body.name || '').trim();
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  const description = String(body.description || '').trim() || null;
  const isPublic = Boolean(body.isPublic);
  const username = body.username ? String(body.username).trim().replace(/^@/, '').toLowerCase() : null;
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    if (username) {
      const exists = await client.query('SELECT 1 FROM conversations WHERE lower(username)=$1 LIMIT 1', [username]);
      if (exists.rowCount) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
      }
    }
    const c = await client.query(`INSERT INTO conversations (type,title,description,username,is_public,owner_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id,type,title AS name,description,username,is_public,created_at`, [type,name,description,username,isPublic,user.id]);
    const community = c.rows[0];
    await client.query(`INSERT INTO conversation_members (conversation_id,user_id,role,status) VALUES ($1,$2,'owner','active')`, [community.id,user.id]);
    await client.query('COMMIT');
    return NextResponse.json({ community }, { status: 201 });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
    return NextResponse.json({ error: 'Failed to create community' }, { status: 500 });
  } finally { client.release(); }
}
