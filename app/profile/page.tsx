'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type User = {
  id: string;
  username: string;
  email: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  createdAt: string;
};

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('READ_FAILED'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('IMAGE_FAILED'));
      image.onload = () => {
        const max = 512;
        const scale = Math.min(1, max / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('CANVAS_FAILED'));
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ displayName: '', bio: '', avatarUrl: '' });

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (!data.user) router.replace('/auth/login');
        else {
          setUser(data.user);
          setForm({
            displayName: data.user.displayName || data.user.username,
            bio: data.user.bio || '',
            avatarUrl: data.user.avatarUrl || '',
          });
        }
      })
      .catch(() => router.replace('/auth/login'))
      .finally(() => setLoading(false));
  }, [router]);

  async function logout() {
    setLoggingOut(true);
    try { await fetch('/api/auth/logout', { method: 'POST' }); }
    finally { router.replace('/auth/login'); router.refresh(); }
  }

  function openEditor() {
    if (!user) return;
    setError('');
    setForm({ displayName: user.displayName || user.username, bio: user.bio || '', avatarUrl: user.avatarUrl || '' });
    setEditing(true);
  }

  async function chooseAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Выбери изображение JPG, PNG или WebP.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Исходное изображение слишком большое. Максимум 10 МБ.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const dataUrl = await compressImage(file);
      if (dataUrl.length > 290_000) {
        setError('Не удалось сжать изображение до нужного размера. Выбери другое фото.');
        return;
      }
      setForm((current) => ({ ...current, avatarUrl: dataUrl }));
    } catch {
      setError('Не удалось обработать изображение. Попробуй другое фото.');
    } finally {
      setUploading(false);
    }
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'SAVE_FAILED');
      setUser(data.user);
      setForm({ displayName: data.user.displayName || '', bio: data.user.bio || '', avatarUrl: data.user.avatarUrl || '' });
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error && e.message === 'AVATAR_TOO_LARGE' ? 'Аватар получился слишком большим. Выбери другое фото.' : 'Не удалось сохранить изменения. Попробуй ещё раз.');
    } finally {
      setSaving(false);
    }
  }

  if (loading || !user) {
    return <main className="shell"><section className="feed profile-loading"><p>Загрузка профиля…</p></section></main>;
  }

  const initial = (user.displayName || user.username)[0]?.toUpperCase() || 'N';

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">NEXA<span>.</span></div>
        <nav><Link href="/">Home</Link><Link className="active" href="/profile">Profile</Link></nav>
      </aside>

      <section className="feed">
        <header className="topbar profile-topbar">
          <div><p className="eyebrow">YOUR SPACE</p><h1>Профиль</h1></div>
          <div className="avatar">{initial}</div>
        </header>

        <section className="profile-hero">
          <div className="profile-cover" />
          <div className="profile-main">
            <div className="profile-avatar gradient">
              {user.avatarUrl ? <img src={user.avatarUrl} alt="Аватар" /> : initial}
            </div>
            <div className="profile-actions">
              <button type="button" className="profile-action primary" onClick={openEditor}>Редактировать</button>
              <button type="button" className="profile-action secondary" onClick={logout} disabled={loggingOut}>{loggingOut ? 'Выход…' : 'Выйти'}</button>
            </div>
            <h2>{user.displayName || user.username}</h2>
            <p className="profile-username">@{user.username}</p>
            {user.bio ? <p className="profile-bio">{user.bio}</p> : <p className="profile-bio muted">Добавь описание профиля</p>}
            <p className="profile-email">{user.email}</p>
          </div>
        </section>

        <div className="profile-tabs" role="tablist" aria-label="Профиль">
          <button className="selected" type="button">Посты</button><button type="button">Медиа</button><button type="button">Лайки</button>
        </div>

        <section className="profile-empty"><div className="profile-empty-icon">✦</div><h3>Твоё пространство</h3><p>Здесь будут отображаться твои публикации.</p></section>
      </section>

      {editing && (
        <div className="profile-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setEditing(false); }}>
          <form className="profile-modal" onSubmit={saveProfile}>
            <div className="profile-modal-head"><div><p className="eyebrow">NEXA PROFILE</p><h2>Редактировать профиль</h2></div><button type="button" className="modal-close" onClick={() => setEditing(false)}>×</button></div>

            <div className="avatar-editor">
              <div className="profile-avatar gradient avatar-editor-preview">
                {form.avatarUrl ? <img src={form.avatarUrl} alt="Предпросмотр аватара" /> : initial}
              </div>
              <div className="avatar-editor-info">
                <strong>Фото профиля</strong>
                <span>JPG, PNG или WebP · до 10 МБ</span>
                <button type="button" className="profile-action secondary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  {uploading ? 'Обрабатываем…' : 'Выбрать фото'}
                </button>
                <input ref={fileInputRef} className="avatar-file-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseAvatar} />
              </div>
            </div>

            <label>Имя<input value={form.displayName} maxLength={60} onChange={(e) => setForm({ ...form, displayName: e.target.value })} placeholder="Как тебя зовут?" /></label>
            <label>О себе<textarea value={form.bio} maxLength={160} rows={4} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Расскажи немного о себе…" /></label>
            <details className="avatar-url-details"><summary>Использовать ссылку вместо фото</summary><input value={form.avatarUrl.startsWith('data:image/') ? '' : form.avatarUrl} maxLength={500} onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })} placeholder="https://…" inputMode="url" /></details>
            {error && <p className="profile-form-error">{error}</p>}
            <div className="profile-modal-actions"><button type="button" className="profile-action secondary" onClick={() => setEditing(false)}>Отмена</button><button type="submit" className="profile-action primary" disabled={saving || uploading}>{saving ? 'Сохраняем…' : 'Сохранить'}</button></div>
          </form>
        </div>
      )}
    </main>
  );
}
