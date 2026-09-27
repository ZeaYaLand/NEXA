import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const owner = await db.query(
    `SELECT id, type FROM conversations WHERE id=$1 AND owner_id=$2 AND type IN ('group','channel') LIMIT 1`,
    [id, user.id]
  );
  if (!owner.rowCount) return NextResponse.json({ error: 'Only the owner can delete this community' }, { status: 403 });

  await db.query('DELETE FROM conversations WHERE id=$1', [id]);
  return NextResponse.json({ ok: true, id });
}
