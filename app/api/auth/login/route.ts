import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticate } from '@/lib/auth';

const schema = z.object({ email: z.string().email(), password: z.string().min(8).max(72) });

export async function POST(request: Request) {
  try {
    const data = schema.parse(await request.json());
    const result = await authenticate(data.email, data.password);
    if (!result) return NextResponse.json({ error: 'INVALID_CREDENTIALS' }, { status: 401 });
    const response = NextResponse.json({ user: result.user });
    response.cookies.set('nexa_session', result.token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/' });
    return response;
  } catch {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
  }
}
