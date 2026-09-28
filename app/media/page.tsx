'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from './media.module.css';

type Story={id:string;username:string;media_url:string;media_type:string;caption:string;created_at:string};
type Item={id:string;username:string;kind:'video'|'music';media_url:string;cover_url:string|null;mime_type:string;title:string;description:string;like_count:number;comment_count:number;liked:boolean;created_at:string};
type Comment={id:string;username:string;content:string;created_at:string};

async function upload(scope:'stories'|'library', file:File){
 const p=await fetch('/api/media/presign',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({scope,fileName:file.name,mimeType:file.type,fileSize:file.size})});
 const d=await p.json(); if(!p.ok) throw new Error(d.error||'Не удалось подготовить загрузку');
 const put=await fetch(d.uploadUrl,{method:'PUT',headers:{'Content-Type':file.type},body:file});
 if(!put.ok) throw new Error('Не удалось загрузить файл в хранилище');
 return {key:d.key,mimeType:file.type};
}

export default function MediaPage(){
 const params=useSearchParams();
 const requested=params.get('tab');
 const [tab,setTab]=useState<'stories'|'video'|'music'>(requested==='video'||requested==='music'?requested:'stories');
 const [stories,setStories]=useState<Story[]>([]),[items,setItems]=useState<Item[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const [title,setTitle]=useState(''),[description,setDescription]=useState(''),[storyCaption,setStoryCaption]=useState('');
 const [comments,setComments]=useState<Record<string,Comment[]>>({}),[commentText,setCommentText]=useState<Record<string,string>>({}),[openComments,setOpenComments]=useState<Record<string,boolean>>({});
 useEffect(()=>{if(requested==='video'||requested==='music')setTab(requested)},[requested]);
 const load=async()=>{try{const [s,m]=await Promise.all([fetch('/api/stories',{cache:'no-store'}),fetch('/api/media-library',{cache:'no-store'})]);const sd=await s.json(),md=await m.json();if(!s.ok)throw new Error(sd.error);if(!m.ok)throw new Error(md.error);setStories(sd.stories||[]);setItems(md.items||[])}catch(e){setError(e instanceof Error?e.message:'Ошибка загрузки')}};
 useEffect(()=>{load()},[]);
 const visible=useMemo(()=>items.filter(x=>x.kind===tab),[items,tab]);
 const createStory=async(file:File)=>{setBusy(true);setError('');try{const up=await upload('stories',file);const r=await fetch('/api/stories',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mediaKey:up.key,mediaType:file.type.startsWith('video/')?'video':'image',caption:storyCaption})});const d=await r.json();if(!r.ok)throw new Error(d.error);setStoryCaption('');await load()}catch(e){setError(e instanceof Error?e.message:'Не удалось создать историю')}finally{setBusy(false)}};
 const publish=async(file:File)=>{setBusy(true);setError('');try{const up=await upload('library',file);const r=await fetch('/api/media-library',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind:tab,mediaKey:up.key,mimeType:up.mimeType,title:title||file.name,description})});const d=await r.json();if(!r.ok)throw new Error(d.error);setTitle('');setDescription('');await load()}catch(e){setError(e instanceof Error?e.message:'Не удалось опубликовать медиа')}finally{setBusy(false)}};
 const like=async(id:string)=>{const r=await fetch(`/api/media-library/${id}/like`,{method:'POST'});const d=await r.json();if(r.ok)setItems(x=>x.map(i=>i.id===id?{...i,liked:d.liked,like_count:d.count}:i))};
 const toggleComments=async(id:string)=>{const open=!openComments[id];setOpenComments(x=>({...x,[id]:open}));if(open&&!comments[id]){const r=await fetch(`/api/media-library/${id}/comments`);const d=await r.json();if(r.ok)setComments(x=>({...x,[id]:d.comments||[]}))}};
 const addComment=async(id:string)=>{const text=(commentText[id]||'').trim();if(!text)return;const r=await fetch(`/api/media-library/${id}/comments`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({content:text})});const d=await r.json();if(!r.ok)return setError(d.error||'Ошибка комментария');setComments(x=>({...x,[id]:[...(x[id]||[]),d.comment]}));setItems(x=>x.map(i=>i.id===id?{...i,comment_count:i.comment_count+1}:i));setCommentText(x=>({...x,[id]:''}))};
 const share=async(id:string)=>{const url=`${window.location.origin}/media?media=${id}`;try{if(navigator.share)await navigator.share({title:'NEXA',url});else await navigator.clipboard.writeText(url)}catch{}};
 return <main className="shell"><aside className="sidebar"><div className="brand">NEXA<span>.</span></div><nav><Link href="/">Главная</Link><Link href="/search">Поиск</Link><Link href="/messages">Сообщения</Link><Link href="/notifications">Уведомления</Link><Link href="/profile">Профиль</Link><Link href="/friends">Друзья</Link><Link href="/communities">Сообщества</Link><Link className="active" href="/media">Медиа</Link><Link href="/settings">Настройки</Link></nav></aside><section className="feed"><header className="topbar"><div><p className="eyebrow">NEXA MEDIA</p><h1>Истории · Видео · Музыка</h1></div><Link className="avatar" href="/profile">N</Link></header>
 {error&&<div className={styles.error}>{error}<button onClick={()=>setError('')}>×</button></div>}
 <section className={styles.storyPanel}><div className={styles.sectionHead}><div><span>24 ЧАСА</span><h2>Истории</h2></div><label className={styles.upload}>{busy?'Загрузка…':'＋ Добавить'}<input type="file" accept="image/*,video/*" disabled={busy} onChange={e=>e.target.files?.[0]&&createStory(e.target.files[0])}/></label></div><input className={styles.caption} value={storyCaption} onChange={e=>setStoryCaption(e.target.value)} placeholder="Подпись к истории (необязательно)"/><div className={styles.stories}>{stories.map(s=><button className={styles.story} key={s.id} onClick={()=>window.open(s.media_url,'_blank')}><span className={styles.storyRing}><img src={s.media_url} alt=""/></span><b>@{s.username}</b><small>{s.caption||'История'}</small></button>)}{stories.length===0&&<div className={styles.empty}>Пока нет активных историй. Добавь первую — она будет доступна 24 часа.</div>}</div></section>
 <div className={styles.tabs}><button className={tab==='video'?styles.active:''} onClick={()=>setTab('video')}>▶ Видео</button><button className={tab==='music'?styles.active:''} onClick={()=>setTab('music')}>♫ Музыка</button></div>
 <section className={styles.publisher}><div><span>ПУБЛИКАЦИЯ</span><h2>{tab==='video'?'Новое видео':'Новый трек'}</h2></div><label className={styles.upload}>{busy?'Загрузка…':tab==='video'?'＋ Выбрать видео':'＋ Выбрать аудио'}<input type="file" accept={tab==='video'?'video/*':'audio/*'} disabled={busy} onChange={e=>e.target.files?.[0]&&publish(e.target.files[0])}/></label><input className={styles.title} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Название"/><textarea className={styles.description} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Описание"/></section>
 <section className={styles.list}>{visible.map(i=><article className={styles.card} key={i.id}>{i.kind==='video'?<video className={styles.video} src={i.media_url} controls playsInline preload="metadata" poster={i.cover_url||undefined}/>:<div className={styles.music}><div className={styles.cover}>♫</div><div><b>{i.title}</b><span>@{i.username}</span><audio src={i.media_url} controls preload="metadata"/></div></div>}<div className={styles.meta}><div><h3>{i.title}</h3><p>{i.description||'@'+i.username}</p></div><div className={styles.actions}><button className={i.liked?styles.liked:''} onClick={()=>like(i.id)}>♥ {i.like_count}</button><button onClick={()=>toggleComments(i.id)}>💬 {i.comment_count}</button><button onClick={()=>share(i.id)}>↗</button></div></div>{openComments[i.id]&&<div className={styles.comments}>{(comments[i.id]||[]).map(c=><div key={c.id}><b>@{c.username}</b><span>{c.content}</span></div>)}<div className={styles.commentForm}><input value={commentText[i.id]||''} onChange={e=>setCommentText(x=>({...x,[i.id]:e.target.value}))} placeholder="Комментарий…" maxLength={1000}/><button onClick={()=>addComment(i.id)}>Отправить</button></div></div>}</article>)}{visible.length===0&&<div className={styles.empty}>Здесь пока ничего нет. Загрузи первый файл выше.</div>}</section>
 </section></main>
}
