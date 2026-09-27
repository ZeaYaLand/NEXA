import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createUser, createToken } from '@/lib/auth';

const schema = z.object({
  username: z.string().min(3).max(24).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email().max(120),
  password: z.string().min(8).max(72),
  displayName: z.string().min(1).max(40).optional()
});

export async function POST(request: Request) {
  try {
    const data = schema.parse(await request.json());
    const user = await createUser(data);
    const response = NextResponse.json({ user }, { status: 201 });
    response.cookies.set('nexa_session', createToken(user), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/' });
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'INVALID_INPUT', fields: error.flatten().fieldErrors }, { status: 400 });
    if (error instanceof Error && error.message === 'USER_EXISTS') return NextResponse.json({ error: 'USER_EXISTS' }, { status: 409 });
    return NextResponse.json({ error: 'REGISTRATION_FAILED' }, { status: 500 });
  }
}
