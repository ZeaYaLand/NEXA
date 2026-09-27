import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export type User = {
  id: string;
  username: string;
  email: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  createdAt: string;
};

const SECRET = process.env.AUTH_SECRET || 'nexa-development-secret-change-me';
const users = new Map<string, User & { passwordHash: string }>();

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function createToken(user: User) {
  return jwt.sign({ sub: user.id, username: user.username }, SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string) {
  return jwt.verify(token, SECRET) as { sub: string; username: string };
}

export async function createUser(input: { username: string; email: string; password: string; displayName?: string }) {
  const username = input.username.trim().toLowerCase();
  const email = input.email.trim().toLowerCase();
  if ([...users.values()].some((u) => u.username === username || u.email === email)) throw new Error('USER_EXISTS');
  const user: User = {
    id: crypto.randomUUID(), username, email,
    displayName: input.displayName?.trim() || username,
    bio: '', avatarUrl: null, createdAt: new Date().toISOString()
  };
  users.set(user.id, { ...user, passwordHash: await hashPassword(input.password) });
  return user;
}

export async function authenticate(email: string, password: string) {
  const user = [...users.values()].find((u) => u.email === email.trim().toLowerCase());
  if (!user || !(await verifyPassword(password, user.passwordHash))) return null;
  const { passwordHash: _, ...safeUser } = user;
  return { user: safeUser, token: createToken(safeUser) };
}

export function getUser(id: string) {
  const user = users.get(id);
  if (!user) return null;
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}
