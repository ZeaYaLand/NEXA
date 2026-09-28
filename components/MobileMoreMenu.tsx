'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const items = [
  ['Друзья', '/friends', '♧'],
  ['Сообщества', '/communities', '◈'],
  ['Медиа', '/media', '▣'],
  ['Сервисы', '/services', '✦'],
  ['Сохранённое', '/bookmarks', '★'],
  ['Настройки', '/settings', '⚙'],
] as const;

export default function MobileMoreMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener('popstate', close);
    return () => window.removeEventListener('popstate', close);
  }, [open]);

  return (
    <div className="mobile-more-root">
      {open && (
        <>
          <button className="mobile-more-backdrop" aria-label="Закрыть меню" onClick={() => setOpen(false)} />
          <section className="mobile-more-panel" aria-label="Все разделы NEXA">
            <div className="mobile-more-head">
              <div>
                <span>NEXA</span>
                <h2>Все разделы</h2>
              </div>
              <button className="mobile-more-close" onClick={() => setOpen(false)} aria-label="Закрыть">×</button>
            </div>
            <div className="mobile-more-grid">
              {items.map(([label, href, icon]) => (
                <Link key={href} href={href} className="mobile-more-item" onClick={() => setOpen(false)}>
                  <span>{icon}</span>
                  <b>{label}</b>
                  <small>Открыть →</small>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
      <button className="mobile-more-trigger" onClick={() => setOpen(v => !v)} aria-expanded={open} aria-label="Все разделы NEXA">
        <span>•••</span>
        <small>Ещё</small>
      </button>
    </div>
  );
}
