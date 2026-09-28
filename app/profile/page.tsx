'use client';

import './profile.module.css';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type User = { id:string; username:string; email:string; displayName:string; bio:string; avatarUrl:string|null; createdAt:string };
type Post = { id:number|string; content:string; created_at:string; user_id:string };
type Person = { id:string; username:string; displayName:string|null; avatarUrl:string|null };

function compressImage(file:File):Promise<string>{
 return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onerror=()=>reject();reader.onload=()=>{const image=new Image();image.onerror=()=>reject();image.onload=()=>{const max=512,scale=Math.min(1,max/Math.max(image.width,image.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));const ctx=canvas.getContext('2d');if(!ctx)return reject();ctx.drawImage(image,0,0,canvas.width,canvas.height);resolve(canvas.toDataURL('image/jpeg',.78))};image.src=String(reader.result)};reader.readAsDataURL(file)})
}

export default function ProfilePage(){
 const router=useRouter(),fileInputRef=useRef<HTMLInputElement>(null);
 const [user,setUser]=useState<User|null>(null),[loading,setLoading]=useState(true),[editing,setEditing]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState('');
 const [posts,setPosts]=useState<Post[]>([]),[postsLoading,setPostsLoading]=useState(true),[followers,setFollowers]=useState<Person[]>([]),[following,setFollowing]=useState<Person[]>([]);
 const [connections,setConnections]=useState<'followers'|'following'|null>(null),[connectionsLoading,setConnectionsLoading]=useState(false);
 const [form,setForm]=useState({displayName:'',bio:'',avatarUrl:''});

 useEffect(()=>{let alive=true;fetch('/api/auth/me',{cache:'no-store'}).then(r=>r.json()).then(async me=>{if(!alive)return;if(!me.user){router.replace('/auth/login');return}setUser(me.user);setForm({displayName:me.user.displayName||me.user.username,bio:me.user.bio||'',avatarUrl:me.user.avatarUrl||''});setLoading(false);
  try{const r=await fetch('/api/posts',{cache:'no-store'});const d=await r.json();if(alive&&r.ok)setPosts((Array.isArray(d.posts)?d.posts:[]).filter((p:Post)=>String(p.user_id)===String(me.user.id)))}catch{}finally{if(alive)setPostsLoading(false)}
  try{const [fr,fg]=await Promise.all([fetch(`/api/users/${encodeURIComponent(me.user.username)}/connections?type=followers`,{cache:'no-store'}),fetch(`/api/users/${encodeURIComponent(me.user.username)}/connections?type=following`,{cache:'no-store'})]);const [fd,gd]=await Promise.all([fr.json(),fg.json()]);if(alive){if(fr.ok)setFollowers(Array.isArray(fd.users)?fd.users:[]);if(fg.ok)setFollowing(Array.isArray(gd.users)?gd.users:[])}}catch{}
 }).catch(()=>{if(alive){router.replace('/auth/login');setLoading(false);setPostsLoading(false)}});return()=>{alive=false}},[router]);

 async function refreshConnections(type:'followers'|'following'){if(!user)return;setConnections(type);setConnectionsLoading(true);try{const r=await fetch(`/api/users/${encodeURIComponent(user.username)}/connections?type=${type}`,{cache:'no-store'}),d=await r.json();if(r.ok){const list=Array.isArray(d.users)?d.users:[];if(type==='followers')setFollowers(list);else setFollowing(list)}}finally{setConnectionsLoading(false)}}
 async function logout(){await fetch('/api/auth/logout',{method:'POST'});router.replace('/auth/login');router.refresh()}
 async function chooseAvatar(e:React.ChangeEvent<HTMLInputElement>){const file=e.target.files?.[0];e.target.value='';if(!file)return;if(!file.type.startsWith('image/')||file.size>10*1024*1024){setError('Выбери изображение до 10 МБ.');return}try{const data=await compressImage(file);if(data.length>290000){setError('Изображение получилось слишком большим.');return}setForm(v=>({...v,avatarUrl:data}));setError('')}catch{setError('Не удалось обработать изображение.')}}
 async function save(e:React.FormEvent){e.preventDefault();if(!form.displayName.trim()){setError('Имя не может быть пустым.');return}setSaving(true);setError('');try{const r=await fetch('/api/profile',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)}),d=await r.json();if(!r.ok)throw new Error(d.error||'Не удалось сохранить');setUser(d.user);setForm({displayName:d.user.displayName||d.user.username,bio:d.user.bio||'',avatarUrl:d.user.avatarUrl||''});setEditing(false)}catch(e){setError(e instanceof Error?e.message:'Не удалось сохранить изменения.')}finally{setSaving(false)}}

 if(loading)return <main className="shell"><section className="feed profile-loading"><p>Загрузка профиля…</p></section></main>;
 if(!user)return null;
 const initial=(user.displayName||user.username)[0]?.toUpperCase()||'N';
 const joined=new Date(user.createdAt);
 const joinedLabel=Number.isNaN(joined.getTime())?'Недавно':joined.toLocaleDateString('ru-RU',{month:'long',year:'numeric'});
 const connectionPeople=connections==='followers'?followers:following;

 return <main className="shell">
  <aside className="sidebar"><div className="brand">NEXA<span>.</span></div><nav><Link href="/">Home</Link><Link href="/search">Search</Link><Link href="/messages">Messages</Link><Link href="/notifications">Notifications</Link><Link className="active" href="/profile">Profile</Link><Link href="/settings">Settings</Link></nav></aside>
  <section className="feed">
   <header className="topbar"><div><p className="eyebrow">YOUR SPACE</p><h1>Профиль</h1></div><Link className="avatar" style={{overflow:'hidden'}} href="/profile">{user.avatarUrl?<img src={user.avatarUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>:initial}</Link></header>
   <section className="profile-hero"><div className="profile-cover"/><div className="profile-main">
    <div className="profile-avatar gradient">{user.avatarUrl?<img src={user.avatarUrl} alt="Аватар"/>:initial}</div>
    <div className="profile-actions"><button className="profile-action primary" onClick={()=>{setError('');setEditing(true)}}>Редактировать</button><button className="profile-action secondary" onClick={logout}>Выйти</button></div>
    <h2>{user.displayName||user.username}</h2><p className="profile-username">@{user.username}</p>{user.bio?<p className="profile-bio">{user.bio}</p>:<p className="profile-bio muted">Добавь описание профиля</p>}<p className="profile-email">{user.email}</p>
    <div className="profile-stats-grid">
     <div className="profile-stat"><strong>{posts.length}</strong><span>Публикации</span></div>
     <button type="button" className="profile-stat profile-stat-button" onClick={()=>refreshConnections('followers')}><strong>{followers.length}</strong><span>Подписчики</span></button>
     <button type="button" className="profile-stat profile-stat-button" onClick={()=>refreshConnections('following')}><strong>{following.length}</strong><span>Подписки</span></button>
     <div className="profile-stat"><strong>NEXA</strong><span>В NEXA с {joinedLabel}</span></div>
    </div>
   </div></section>

   {connections && <section className="profile-connections"><div className="profile-connections-head"><div><p className="eyebrow">NEXA NETWORK</p><h3>{connections==='followers'?'Твои подписчики':'Твои подписки'}</h3></div><button type="button" className="profile-connections-close" onClick={()=>setConnections(null)}>×</button></div>
    {connectionsLoading?<p className="muted">Загрузка…</p>:connectionPeople.length===0?<p className="muted">Пока здесь никого нет.</p>:<div className="profile-people-list">{connectionPeople.map(person=><Link key={person.id} href={`/users/${person.username}`} onClick={()=>setConnections(null)} className="profile-person"><span className="mini-avatar gradient">{person.avatarUrl?<img src={person.avatarUrl} alt=""/>:((person.displayName||person.username)[0]?.toUpperCase()||'N')}</span><span><strong>{person.displayName||person.username}</strong><small>@{person.username}</small></span></Link>)}</div>}
   </section>}

   <div className="profile-tabs"><button className="selected">Посты <span style={{opacity:.6}}>· {posts.length}</span></button><button disabled>Медиа</button><button disabled>Лайки</button></div>
   <section>{postsLoading?<div className="profile-empty"><h3>Загружаем публикации…</h3></div>:posts.length===0?<div className="profile-empty"><div className="profile-empty-icon">✦</div><h3>Твоё пространство</h3><p>Создай первую публикацию — она появится здесь.</p><Link href="/" style={{display:'inline-block',marginTop:16,color:'#fff',textDecoration:'none',fontWeight:800}}>Создать пост →</Link></div>:posts.map(post=><article className="post" key={post.id}><div className="post-head"><div className="mini-avatar gradient">{initial}</div><div><strong>{user.displayName||user.username}</strong><span>@{user.username} · {new Date(post.created_at).toLocaleDateString('ru-RU')}</span></div></div><p className="post-text">{post.content}</p><div className="post-footer"><span>Публикация</span><span>{new Date(post.created_at).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}</span></div></article>)}</section>
  </section>

  {editing&&<div className="profile-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setEditing(false)}}><form className="profile-modal" onSubmit={save}><div className="profile-modal-head"><div><p className="eyebrow">NEXA PROFILE</p><h2>Редактировать профиль</h2></div><button type="button" className="modal-close" onClick={()=>setEditing(false)}>×</button></div><div className="avatar-editor"><div className="profile-avatar gradient avatar-editor-preview">{form.avatarUrl?<img src={form.avatarUrl} alt="Предпросмотр"/>:initial}</div><button type="button" className="profile-action secondary" onClick={()=>fileInputRef.current?.click()}>Выбрать фото</button><input ref={fileInputRef} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseAvatar}/></div><label>Имя<input value={form.displayName} maxLength={60} onChange={e=>setForm({...form,displayName:e.target.value})}/></label><label>О себе<textarea value={form.bio} maxLength={160} rows={4} onChange={e=>setForm({...form,bio:e.target.value})}/></label>{error&&<p className="profile-form-error">{error}</p>}<div className="profile-modal-actions"><button type="button" className="profile-action secondary" onClick={()=>setEditing(false)}>Отмена</button><button className="profile-action primary" disabled={saving}>{saving?'Сохраняем…':'Сохранить'}</button></div></form></div>}
 </main>
}
