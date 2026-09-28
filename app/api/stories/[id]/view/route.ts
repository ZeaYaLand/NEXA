import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { ensureSocialMediaSchema } from '@/lib/social-media-schema';

export const dynamic = 'force-dynamic';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await ensureSocialMediaSchema();
    const { id } = await params;
    const result = await db.query(
      `UPDATE stories SET view_count = view_count + 1
       WHERE id=$1 AND expires_at > NOW()
       RETURNING id, view_count`,
      [id],
    );
    if (!result.rowCount) return NextResponse.json({ error: 'История не найдена или уже истекла' }, { status: 404 });
    return NextResponse.json({ id: result.rows[0].id, view_count: result.rows[0].view_count });
  } catch (error) {
    console.error('POST /api/stories/[id]/view', error);
    return NextResponse.json({ error: 'Не удалось зарегистрировать просмотр' }, { status: 500 });
  }
}
