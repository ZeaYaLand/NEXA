'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type User = { id: string; username: string; email: string };

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

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
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.replace('/auth/login');
      router.refresh();
    }
  }

  if (loading || !user) {
    return <main className="shell"><section className="feed profile-loading"><p>Загрузка профиля…</p></section></main>;
  }

  const initial = user.username[0]?.toUpperCase() || 'N';

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">NEXA<span>.</span></div>
        <nav>
          <Link href="/">Home</Link>
          <Link className="active" href="/profile">Profile</Link>
        </nav>
      </aside>

      <section className="feed">
        <header className="topbar profile-topbar">
          <div>
            <p className="eyebrow">YOUR SPACE</p>
            <h1>Профиль</h1>
          </div>
          <div className="avatar">{initial}</div>
        </header>

        <section className="profile-hero">
          <div className="profile-cover" />
          <div className="profile-main">
            <div className="profile-avatar gradient">{initial}</div>
            <div className="profile-actions">
              <button type="button" className="profile-action secondary" onClick={logout} disabled={loggingOut}>
                {loggingOut ? 'Выход…' : 'Выйти'}
              </button>
            </div>
            <h2>@{user.username}</h2>
            <p className="profile-email">{user.email}</p>
            <p className="profile-id">ID пользователя: {user.id}</p>
          </div>
        </section>

        <div className="profile-tabs" role="tablist" aria-label="Профиль">
          <button className="selected" type="button">Посты</button>
          <button type="button">Медиа</button>
          <button type="button">Лайки</button>
        </div>

        <section className="profile-empty">
          <div className="profile-empty-icon">✦</div>
          <h3>Твоё пространство</h3>
          <p>Здесь будут отображаться твои публикации.</p>
        </section>
      </section>
    </main>
  );
}
