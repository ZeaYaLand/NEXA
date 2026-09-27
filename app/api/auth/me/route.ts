import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUser, verifyToken } from '@/lib/auth';

export async function GET() {
  const token = (await cookies()).get('nexa_session')?.value;
  if (!token) return NextResponse.json({ user: null });
  try {
    const payload = verifyToken(token);
    const user = await getUser(payload.sub);
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null });
  }
}
