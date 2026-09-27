export default function Home() {
  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">NEXA<span>.</span></div>
        <nav>
          <a className="active" href="#">Home</a>
          <a href="#">Discover</a>
          <a href="#">Messages</a>
          <a href="#">Music</a>
          <a href="#">Notifications</a>
          <a href="#">Profile</a>
        </nav>
        <button className="create">＋ Create</button>
      </aside>

      <section className="feed">
        <header className="topbar">
          <div>
            <p className="eyebrow">YOUR SPACE</p>
            <h1>Home</h1>
          </div>
          <button className="avatar" aria-label="Profile">N</button>
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
              <button>Post</button>
            </div>
          </div>
        </article>

        <article className="post">
          <div className="post-head">
            <div className="mini-avatar gradient">A</div>
            <div><strong>alex</strong><span>@alex · 2m</span></div>
            <button className="more">•••</button>
          </div>
          <p className="post-text">NEXA feels different at night.</p>
          <div className="post-media"><span>MEDIA</span></div>
          <div className="post-footer"><span>♡ 128</span><span>◌ 24</span><span>↗ Share</span><span>Save</span></div>
        </article>
      </section>
    </main>
  );
}
