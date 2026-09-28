'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import styles from './media.module.css';

type Item={id:string;username:string;kind:'music';media_url:string;cover_url:string|null;mime_type:string;title:string;description:string;like_count:number;comment_count:number;liked:boolean;created_at:string};
type Comment={id:string;username:string;content:string;created_at:string};
const MAX_FILE_SIZE=50*1024*1024;

async function upload(file:File){
  if(file.size>MAX_FILE_SIZE)throw new Error('Файл слишком большой. Максимальный размер — 50 МБ.');
  const p=await fetch('/api/media/presign',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({scope:'library',fileName:file.name,mimeType:file.type,fileSize:file.size})});
  const d=await p.json();
  if(!p.ok)throw new Error(d.error||'Не удалось подготовить загрузку');
  const put=await fetch(d.uploadUrl,{method:'PUT',headers:{'Content-Type':file.type},body:file});
  if(!put.ok)throw new Error('Не удалось загрузить файл в хранилище');
  return{key:d.key,mimeType:file.type};
}

function MediaPageContent(){
  const [musicSection,setMusicSection]=useState<'my'|'recommendations'|'new'|'popular'|'recent'|'playlists'|'saved'>('my');
  const [items,setItems]=useState<Item[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const [title,setTitle]=useState(''),[description,setDescription]=useState('');
  const [comments,setComments]=useState<Record<string,Comment[]>>({}),[commentText,setCommentText]=useState<Record<string,string>>({}),[openComments,setOpenComments]=useState<Record<string,boolean>>({});

  const load=async()=>{try{const r=await fetch('/api/media-library',{cache:'no-store'});const d=await r.json();if(!r.ok)throw new Error(d.error||'Медиатека недоступна');setItems((d.items||[]).filter((i:Item)=>i.kind==='music'))}catch(e){setError(e instanceof Error?e.message:'Ошибка загрузки музыки')}};
  useEffect(()=>{load()},[]);

  const visible=useMemo(()=>{
    const x=items.filter(i=>i.kind==='music');
    switch(musicSection){
      case'new':return [...x].sort((a,b)=>+new Date(b.created_at)-+new Date(a.created_at));
      case'popular':return [...x].sort((a,b)=>b.like_count-a.like_count);
      case'recent':return [...x].sort((a,b)=>+new Date(b.created_at)-+new Date(a.created_at));
      case'saved':return x.filter(i=>i.liked);
      case'recommendations':return [...x].sort((a,b)=>(b.like_count+b.comment_count)-(a.like_count+a.comment_count));
      case'playlists':return [];
      default:return x;
    }
  },[items,musicSection]);

  const publish=async(file:File)=>{
    if(!file.type.startsWith('audio/'))return setError('Нужен аудиофайл');
    setBusy(true);setError('');
    try{
      const up=await upload(file);
      const r=await fetch('/api/media-library',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind:'music',mediaKey:up.key,mimeType:up.mimeType,title:title.trim()||file.name,description})});
      const d=await r.json();
      if(!r.ok)throw new Error(d.error||'Не удалось опубликовать трек');
      setTitle('');setDescription('');await load();
    }catch(e){setError(e instanceof Error?e.message:'Не удалось опубликовать трек')}finally{setBusy(false)}
  };

  const like=async(id:string)=>{const r=await fetch(`/api/media-library/${id}/like`,{method:'POST'});const d=await r.json();if(r.ok)setItems(x=>x.map(i=>i.id===id?{...i,liked:d.liked,like_count:d.count}:i))};
  const toggleComments=async(id:string)=>{const open=!openComments[id];setOpenComments(x=>({...x,[id]:open}));if(open&&!comments[id]){const r=await fetch(`/api/media-library/${id}/comments`);const d=await r.json();if(r.ok)setComments(x=>({...x,[id]:d.comments||[]}))}};
  const addComment=async(id:string)=>{const text=(commentText[id]||'').trim();if(!text)return;const r=await fetch(`/api/media-library/${id}/comments`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({content:text})});const d=await r.json();if(!r.ok)return setError(d.error||'Ошибка комментария');setComments(x=>({...x,[id]:[...(x[id]||[]),d.comment]}));setItems(x=>x.map(i=>i.id===id?{...i,comment_count:i.comment_count+1}:i));setCommentText(x=>({...x,[id]:''}))};
  const share=async(id:string)=>{const url=`${window.location.origin}/media?media=${encodeURIComponent(id)}`;try{if(navigator.share)await navigator.share({title:'NEXA',url});else{await navigator.clipboard.writeText(url);setError('Ссылка скопирована')}}catch{}};

  return <main className="shell"><aside className="sidebar"><div className="brand">NEXA<span>.</span></div><nav><Link href="/">Главная</Link><Link href="/search">Поиск</Link><Link href="/messages">Сообщения</Link><Link href="/notifications">Уведомления</Link><Link href="/profile">Профиль</Link><Link href="/friends">Друзья</Link><Link href="/communities">Сообщества</Link><Link className="active" href="/media">Музыка</Link><Link href="/settings">Настройки</Link></nav></aside><section className="feed"><header className="topbar"><div><p className="eyebrow">NEXA MUSIC</p><h1>Музыка</h1><p className={styles.sub}>Твоя медиатека, рекомендации и любимые треки.</p></div><Link className="avatar" href="/profile">N</Link></header>{error&&<div className={styles.error}>{error}<button onClick={()=>setError('')}>×</button></div>}

  <div className={styles.tabs} style={{marginTop:12,flexWrap:'wrap'}}>{[['my','Моя музыка'],['recommendations','Рекомендации'],['new','Новинки'],['popular','Популярное'],['recent','Недавние'],['playlists','Плейлисты'],['saved','Сохранённые']].map(([key,label])=><button key={key} className={musicSection===key?styles.active:''} onClick={()=>setMusicSection(key as typeof musicSection)}>{label}</button>)}</div>

  <section className={styles.publisher}><div><span>ПУБЛИКАЦИЯ</span><h2>Новый трек</h2></div><label className={styles.upload}>{busy?'Загрузка…':'＋ Выбрать аудио'}<input type="file" accept="audio/*" disabled={busy} onChange={e=>e.target.files?.[0]&&publish(e.target.files[0])}/></label><input className={styles.title} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Название трека"/><textarea className={styles.description} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Описание"/></section>

  <section className={styles.list}>{visible.map(i=><article className={styles.card} key={i.id}><div className={styles.music}><div className={styles.cover}>♫</div><div><b>{i.title}</b><span>@{i.username}</span><audio src={i.media_url} controls preload="metadata"/></div></div><div className={styles.meta}><div><h3>{i.title}</h3><p>{i.description||'@'+i.username}</p></div><div className={styles.actions}><button className={i.liked?styles.liked:''} onClick={()=>like(i.id)}>♥ {i.like_count}</button><button onClick={()=>toggleComments(i.id)}>💬 {i.comment_count}</button><button onClick={()=>share(i.id)}>↗ Поделиться</button></div></div>{openComments[i.id]&&<div className={styles.comments}>{(comments[i.id]||[]).map(c=><div key={c.id}><b>@{c.username}</b><span>{c.content}</span></div>)}<div className={styles.commentForm}><input value={commentText[i.id]||''} onChange={e=>setCommentText(x=>({...x,[i.id]:e.target.value}))} placeholder="Комментарий…" maxLength={1000}/><button onClick={()=>addComment(i.id)}>Отправить</button></div></div>}</article>)}{visible.length===0&&<div className={styles.empty}>{musicSection==='playlists'?'Плейлисты скоро можно будет создавать и наполнять треками.':'В этом разделе пока нет треков.'}</div>}</section>
  </section></main>;
}

export default function MediaPage(){return <Suspense fallback={<main className="shell"><section className="feed"><div style={{padding:'32px'}}>Загрузка музыки…</div></section></main>}><MediaPageContent/></Suspense>}
