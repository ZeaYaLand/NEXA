'use client';

import Link from 'next/link';
import {useEffect,useState} from 'react';
import styles from './notifications.module.css';

type Notification={id:string;type:'follow'|'like'|'comment';created_at:string;read_at:string|null;username:string;displayName:string|null;post_id:string|null};
const text=(n:Notification)=>n.type==='follow'?'подписался на вас':n.type==='like'?'поставил лайк вашей публикации':'прокомментировал вашу публикацию';
const icon=(type:Notification['type'])=>type==='follow'?'＋':type==='like'?'♥':'💬';

export default function NotificationsPage(){
 const[items,setItems]=useState<Notification[]>([]),[unread,setUnread]=useState(0),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const load=async()=>{try{const r=await fetch('/api/notifications',{cache:'no-store'}),d=await r.json();if(!r.ok)throw new Error(d.error||'Войдите в аккаунт');setItems(d.notifications||[]);setUnread(d.unread||0);setError('')}catch(e){setError(e instanceof Error?e.message:'Не удалось загрузить уведомления')}finally{setLoading(false)}};
 useEffect(()=>{load()},[]);
 const readOne=async(n:Notification)=>{if(n.read_at)return;const r=await fetch('/api/notifications',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:n.id})});if(r.ok){setItems(x=>x.map(i=>i.id===n.id?{...i,read_at:new Date().toISOString()}:i));setUnread(x=>Math.max(0,x-1))}};
 const readAll=async()=>{const r=await fetch('/api/notifications',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({all:true})});if(r.ok){setItems(x=>x.map(n=>({...n,read_at:new Date().toISOString()})));setUnread(0)}};
 return <main className={styles.page}><aside className={styles.sidebar}><Link className={styles.brand} href="/">NEXA<span>.</span></Link><nav><Link href="/">⌂<small>Главная</small></Link><Link href="/search">⌕<small>Поиск</small></Link><Link href="/messages">✉<small>Сообщения</small></Link><Link className={styles.active} href="/notifications">♡<small>Уведомления</small>{unread>0&&<b className={styles.badge}>{unread}</b>}</Link><Link href="/profile">●<small>Профиль</small></Link></nav></aside><section className={styles.content}><header className={styles.header}><div><span>ACTIVITY / NEXA</span><h1>Уведомления {unread>0&&<em>{unread} новых</em>}</h1></div>{unread>0&&<button className={styles.readAll} onClick={readAll}>Прочитать всё</button>}</header>{loading?<div className={styles.state}>Загрузка…</div>:error?<div className={styles.state}><p>{error}</p><button onClick={()=>{setLoading(true);load()}}>Повторить</button></div>:items.length===0?<section className={styles.empty}><div className={styles.emptyIcon}>♡</div><h2>Пока тихо</h2><p>Здесь появятся подписки, лайки и комментарии.</p></section>:<section className={styles.list}>{items.map(n=><Link key={n.id} href={n.type==='follow'?`/users/${n.username}`:n.post_id?`/?post=${n.post_id}`:'/'} onClick={()=>readOne(n)} className={`${styles.item} ${n.read_at?'':styles.unread}`}><div className={`${styles.icon} ${styles[n.type]}`}>{icon(n.type)}</div><div className={styles.itemBody}><p><strong>{n.displayName||n.username}</strong> {text(n)}</p><time>{new Date(n.created_at).toLocaleString('ru-RU',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</time></div>{!n.read_at&&<span className={styles.dot}/>}</Link>)}</section>}</section></main>}
