import { NextResponse } from 'next/server';
import { checkDatabase } from '@/lib/db';

export async function GET() {
  try {
    const database = await checkDatabase();
    return NextResponse.json({
      ok: database,
      database,
      authSecretConfigured: Boolean(process.env.AUTH_SECRET),
      databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        database: false,
        authSecretConfigured: Boolean(process.env.AUTH_SECRET),
        databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
      },
      { status: 503 },
    );
  }
}
