import Link from 'next/link';

export default function Home() {
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
          <Link href="/auth/login">Profile</Link>
        </nav>
        <Link className="create" href="/auth/register">＋ Create account</Link>
      </aside>

      <section className="feed">
        <header className="topbar">
          <div>
            <p className="eyebrow">YOUR SPACE</p>
            <h1>Home</h1>
          </div>
          <Link className="avatar" aria-label="Profile" href="/auth/login">N</Link>
        </header>

        <div className="tabs">
          <button className="selected">For you</button>
          <button>Following</button>
        </div>

        <article className="composer">
          <div className="mini-avatar">N</div>
          <div className="composer-content">
            <p>What’s happening?</p>
            <div className="composer-actions">
              <span>Photo</span><span>Video</span><span>Music</span>
              <Link href="/auth/login">Post</Link>
            </div>
          </div>
        </article>

        <article className="post">
          <div className="post-head">
            <div className="mini-avatar gradient">A</div>
            <div><strong>alex</strong><span>@alex · 2m</span></div>
            <button className="more" type="button">•••</button>
          </div>
          <p className="post-text">NEXA feels different at night.</p>
          <div className="post-media"><span>MEDIA</span></div>
          <div className="post-footer"><span>♡ 128</span><span>◌ 24</span><span>↗ Share</span><span>Save</span></div>
        </article>

        <div className="auth-cta">
          <Link href="/auth/login">Войти</Link>
          <Link href="/auth/register">Создать аккаунт</Link>
        </div>
      </section>
    </main>
  );
}
