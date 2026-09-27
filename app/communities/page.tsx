'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from './communities.module.css';

type Community = {
  id: string;
  type: 'group' | 'channel';
  name: string;
  description: string;
  privacy: 'public' | 'private';
  members: number;
  admins: number;
  canPost: boolean;
  createdAt: string;
};

const KEY = 'nexa_communities_v1';

export default function CommunitiesPage() {
  const [tab, setTab] = useState<'all' | 'groups' | 'channels'>('all');
  const [items, setItems] = useState<Community[]>([]);
  const [open, setOpen] = useState<Community | null>(null);
  const [editing, setEditing] = useState<Community | null>(null);
  const [form, setForm] = useState({ name: '', description: '', privacy: 'public' as 'public' | 'private', type: 'group' as 'group' | 'channel' });

  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch {}
  }, []);

  const save = (next: Community[]) => {
    setItems(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  };

  const create = () => {
    const name = form.name.trim();
    if (!name) return;
    const item: Community = {
      id: crypto.randomUUID(), type: form.type, name,
      description: form.description.trim(), privacy: form.privacy,
      members: 1, admins: 1, canPost: form.type === 'group', createdAt: new Date().toISOString()
    };
    save([item, ...items]);
    setForm({ name: '', description: '', privacy: 'public', type: 'group' });
    setOpen(item);
  };

  const update = () => {
    if (!editing) return;
    const next = items.map(x => x.id === editing.id ? editing : x);
    save(next); setOpen(editing); setEditing(null);
  };

  const remove = (id: string) => {
    if (!window.confirm('Удалить это сообщество?')) return;
    save(items.filter(x => x.id !== id));
    setOpen(null); setEditing(null);
  };

  const visible = items.filter(x => tab === 'all' || (tab === 'groups' ? x.type === 'group' : x.type === 'channel'));

  return <main className="shell">
    <aside className="sidebar"><div className="brand">NEXA<span>.</span></div><nav>
      <Link href="/">Home</Link><Link href="/search">Search</Link><Link href="/messages">Messages</Link><Link href="/notifications">Notifications</Link><Link href="/profile">Profile</Link><Link className="active" href="/communities">Groups & Channels</Link><Link href="/settings">Settings</Link>
    </nav></aside>
    <section className="feed">
      <header className="topbar"><div><p className="eyebrow">NEXA COMMUNITIES</p><h1>Группы и каналы</h1></div><Link className="avatar" href="/profile">N</Link></header>
      <section className={styles.hero}><div><span className={styles.badge}>COMMUNITIES</span><h2>Твои пространства</h2><p>Создавай группы для общения и каналы для публикаций.</p></div><span className={styles.count}>{items.length}</span></section>
      <div className={styles.tabs}><button className={tab==='all'?styles.selected:''} onClick={()=>setTab('all')}>Все</button><button className={tab==='groups'?styles.selected:''} onClick={()=>setTab('groups')}>👥 Группы</button><button className={tab==='channels'?styles.selected:''} onClick={()=>setTab('channels')}>📢 Каналы</button></div>
      <section className={styles.createCard}><h2>Создать</h2><div className={styles.typeSwitch}><button className={form.type==='group'?styles.selected:''} onClick={()=>setForm({...form,type:'group'})}>👥 Группу</button><button className={form.type==='channel'?styles.selected:''} onClick={()=>setForm({...form,type:'channel'})}>📢 Канал</button></div><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder={form.type==='group'?'Название группы':'Название канала'} maxLength={60}/><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Описание" maxLength={300}/><select value={form.privacy} onChange={e=>setForm({...form,privacy:e.target.value as 'public'|'private'})}><option value="public">🌐 Публичное</option><option value="private">🔒 Приватное</option></select><button className={styles.primary} onClick={create}>Создать {form.type === 'group' ? 'группу' : 'канал'}</button></section>
      <section className={styles.list}>{visible.length===0?<div className={styles.empty}><div>✦</div><h3>Пока ничего нет</h3><p>Создай первую группу или канал выше.</p></div>:visible.map(item=><article className={styles.item} key={item.id}><div className={styles.icon}>{item.type==='group'?'👥':'📢'}</div><div className={styles.info}><h3>{item.name}</h3><p>{item.description || 'Без описания'}</p><small>{item.privacy==='private'?'🔒 Приватное':'🌐 Публичное'} · {item.members} участник{item.members===1?'':'ов'}</small></div><button className={styles.manage} onClick={()=>setOpen(item)}>Управлять</button></article>)}</section>
      {open && <div className={styles.overlay} onClick={()=>setOpen(null)}><div className={styles.modal} onClick={e=>e.stopPropagation()}><button className={styles.close} onClick={()=>setOpen(null)}>×</button><span className={styles.badge}>{open.type==='group'?'GROUP':'CHANNEL'}</span><h2>{open.name}</h2><p>{open.description || 'Без описания'}</p><div className={styles.stats}><b>{open.members}<span>Участники</span></b><b>{open.admins}<span>Администраторы</span></b><b>{open.privacy==='private'?'🔒':'🌐'}<span>Доступ</span></b></div><div className={styles.actions}><button onClick={()=>setEditing({...open})}>✏️ Редактировать</button><button onClick={()=>navigator.clipboard?.writeText(`${location.origin}/communities/${open.id}`)}>🔗 Скопировать ссылку</button><button className={styles.danger} onClick={()=>remove(open.id)}>🗑️ Удалить</button></div>{editing && editing.id===open.id && <div className={styles.edit}><input value={editing.name} onChange={e=>setEditing({...editing,name:e.target.value})}/><textarea value={editing.description} onChange={e=>setEditing({...editing,description:e.target.value})}/><select value={editing.privacy} onChange={e=>setEditing({...editing,privacy:e.target.value as 'public'|'private'})}><option value="public">Публичное</option><option value="private">Приватное</option></select><label><input type="checkbox" checked={editing.canPost} onChange={e=>setEditing({...editing,canPost:e.target.checked})}/> Разрешить публикации участников</label><button className={styles.primary} onClick={update}>Сохранить</button></div>}</div></div>}
    </section>
  </main>;
}
