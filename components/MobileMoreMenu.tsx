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
    <div className="mobile-main-menu">
      {open && (
        <button className="mobile-main-menu-backdrop" type="button" aria-label="Закрыть меню" onClick={() => setOpen(false)} />
      )}
      <button
        className="mobile-main-menu-trigger"
        type="button"
        aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
      >
        {open ? '×' : '☰'}
      </button>
      {open && (
        <aside className="mobile-main-menu-panel" aria-label="Главное меню NEXA">
          <div className="mobile-main-menu-head">
            <div><span>NEXA</span><h2>Меню</h2></div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Закрыть">×</button>
          </div>
          <nav className="mobile-main-menu-list">
            {items.map(([label, href, icon]) => (
              <Link key={href} href={href} className={pathname === href ? 'is-active' : ''} onClick={() => setOpen(false)}>
                <span>{icon}</span><b>{label}</b>{pathname === href && <small>Открыто</small>}
              </Link>
            ))}
          </nav>
        </aside>
      )}
    </div>
  );
}
