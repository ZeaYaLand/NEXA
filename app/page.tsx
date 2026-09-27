'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type User = { id: string; username: string; email: string };
type Comment = { id: string; content: string; created_at: string; user_id: string; username: string };
type Post = { id: string; content: string; created_at: string; user_id: string; username: string; like_count: number; comment_count: number; liked: boolean };

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState('');
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  const loadPosts = async () => {
    try {
      const res = await fetch('/api/posts', { cache: 'no-store' });
      const data = await res.json();
      setPosts(data.posts ?? []);
    } catch { setPosts([]); }
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
    setError(''); setPosting(true);
    try {
      const res = await fetch('/api/posts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Ошибка публикации');
      await loadPosts(); setContent('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Ошибка публикации'); }
    finally { setPosting(false); }
  };

  const toggleLike = async (post: Post) => {
    if (!user) { setError('Войдите, чтобы ставить лайки'); return; }
    const res = await fetch(`/api/posts/${post.id}/like`, { method: 'POST' });
    if (!res.ok) return;
    const data = await res.json();
    setPosts((items) => items.map((p) => p.id === post.id ? { ...p, liked: data.liked, like_count: data.count } : p));
  };

  const toggleComments = async (postId: string) => {
    const next = !openComments[postId];
    setOpenComments((v) => ({ ...v, [postId]: next }));
    if (next && !comments[postId]) {
      const res = await fetch(`/api/posts/${postId}/comments`, { cache: 'no-store' });
      const data = await res.json();
      setComments((v) => ({ ...v, [postId]: data.comments ?? [] }));
    }
  };

  const addComment = async (postId: string) => {
    if (!user) { setError('Войдите, чтобы комментировать'); return; }
    const text = (commentText[postId] ?? '').trim();
    if (!text) return;
    const res = await fetch(`/api/posts/${postId}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: text }) });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? 'Ошибка комментария'); return; }
    setComments((v) => ({ ...v, [postId]: [...(v[postId] ?? []), data.comment] }));
    setPosts((items) => items.map((p) => p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p));
    setCommentText((v) => ({ ...v, [postId]: '' }));
  };

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">NEXA<span>.</span></div>
        <nav><Link className="active" href="/">Home</Link><Link href="/">Discover</Link><Link href="/">Messages</Link><Link href="/">Music</Link><Link href="/">Notifications</Link><Link href={profileHref}>Profile</Link></nav>
        {!loading && !user && <Link className="create" href="/auth/register">＋ Create account</Link>}
      </aside>

      <section className="feed">
        <header className="topbar"><div><p className="eyebrow">YOUR SPACE</p><h1>Home</h1></div><Link className="avatar" aria-label="Profile" href={profileHref}>{initial}</Link></header>
        <div className="tabs"><button className="selected">For you</button><button>Following</button></div>

        {user ? <article className="composer"><div className="mini-avatar">{initial}</div><div className="composer-content"><textarea value={content} onChange={(e) => setContent(e.target.value)} maxLength={2000} placeholder="What’s happening?" /><div className="composer-actions"><span>{content.length}/2000</span><button onClick={createPost} disabled={posting || !content.trim()}>{posting ? 'Posting…' : 'Post'}</button></div></div></article> : <article className="composer"><div className="composer-content"><p>Войдите, чтобы публиковать записи.</p><Link href="/auth/login">Войти</Link></div></article>}
        {error && <p className="error">{error}</p>}
        {posts.length === 0 && !loading && <article className="post"><p className="post-text">Пока нет публикаций. Будь первым.</p></article>}

        {posts.map((post) => <article className="post" key={post.id}>
          <div className="post-head"><div className="mini-avatar gradient">{post.username[0]?.toUpperCase() ?? 'N'}</div><div><strong>{post.username}</strong><span>@{post.username} · {new Date(post.created_at).toLocaleString()}</span></div><button className="more" type="button">•••</button></div>
          <p className="post-text">{post.content}</p>
          <div className="post-footer">
            <button className={post.liked ? 'liked' : ''} onClick={() => toggleLike(post)}>♥ {post.like_count ?? 0}</button>
            <button onClick={() => toggleComments(post)}>💬 {post.comment_count ?? 0}</button>
            <button>↗ Share</button><button>Save</button>
          </div>
          {openComments[post.id] && <div className="comments"><div className="comment-list">{(comments[post.id] ?? []).map((c) => <div className="comment" key={c.id}><b>{c.username}</b><span>{c.content}</span></div>)}</div>{user && <div className="comment-form"><input value={commentText[post.id] ?? ''} onChange={(e) => setCommentText((v) => ({ ...v, [post.id]: e.target.value }))} maxLength={1000} placeholder="Написать комментарий…" /><button onClick={() => addComment(post.id)}>Отправить</button></div>}</div>}
        </article>)}
      </section>
    </main>
  );
}
