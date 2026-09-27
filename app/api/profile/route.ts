import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUser, verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';

const MAX_AVATAR_DATA_URL = 300_000;

export async function PATCH(request: Request) {
  const token = (await cookies()).get('nexa_session')?.value;
  if (!token) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  try {
    const payload = verifyToken(token);
    const body = await request.json();
    const displayName = typeof body.displayName === 'string' ? body.displayName.trim().slice(0, 60) : undefined;
    const bio = typeof body.bio === 'string' ? body.bio.trim().slice(0, 160) : undefined;
    const avatarUrl = typeof body.avatarUrl === 'string' ? body.avatarUrl.trim() : undefined;

    if (avatarUrl !== undefined && avatarUrl.length > MAX_AVATAR_DATA_URL) {
      return NextResponse.json({ error: 'AVATAR_TOO_LARGE' }, { status: 413 });
    }

    if (avatarUrl && !/^https?:\/\//i.test(avatarUrl) && !/^data:image\/(jpeg|jpg|png|webp);base64,/i.test(avatarUrl)) {
      return NextResponse.json({ error: 'INVALID_AVATAR' }, { status: 400 });
    }

    if (displayName === undefined && bio === undefined && avatarUrl === undefined) {
      return NextResponse.json({ error: 'NOTHING_TO_UPDATE' }, { status: 400 });
    }

    const current = await getUser(payload.sub);
    if (!current) return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 404 });

    const result = await db.query(
      `UPDATE users
       SET display_name = $1, bio = $2, avatar_url = $3
       WHERE id = $4
       RETURNING id, username, email, display_name, bio, avatar_url, created_at`,
      [
        displayName ?? current.displayName,
        bio ?? current.bio,
        avatarUrl !== undefined ? (avatarUrl || null) : current.avatarUrl,
        payload.sub,
      ]
    );

    const row = result.rows[0];
    return NextResponse.json({
      user: {
        id: row.id,
        username: row.username,
        email: row.email,
        displayName: row.display_name,
        bio: row.bio,
        avatarUrl: row.avatar_url,
        createdAt: new Date(row.created_at).toISOString(),
      },
    });
  } catch {
    return NextResponse.json({ error: 'INVALID_REQUEST' }, { status: 400 });
  }
}
