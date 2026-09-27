import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUser, verifyToken } from '@/lib/auth';

export async function GET() {
  const token = (await cookies()).get('nexa_session')?.value;
  if (!token) return NextResponse.json({ user: null });
  try {
    const payload = verifyToken(token);
    return NextResponse.json({ user: getUser(payload.sub) });
  } catch {
    return NextResponse.json({ user: null });
  }
}
