'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from './settings.module.css';

const defaults = {push:true,email:false,sound:true,readReceipts:true,typing:true,privateAccount:false,autoplay:true,reduceMotion:false};
type Settings = typeof defaults;

export default function SettingsPage(){
  const [settings,setSettings]=useState<Settings>(defaults);
  useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem('nexa_settings')||'{}');setSettings({...defaults,...saved})}catch{}},[]);
  const set=(key:keyof Settings,value:boolean)=>{const next={...settings,[key]:value};setSettings(next);try{localStorage.setItem('nexa_settings',JSON.stringify(next))}catch{}};
  return <main className="shell"><aside className="sidebar"><div className="brand">NEXA<span>.</span></div><nav><Link href="/">Home</Link><Link href="/search">Search</Link><Link href="/messages">Messages</Link><Link href="/notifications">Notifications</Link><Link href="/profile">Profile</Link><Link className="active" href="/settings">Settings</Link></nav></aside><section className="feed"><header className="topbar"><div><p className="eyebrow">NEXA CONTROL CENTER</p><h1>Настройки</h1></div><Link className="avatar" href="/profile">⚙</Link></header>
  <div className={styles.grid}>
    <section className={styles.card}><h2>Аккаунт</h2><Link className={styles.row} href="/profile"><span>👤 Профиль</span><b>›</b></Link><Link className={styles.row} href="/profile"><span>✏️ Имя и описание</span><b>›</b></Link><div className={styles.row}><span>🌐 Язык</span><select defaultValue="ru"><option value="ru">Русский</option><option value="en">English</option></select></div></section>
    <section className={styles.card}><h2>Конфиденциальность</h2><Toggle label="🔒 Закрытый аккаунт" value={settings.privateAccount} onChange={v=>set('privateAccount',v)}/><Toggle label="✓ Показывать прочтение сообщений" value={settings.readReceipts} onChange={v=>set('readReceipts',v)}/><Toggle label="⌨ Показывать статус набора" value={settings.typing} onChange={v=>set('typing',v)}/><Link className={styles.row} href="/profile"><span>🚫 Заблокированные аккаунты</span><b>›</b></Link></section>
    <section className={styles.card}><h2>Уведомления</h2><Toggle label="🔔 Push-уведомления" value={settings.push} onChange={v=>set('push',v)}/><Toggle label="✉️ Email-уведомления" value={settings.email} onChange={v=>set('email',v)}/><Toggle label="🔊 Звуки" value={settings.sound} onChange={v=>set('sound',v)}/><Link className={styles.row} href="/notifications"><span>🔔 Центр уведомлений</span><b>›</b></Link></section>
    <section className={styles.card}><h2>Сообщения</h2><Link className={styles.row} href="/messages"><span>💬 Личные сообщения</span><b>›</b></Link><Toggle label="📤 Автовоспроизведение медиа" value={settings.autoplay} onChange={v=>set('autoplay',v)}/><Link className={styles.row} href="/messages"><span>😀 Emoji и реакции</span><b>›</b></Link></section>
    <section className={styles.card}><h2>Внешний вид</h2><div className={styles.choice}><span>🌙 Тема</span><button className={styles.selected}>Тёмная</button></div><Toggle label="✨ Уменьшить анимации" value={settings.reduceMotion} onChange={v=>set('reduceMotion',v)}/><div className={styles.choice}><span>🔤 Размер текста</span><select defaultValue="normal"><option value="small">Маленький</option><option value="normal">Обычный</option><option value="large">Большой</option></select></div></section>
    <section className={styles.card}><h2>Контент</h2><Link className={styles.row} href="/"><span>🔖 Сохранённые публикации</span><b>›</b></Link><Link className={styles.row} href="/search"><span>🔎 Поиск</span><b>›</b></Link><div className={styles.row}><span>🛡️ Безопасность контента</span><span className={styles.muted}>Настроено</span></div></section>
    <section className={styles.card}><h2>Безопасность</h2><div className={styles.row}><span>🔐 Пароль и вход</span><span className={styles.muted}>Защищено</span></div><div className={styles.row}><span>📱 Активные сессии</span><span className={styles.muted}>Текущее устройство</span></div><div className={styles.row}><span>🧾 История входов</span><span className={styles.muted}>Доступна</span></div></section>
    <section className={styles.card}><h2>Данные и помощь</h2><div className={styles.row}><span>📦 Скачать мои данные</span><button className={styles.small}>Скоро</button></div><Link className={styles.row} href="/"><span>❓ Помощь и поддержка</span><b>›</b></Link><div className={styles.row}><span>ℹ️ О NEXA</span><span className={styles.muted}>v1.0</span></div></section>
    <section className={`${styles.card} ${styles.danger}`}><h2>Опасная зона</h2><button className={styles.dangerButton} type="button">Удалить аккаунт</button><p>Удаление аккаунта будет добавлено после отдельной проверки и подтверждения.</p></section>
  </div>
</section></main>}

function Toggle({label,value,onChange}:{label:string;value:boolean;onChange:(v:boolean)=>void}){return <button type="button" className={styles.toggleRow} onClick={()=>onChange(!value)}><span>{label}</span><span className={`${styles.switch} ${value?styles.on:''}`}><i/></span></button>}
