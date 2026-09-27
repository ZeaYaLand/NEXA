'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({email,password}) });
      const data = await res.json();
      if (!res.ok) { setError(data.error === 'INVALID_CREDENTIALS' ? 'Неверный email или пароль.' : 'Проверьте данные.'); return; }
      router.push('/'); router.refresh();
    } finally { setLoading(false); }
  }

  return <main className="auth-page"><div className="auth-card"><div className="auth-brand">NEXA<span>.</span></div><p className="eyebrow">WELCOME BACK</p><h1>Войти</h1><p className="auth-subtitle">Вернитесь в своё пространство NEXA.</p><form onSubmit={submit}><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email" /></label><label>Пароль<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={8} autoComplete="current-password" /></label>{error && <p className="auth-error">{error}</p>}<button className="auth-submit" disabled={loading}>{loading ? 'Входим…' : 'Войти'}</button></form><p className="auth-switch">Нет аккаунта? <Link href="/auth/register">Создать аккаунт</Link></p></div></main>;
}
