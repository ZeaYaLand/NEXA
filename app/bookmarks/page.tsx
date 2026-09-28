'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Post={id:string;content:string;created_at:string;username:string;like_count:number;comment_count:number;media_url?:string|null};

export default function BookmarksPage(){
  const [posts,setPosts]=useState<Post[]>([]);const [loading,setLoading]=useState(true);
  useEffect(()=>{const load=async()=>{try{const ids=JSON.parse(localStorage.getItem('nexa_saved_posts')||'[]') as string[];if(!ids.length){setPosts([]);return}const r=await fetch('/api/posts',{cache:'no-store'});const d=await r.json();setPosts((d.posts??[]).filter((p:Post)=>ids.includes(p.id)))}finally{setLoading(false)}};load()},[]);
  const remove=(id:string)=>{const ids=JSON.parse(localStorage.getItem('nexa_saved_posts')||'[]').filter((x:string)=>x!==id);localStorage.setItem('nexa_saved_posts',JSON.stringify(ids));setPosts(x=>x.filter(p=>p.id!==id))};
  return <main className="shell"><aside className="sidebar"><div className="brand">NEXA<span>.</span></div><nav><Link href="/">Главная</Link><Link href="/search">Поиск</Link><Link href="/messages">Сообщения</Link><Link href="/notifications">Уведомления</Link><Link href="/profile">Профиль</Link><Link href="/friends">Друзья</Link><Link href="/communities">Сообщества</Link><Link className="active" href="/bookmarks">Сохранённое</Link><Link href="/services">Сервисы</Link><Link href="/settings">Настройки</Link></nav></aside><section className="feed"><header className="topbar"><div><p className="eyebrow">NEXA LIBRARY</p><h1>Сохранённое</h1></div><Link className="avatar" href="/profile">N</Link></header>{loading?<p>Загрузка…</p>:posts.length===0?<section className="card"><h2>Здесь пока пусто</h2><p>Нажимай ☆ «Сохранить» у публикаций, чтобы собрать личную коллекцию.</p><Link className="button" href="/">Открыть ленту →</Link></section>:<div style={{display:'grid',gap:16}}>{posts.map(p=><article className="card" key={p.id}><div style={{display:'flex',justifyContent:'space-between',gap:10}}><div><Link href={`/users/${p.username}`} style={{fontWeight:700}}>@{p.username}</Link><div style={{opacity:.55,fontSize:13}}>{new Date(p.created_at).toLocaleString()}</div></div><button className="button" onClick={()=>remove(p.id)}>Убрать</button></div>{p.content&&<p style={{whiteSpace:'pre-wrap',fontSize:17}}>{p.content}</p>}{p.media_url&&<img src={p.media_url} alt="Фото публикации" style={{width:'100%',maxHeight:620,objectFit:'cover',borderRadius:18}}/>}<div style={{opacity:.65}}>♥ {p.like_count??0} · 💬 {p.comment_count??0}</div></article>)}</div>}</section></main>
}
