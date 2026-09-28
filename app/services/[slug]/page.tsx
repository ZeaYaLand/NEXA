'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import styles from '../services.module.css';

const data:Record<string,{title:string;tag:string;text:string;items:string[]}>={
 music:{title:'Музыка',tag:'NEXA MUSIC',text:'Музыкальный раздел NEXA с плейлистами и личной медиатекой.',items:['Моя музыка','Плейлисты','Недавно прослушанное','Избранное']},
 video:{title:'Видео',tag:'NEXA VIDEO',text:'Раздел для видео, клипов и медиаконтента.',items:['Видео','Клипы','Избранное','История просмотров']},
 stories:{title:'Истории',tag:'NEXA STORIES',text:'Короткие публикации, которые можно смотреть и публиковать.',items:['Мои истории','Друзья','Архив','Настройки историй']},
 events:{title:'События',tag:'NEXA EVENTS',text:'Мероприятия, встречи и события сообществ.',items:['Предстоящие','Мои события','Создать событие','Приглашения']}
};
export default function ServicePage(){const {slug}=useParams<{slug:string}>();const d=data[slug]??{title:'Раздел',tag:'NEXA',text:'Раздел платформы NEXA.',items:[]};return <main className="shell"><aside className="sidebar"><div className="brand">NEXA<span>.</span></div><nav><Link href="/">Главная</Link><Link href="/search">Поиск</Link><Link href="/messages">Сообщения</Link><Link href="/notifications">Уведомления</Link><Link href="/profile">Профиль</Link><Link href="/communities">Сообщества</Link><Link className="active" href="/services">Сервисы</Link><Link href="/settings">Настройки</Link></nav></aside><section className="feed"><header className="topbar"><div><p className="eyebrow">{d.tag}</p><h1>{d.title}</h1></div><Link className="avatar" href="/services">N</Link></header><section className={styles.hero}><span>{d.tag}</span><h2>{d.title}</h2><p>{d.text}</p></section><section className={styles.group}><h3>Разделы</h3><div className={styles.grid}>{d.items.map((x,i)=><div className={styles.card} key={x}><span className={styles.icon}>{['◉','♫','★','▣'][i%4]}</span><span className={styles.copy}><b>{x}</b><small>Раздел NEXA</small></span></div>)}</div></section><Link className="button" href="/services">← Все сервисы</Link></section></main>}
