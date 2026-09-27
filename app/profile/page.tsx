'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type User = { id: string; username: string; email: string };

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (!data.user) router.replace('/auth/login');
        else setUser(data.user);
      })
      .catch(() => router.replace('/auth/login'))
      .finally(() => setLoading(false));
  }, [router]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/auth/login');
    router.refresh();
  }

  if (loading || !user) return <main className="shell"><section className="feed"><p>Загрузка профиля…</p></section></main>;

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">NEXA<span>.</span></div>
        <nav><Link href="/">Home</Link><Link className="active" href="/profile">Profile</Link></nav>
      </aside>
      <section className="feed">
        <header className="topbar">
          <div><p className="eyebrow">YOUR SPACE</p><h1>Profile</h1></div>
          <div className="avatar">{user.username[0].toUpperCase()}</div>
        </header>
        <article className="composer">
          <div className="mini-avatar gradient">{user.username[0].toUpperCase()}</div>
          <div className="composer-content"><p>@{user.username}</p><span>{user.email}</span></div>
        </article>
        <div className="auth-cta">
          <button type="button" onClick={logout}>Выйти</button>
        </div>
      </section>
    </main>
  );
}
