import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './db';

export type User = {
  id: string;
  username: string;
  email: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  createdAt: string;
};

const SECRET = process.env.AUTH_SECRET;
if (!SECRET) console.warn('AUTH_SECRET is not set; configure it in the deployment environment.');
const tokenSecret = SECRET || 'nexa-development-secret-change-me';

function toUser(row: any): User {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    displayName: row.display_name,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function hashPassword(password: string) { return bcrypt.hash(password, 12); }
export async function verifyPassword(password: string, hash: string) { return bcrypt.compare(password, hash); }
export function createToken(user: User) { return jwt.sign({ sub: user.id, username: user.username }, tokenSecret, { expiresIn: '7d' }); }
export function verifyToken(token: string) { return jwt.verify(token, tokenSecret) as { sub: string; username: string }; }

export async function createUser(input: { username: string; email: string; password: string; displayName?: string }) {
  const username = input.username.trim().toLowerCase();
  const email = input.email.trim().toLowerCase();
  const passwordHash = await hashPassword(input.password);
  try {
    const result = await db.query(
      `INSERT INTO users (username, email, password_hash, display_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, display_name, bio, avatar_url, created_at`,
      [username, email, passwordHash, input.displayName?.trim() || username]
    );
    return toUser(result.rows[0]);
  } catch (error: any) {
    if (error?.code === '23505') throw new Error('USER_EXISTS');
    throw error;
  }
}

export async function authenticate(email: string, password: string) {
  const result = await db.query(
    `SELECT id, username, email, password_hash, display_name, bio, avatar_url, created_at
     FROM users WHERE email = $1 LIMIT 1`,
    [email.trim().toLowerCase()]
  );
  const row = result.rows[0];
  if (!row || !(await verifyPassword(password, row.password_hash))) return null;
  const user = toUser(row);
  return { user, token: createToken(user) };
}

export async function getUser(id: string) {
  const result = await db.query(
    `SELECT id, username, email, display_name, bio, avatar_url, created_at FROM users WHERE id = $1 LIMIT 1`,
    [id]
  );
  return result.rows[0] ? toUser(result.rows[0]) : null;
}
