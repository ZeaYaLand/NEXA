'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from './ranking.module.css';

type Row = {
  rank:number; userId:string; username:string; displayName:string; avatarUrl:string|null;
  score:number; posts7d:number; likes7d:number; comments7d:number; followers:number;
  uniqueCommenters7d:number; balance:number; crown:'nexa'|'elite'|'crown'|null; crownEligible:boolean;
};

type RankingResponse = { ranking:Row[]; me:Row|null; generatedAt:string; crownRule:string };

export default function RankingPage(){
  const [data,setData]=useState<RankingResponse|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');

  const load=async()=>{
    setLoading(true); setError('');
    try{
      const r=await fetch('/api/ranking',{cache:'no-store'});
      const d=await r.json();
      if(!r.ok) throw new Error(d.error||'Не удалось загрузить рейтинг');
      setData(d);
    }catch(e){setError(e instanceof Error?e.message:'Не удалось загрузить рейтинг')}
    finally{setLoading(false)}
  };
  useEffect(()=>{load()},[]);

  return <main className={styles.page}>
    <aside className={styles.sidebar}>
      <Link href="/" className={styles.logo}>NEXA<span>.</span></Link>
      <nav>
        <Link href="/">⌂ <small>Главная</small></Link>
        <Link href="/search">⌕ <small>Поиск</small></Link>
        <Link href="/messages">✉ <small>Сообщения</small></Link>
        <Link href="/notifications">♡ <small>Уведомления</small></Link>
        <Link href="/profile">● <small>Профиль</small></Link>
        <Link className={styles.active} href="/ranking">♛ <small>Рейтинг</small></Link>
        <Link href="/communities">◈ <small>Сообщества</small></Link>
        <Link href="/settings">⚙ <small>Настройки</small></Link>
      </nav>
    </aside>

    <section className={styles.content}>
      <header className={styles.header}>
        <div><span>NEXA CORE / PULSE</span><h1>Рейтинг</h1><p>Здесь решает не один вирусный пост, а общий импульс человека.</p></div>
        <button onClick={load} disabled={loading}>{loading?'Обновляем…':'↻ Обновить'}</button>
      </header>

      <section className={styles.hero}>
        <div className={styles.crownMark}>♛</div>
        <div><span className={styles.eyebrow}>КОРОНА NEXA</span><h2>Попасть в топ недостаточно.</h2><p>Корону получает только человек из Top 10, который проходит качественный порог: минимум 2 публикации за 7 дней и 5 реальных реакций/комментариев.</p></div>
        <div className={styles.rule}><b>Top 10</b><span>+ качество</span></div>
      </section>

      {data?.me&&<section className={styles.me}><div><span className={styles.eyebrow}>ТВОЙ PULSE</span><strong>#{data.me.rank}</strong><p>{data.me.score.toLocaleString('ru-RU')} баллов · {data.me.crownEligible?'корона доступна':'продолжай наращивать импульс'}</p></div><div className={styles.progress}><i style={{width:`${Math.min(100, data.me.rank<=10?100:Math.max(8,100-data.me.rank))}%`}}/></div></section>}

      {error&&<div className={styles.error}>{error}<button onClick={load}>Повторить</button></div>}
      {loading&&!data?<div className={styles.loading}><span/><span/><span/></div>:<section className={styles.list}>
        {(data?.ranking??[]).map(row=><Link href={`/users/${row.username}`} className={`${styles.row} ${row.crownEligible?styles.crowned:''}`} key={row.userId}>
          <div className={styles.rank}>#{row.rank}</div>
          <div className={styles.avatar}>{row.avatarUrl?<img src={row.avatarUrl} alt=""/>:row.username[0]?.toUpperCase()}</div>
          <div className={styles.identity}><strong>{row.displayName||row.username}{row.crown&&<span className={styles.badge}>{row.crown==='nexa'?'♛ NEXA':row.crown==='elite'?'♛ ELITE':'♛'}</span>}</strong><small>@{row.username}</small></div>
          <div className={styles.signals}><span>{row.posts7d} пост.</span><span>{row.likes7d} реакц.</span><span>{row.comments7d} комм.</span><span>{row.followers} подпис.</span></div>
          <div className={styles.score}><b>{row.score.toLocaleString('ru-RU')}</b><small>Pulse</small></div>
        </Link>)}
        {!data?.ranking.length&&!error&&<div className={styles.empty}>Рейтинг пока пуст.</div>}
      </section>}

      <section className={styles.explain}><div><span>01</span><b>Импульс</b><p>Публикации, реакции, комментарии и рост аудитории.</p></div><div><span>02</span><b>Резонанс</b><p>Учитываются разные люди, а не повторяющиеся действия одного пользователя.</p></div><div><span>03</span><b>Баланс</b><p>Разные типы активности дают множитель, поэтому один показатель не может полностью захватить рейтинг.</p></div></section>
    </section>
  </main>;
}
