'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

type Item = readonly [string, string, string];

const items: Item[] = [
  ['Главная', '/', '⌂'],
  ['Поиск', '/search', '⌕'],
  ['Сообщения', '/messages', '✉'],
  ['Уведомления', '/notifications', '♡'],
  ['Профиль', '/profile', '●'],
  ['Друзья', '/friends', '♧'],
  ['Сообщества', '/communities', '◈'],
  ['Медиа', '/media', '▣'],
  ['Сервисы', '/services', '✦'],
  ['Сохранённое', '/bookmarks', '★'],
  ['Настройки', '/settings', '⚙'],
];

export default function MobileMoreMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (pathname?.startsWith('/auth')) return null;

  return (
    <div className="mobile-more-root">
      {open && (
        <button
          type="button"
          className="mobile-more-backdrop"
          aria-label="Закрыть меню"
          onClick={() => setOpen(false)}
        />
      )}
      {open && (
        <section className="mobile-more-panel" aria-label="Все разделы NEXA">
          <div className="mobile-more-head">
            <div>
              <span>NEXA</span>
              <h2>Все разделы</h2>
            </div>
            <button type="button" className="mobile-more-close" onClick={() => setOpen(false)} aria-label="Закрыть">×</button>
          </div>
          <div className="mobile-more-grid">
            {items.map(([label, href, icon]) => (
              <Link
                key={href}
                href={href}
                className={`mobile-more-item${pathname === href ? ' is-active' : ''}`}
                onClick={() => setOpen(false)}
              >
                <span>{icon}</span>
                <b>{label}</b>
                <small>{pathname === href ? 'Открыто' : 'Открыть →'}</small>
              </Link>
            ))}
          </div>
        </section>
      )}
      <button
        type="button"
        className={`mobile-more-trigger${open ? ' is-open' : ''}`}
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-label={open ? 'Закрыть все разделы NEXA' : 'Открыть все разделы NEXA'}
      >
        <span>{open ? '×' : '•••'}</span>
        <small>Ещё</small>
      </button>
    </div>
  );
}
