'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type User = { id: string; username: string; email: string };
type Post = { id: string; content: string; created_at: string; user_id: string; username: string };

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  const loadPosts = async () => {
    try {
      const res = await fetch('/api/posts', { cache: 'no-store' });
      const data = await res.json();
      setPosts(data.posts ?? []);
    } catch {
      setPosts([]);
    }
  };

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me', { cache: 'no-store' }).then((res) => res.json()),
      fetch('/api/posts', { cache: 'no-store' }).then((res) => res.json()),
    ]).then(([me, postData]) => {
      setUser(me.user ?? null);
      setPosts(postData.posts ?? []);
    }).catch(() => setError('Не удалось загрузить ленту'))
      .finally(() => setLoading(false));
  }, []);

  const profileHref = user ? '/profile' : '/auth/login';
  const initial = (user?.username?.[0] ?? 'N').toUpperCase();

  const createPost = async () => {
    if (!user) return;
    setError('');
    setPosting(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Ошибка публикации');
      setPosts((current) => [data.post, ...current]);
      setContent('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка публикации');
    } finally {
      setPosting(false);
    }
  };

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">NEXA<span>.</span></div>
        <nav>
          <Link className="active" href="/">Home</Link>
          <Link href="/">Discover</Link>
          <Link href="/">Messages</Link>
          <Link href="/">Music</Link>
          <Link href="/">Notifications</Link>
          <Link href={profileHref}>Profile</Link>
        </nav>
        {!loading && !user && <Link className="create" href="/auth/register">＋ Create account</Link>}
      </aside>

      <section className="feed">
        <header className="topbar">
          <div><p className="eyebrow">YOUR SPACE</p><h1>Home</h1></div>
          <Link className="avatar" aria-label="Profile" href={profileHref}>{initial}</Link>
        </header>

        <div className="tabs"><button className="selected">For you</button><button>Following</button></div>

        {user ? (
          <article className="composer">
            <div className="mini-avatar">{initial}</div>
            <div className="composer-content">
              <textarea value={content} onChange={(e) => setContent(e.target.value)} maxLength={2000} placeholder="What’s happening?" />
              <div className="composer-actions"><span>{content.length}/2000</span><button onClick={createPost} disabled={posting || !content.trim()}>{posting ? 'Posting…' : 'Post'}</button></div>
            </div>
          </article>
        ) : (
          <article className="composer"><div className="composer-content"><p>Войдите, чтобы публиковать записи.</p><Link href="/auth/login">Войти</Link></div></article>
        )}

        {error && <p className="error">{error}</p>}

        {posts.length === 0 && !loading && <article className="post"><p className="post-text">Пока нет публикаций. Будь первым.</p></article>}

        {posts.map((post) => (
          <article className="post" key={post.id}>
            <div className="post-head">
              <div className="mini-avatar gradient">{post.username[0]?.toUpperCase() ?? 'N'}</div>
              <div><strong>{post.username}</strong><span>@{post.username} · {new Date(post.created_at).toLocaleString()}</span></div>
              <button className="more" type="button">•••</button>
            </div>
            <p className="post-text">{post.content}</p>
            <div className="post-footer"><span>♡ 0</span><span>◌ 0</span><span>↗ Share</span><span>Save</span></div>
          </article>
        ))}
      </section>
    </main>
  );
}
