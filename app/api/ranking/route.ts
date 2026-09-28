import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { calculateNexaRanking } from '@/lib/nexa-core/engine';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [ranking, currentUser] = await Promise.all([calculateNexaRanking(50), getCurrentUser()]);
    const me = currentUser ? ranking.find(row => row.userId === currentUser.id) ?? null : null;
    return NextResponse.json({
      period: 'rolling_7d',
      generatedAt: new Date().toISOString(),
      crownRule: 'Top 10 + quality gate',
      ranking,
      me,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('GET /api/ranking', error);
    return NextResponse.json({ error: 'Не удалось рассчитать рейтинг NEXA' }, { status: 500 });
  }
}
